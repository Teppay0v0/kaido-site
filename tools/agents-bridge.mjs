#!/usr/bin/env node
/**
 * agents-bridge.mjs — Claude Code セッションログ → ブラウザ SSE ブリッジ
 *
 * Claude Code のトランスクリプト (~/.claude/projects/<slug>/<session>.jsonl) を
 * 監視し、エージェントの稼働イベントを Server-Sent Events で agents.html に流す。
 * ついでにこのリポジトリを静的配信するので、これ1本で LIVE モードが動く。
 *
 * 使い方:
 *   node tools/agents-bridge.mjs            # http://localhost:8787/agents.html を開く
 *   PORT=9000 node tools/agents-bridge.mjs  # ポート変更
 *   node tools/agents-bridge.mjs /path/to/project  # 監視対象プロジェクトを指定
 *
 * 依存パッケージなし (Node 18+)。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT || 8787);
const SITE_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const projectCwd = path.resolve(process.argv[2] || SITE_ROOT);
const slug = projectCwd.replace(/[/.]/g, '-');
const transcriptDir = path.join(os.homedir(), '.claude', 'projects', slug);

/* ---------------- SSE clients ---------------- */
const clients = new Set();
function broadcast(ev) {
  const payload = `data: ${JSON.stringify(ev)}\n\n`;
  for (const res of clients) res.write(payload);
}
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 15000);

/* ---------------- transcript tailing ----------------
 * メインセッション:  <transcriptDir>/<session>.jsonl
 * サブエージェント:  <transcriptDir>/<session>/subagents/agent-*.jsonl
 * どちらも新しい行だけ読み進めてイベント化する。
 */
let currentFile = null;              // メインセッションの jsonl
const tails = new Map();             // filePath -> {offset, partial, chain}
const announcedChains = new Set();

function newestJsonl() {
  try {
    const files = fs.readdirSync(transcriptDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => path.join(transcriptDir, f))
      .map(p => ({ p, m: fs.statSync(p).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    return files[0]?.p || null;
  } catch { return null; }
}

function subagentFiles() {
  if (!currentFile) return [];
  const dir = path.join(transcriptDir, path.basename(currentFile, '.jsonl'), 'subagents');
  try {
    return fs.readdirSync(dir)
      .filter(f => f.startsWith('agent-') && f.endsWith('.jsonl'))
      .map(f => path.join(dir, f));
  } catch { return []; }
}

function handleLine(line, chainFromFile, replay) {
  let d;
  try { d = JSON.parse(line); } catch { return; }
  const type = d.type;
  // フック実行のサマリ (Stopフック等) → 可視化イベント
  if (type === 'system' && d.subtype && d.subtype.includes('hook')) {
    const infos = Array.isArray(d.hookInfos) ? d.hookInfos : [];
    broadcast({
      t: 'hook', replay,
      commands: infos.map(h => String(h.command || '').split('/').pop().slice(0, 60)),
      totalMs: infos.reduce((s, h) => s + (h.durationMs || 0), 0),
      errors: Array.isArray(d.hookErrors) ? d.hookErrors.length : 0,
    });
    return;
  }
  if (type !== 'assistant' && type !== 'user') return;

  const sidechain = !!d.isSidechain || !!chainFromFile;
  const chain = chainFromFile || (sidechain ? (d.parentUuid || d.uuid) : null);

  const msg = d.message || {};
  const content = msg.content;

  if (type === 'user') {
    if (typeof content === 'string') {
      if (sidechain) {
        // サブエージェント起動: 最初の user メッセージがタスク指示
        if (!announcedChains.has(chain)) {
          announcedChains.add(chain);
          broadcast({ t: 'agent_spawn', chain, task: content.slice(0, 140), replay });
        }
      } else {
        broadcast({ t: 'user', text: content.slice(0, 300), replay });
      }
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'tool_result') {
          const txt = typeof block.content === 'string' ? block.content
            : Array.isArray(block.content) ? block.content.map(b => b.text || '').join(' ') : '';
          broadcast({
            t: 'tool_result', sidechain, chain, id: block.tool_use_id,
            isError: !!block.is_error, excerpt: txt.slice(0, 160), replay,
          });
          if (!sidechain) {
            // Agent ツールの結果には "agentId: xxxx" が含まれる → サブエージェント完了
            const m = txt.match(/agentId:\s*([a-z0-9]+)/);
            if (m) markDone('agent-' + m[1], replay);
            // TaskCreate の結果 "Task #N created successfully: <subject>" → ボードに追加
            if (pendingTaskCreates.has(block.tool_use_id)) {
              const subject = pendingTaskCreates.get(block.tool_use_id);
              pendingTaskCreates.delete(block.tool_use_id);
              const tm = txt.match(/#(\d+)/);
              broadcast({ t: 'task_add', id: tm ? tm[1] : block.tool_use_id, subject, replay });
            }
          }
        } else if (block.type === 'text' && !sidechain) {
          broadcast({ t: 'user', text: String(block.text || '').slice(0, 300), replay });
        }
      }
    }
    return;
  }

  // assistant
  if (!Array.isArray(content)) return;
  for (const block of content) {
    if (block.type === 'text' && block.text?.trim()) {
      broadcast({ t: 'assistant_text', sidechain, chain, text: block.text.slice(0, 400), replay });
    } else if (block.type === 'tool_use') {
      const name = block.name || '?';
      const input = block.input || {};
      if (name === 'Agent' || name === 'Task') {
        broadcast({
          t: 'delegate', sidechain, chain, id: block.id,
          desc: String(input.description || input.prompt || '').slice(0, 140),
          agentType: input.subagent_type || '', replay,
        });
      } else if (name === 'TodoWrite' && Array.isArray(input.todos)) {
        // 標準Claude CodeのTODOリスト → ボード全置換
        broadcast({
          t: 'todos', replay,
          todos: input.todos.map(td => ({
            content: String(td.content || '').slice(0, 80),
            status: td.status || 'pending',
          })),
        });
      } else if (name === 'TaskCreate') {
        // 実IDは tool_result 側で判明するので保留
        pendingTaskCreates.set(block.id, String(input.subject || input.description || '').slice(0, 80));
      } else if (name === 'TaskUpdate') {
        broadcast({
          t: 'task_update', replay,
          id: String(input.taskId || ''), status: input.status || '',
          subject: input.subject ? String(input.subject).slice(0, 80) : '',
        });
      } else {
        const detail = String(input.description || input.file_path || input.pattern || input.command || input.query || '').slice(0, 120);
        broadcast({ t: 'tool_use', sidechain, chain, id: block.id, name, detail, replay });
      }
    }
  }
}

const pendingTaskCreates = new Map(); // tool_use id -> subject
const doneChains = new Set();
function markDone(chain, replay = false) {
  if (doneChains.has(chain)) return;
  doneChains.add(chain);
  broadcast({ t: 'agent_done', chain, replay });
}

function tailFile(file, chain, replay = false) {
  let t = tails.get(file);
  if (!t) { t = { offset: 0, partial: '' }; tails.set(file, t); }
  let stat;
  try { stat = fs.statSync(file); } catch { return; }
  if (stat.size < t.offset) { t.offset = 0; t.partial = ''; }
  if (stat.size === t.offset) return;
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(stat.size - t.offset);
  fs.readSync(fd, buf, 0, buf.length, t.offset);
  fs.closeSync(fd);
  t.offset = stat.size;
  t.lastGrowth = Date.now();
  t.chain = chain;
  const text = t.partial + buf.toString('utf8');
  const lines = text.split('\n');
  t.partial = lines.pop() || '';
  for (const line of lines) if (line.trim()) handleLine(line, chain, replay);
}

function switchToNewestFile() {
  const f = newestJsonl();
  if (f && f !== currentFile) {
    currentFile = f;
    console.log(`[bridge] watching ${path.basename(f)}`);
    broadcast({ t: 'session', file: path.basename(f) });
    // 接続直後の状態同期用: 直近30KBだけ replay 扱いで読み飛ばす
    try {
      const size = fs.statSync(f).size;
      const t = { offset: Math.max(0, size - 30_000), partial: '' };
      if (t.offset > 0) { // 行頭合わせ
        const fd = fs.openSync(f, 'r');
        const b = Buffer.alloc(Math.min(2000, size - t.offset));
        fs.readSync(fd, b, 0, b.length, t.offset);
        fs.closeSync(fd);
        const nl = b.indexOf(10);
        if (nl >= 0) t.offset += nl + 1;
      }
      tails.set(f, t);
      tailFile(f, null, true);
    } catch {}
  }
}

const bridgeStart = Date.now();
function tick() {
  switchToNewestFile();
  if (currentFile) tailFile(currentFile, null);
  for (const sf of subagentFiles()) {
    // ブリッジ起動前から存在するサブエージェントログは replay 扱い(演出しない)。
    // 起動後に生まれたファイルだけをライブイベントとして流す。
    let replay = false;
    if (!tails.has(sf)) {
      try { replay = fs.statSync(sf).birthtimeMs < bridgeStart; } catch {}
    } else {
      replay = tails.get(sf).replayAll || false;
    }
    if (!tails.has(sf)) tails.set(sf, { offset: 0, partial: '', replayAll: replay });
    tailFile(sf, path.basename(sf, '.jsonl'), replay);
  }
  // 保険: 12秒間ログが伸びていないサブエージェントは完了扱い
  for (const [, t] of tails) {
    if (t.chain && announcedChains.has(t.chain) && !doneChains.has(t.chain)
        && t.lastGrowth && Date.now() - t.lastGrowth > 12_000) {
      markDone(t.chain);
    }
  }
}
setInterval(tick, 700);

/* ---------------- company mode (Claude Code ヘッドレス案件管理) ----------------
 * 案件ごとに `claude -p --input-format stream-json` の子プロセスを起動し、
 * UI から指示 (instruct) を stdin に流し込み、stdout の stream-json を SSE 化する。
 */
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const company = new Map(); // id -> {id,name,cwd,status,lastReport,lastInstruction,proc,startedAt}
const MAX_CASES = 6;

function caseView(c) {
  return { id: c.id, name: c.name, cwd: c.cwd, status: c.status,
    lastReport: c.lastReport, lastInstruction: c.lastInstruction };
}

function sendInstruction(c, text) {
  try {
    c.proc.stdin.write(JSON.stringify({
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text }] },
    }) + '\n');
  } catch {}
  c.lastInstruction = text.slice(0, 200);
  c.status = 'working';
  broadcast({ t: 'c_instructed', id: c.id, text: text.slice(0, 200) });
}

function attachCaseProcess(c) {
  let stdoutBuf = '';
  c.proc.stdout.on('data', (chunk) => {
    stdoutBuf += chunk.toString('utf8');
    const lines = stdoutBuf.split('\n');
    stdoutBuf = lines.pop() || '';
    for (const line of lines) {
      const s = line.trim();
      if (!s) continue;
      let d;
      try { d = JSON.parse(s); } catch { continue; }
      if (d.type === 'assistant' && d.message && Array.isArray(d.message.content)) {
        for (const block of d.message.content) {
          if (block.type === 'text' && typeof block.text === 'string') {
            c.lastReport = block.text.slice(0, 600);
            broadcast({ t: 'c_text', id: c.id, text: block.text.slice(0, 400) });
          } else if (block.type === 'tool_use') {
            const name = block.name || '?';
            const input = block.input || {};
            let detail;
            if (name === 'Agent' || name === 'Task') {
              detail = String(input.description || '').slice(0, 120);
            } else {
              detail = String(input.description || input.file_path || input.pattern
                || input.command || input.query || '').slice(0, 120);
            }
            broadcast({ t: 'c_tool', id: c.id, name, detail });
          }
        }
      } else if (d.type === 'result') {
        c.status = 'idle';
        broadcast({ t: 'c_done', id: c.id, result: String(d.result || '').slice(0, 300) });
      } else if (d.type === 'system' && d.subtype === 'init') {
        broadcast({ t: 'c_ready', id: c.id });
      }
      // パースできても該当しない type は無視
    }
  });
  c.proc.stderr.on('data', (chunk) => {
    const now = Date.now();
    if (c.lastErrAt && now - c.lastErrAt < 5000) return; // 連発防止: 5秒に1回
    c.lastErrAt = now;
    broadcast({ t: 'c_err', id: c.id, text: chunk.toString('utf8').slice(0, 200) });
  });
  c.proc.on('exit', (code) => {
    if (c.status !== 'stopped') c.status = 'ended';
    broadcast({ t: 'c_exit', id: c.id, code });
  });
}

function hireCase({ name, cwd, prompt, model }) {
  const id = 'c' + Date.now().toString(36);
  const useCwd = cwd || projectCwd;
  let proc;
  try {
    proc = spawn(CLAUDE_BIN, [
      '-p', '--output-format', 'stream-json', '--input-format', 'stream-json',
      '--verbose', '--permission-mode', 'acceptEdits', '--model', model || 'opus',
    ], { cwd: useCwd, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    return { ok: false, error: 'claude CLIが見つかりません' };
  }
  const c = {
    id, name: name || id, cwd: useCwd, status: 'working',
    lastReport: '', lastInstruction: '', proc, startedAt: Date.now(),
  };
  // spawn の ENOENT 等は非同期で 'error' として飛ぶ。ここで拾って未捕捉クラッシュを防ぎ、
  // UI には c_err で通知する (HTTP 応答は既に {ok:true} を返している)。
  proc.on('error', () => {
    if (c.status !== 'stopped') c.status = 'ended';
    broadcast({ t: 'c_err', id: c.id, text: 'claude CLIが見つかりません' });
  });
  company.set(id, c);
  attachCaseProcess(c);
  if (prompt) sendInstruction(c, prompt);
  return { ok: true, id };
}

function killAllCases() {
  for (const c of company.values()) {
    try { c.proc.kill('SIGTERM'); } catch {}
  }
}

/* ---------------- HTTP server (SSE + static) ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`data: ${JSON.stringify({ t: 'hello', project: projectCwd, session: currentFile ? path.basename(currentFile) : null })}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  /* ---- company mode API ---- */
  if (url.pathname.startsWith('/company/')) {
    const jsonHead = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };
    const sendJson = (code, obj) => { res.writeHead(code, jsonHead); res.end(JSON.stringify(obj)); };
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
      });
      res.end();
      return;
    }
    if (url.pathname === '/company/state' && req.method === 'GET') {
      sendJson(200, { ok: true, cases: [...company.values()].map(caseView) });
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch { sendJson(400, { ok: false, error: 'invalid JSON' }); return; }
        if (url.pathname === '/company/hire') {
          if (company.size >= MAX_CASES) { sendJson(400, { ok: false, error: '案件は最大6件までです' }); return; }
          const r = hireCase(data || {});
          sendJson(r.ok ? 200 : 200, r);
          return;
        }
        if (url.pathname === '/company/instruct') {
          const c = company.get(data && data.id);
          if (!c) { sendJson(400, { ok: false, error: 'unknown id' }); return; }
          sendInstruction(c, String((data && data.text) || ''));
          sendJson(200, { ok: true });
          return;
        }
        if (url.pathname === '/company/stop') {
          const c = company.get(data && data.id);
          if (!c) { sendJson(400, { ok: false, error: 'unknown id' }); return; }
          try { c.proc.kill('SIGTERM'); } catch {}
          c.status = 'stopped';
          sendJson(200, { ok: true });
          return;
        }
        sendJson(404, { ok: false, error: 'not found' });
      });
      return;
    }
    sendJson(404, { ok: false, error: 'not found' });
    return;
  }

  // static
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/agents.html';
  const file = path.join(SITE_ROOT, path.normalize(p).replace(/^([/\\])+/, ''));
  if (!file.startsWith(SITE_ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`[bridge] トイワホ製作所 (TOIWAHO WORKS) bridge`);
  console.log(`[bridge] site   : http://localhost:${PORT}/agents.html`);
  console.log(`[bridge] events : http://localhost:${PORT}/events`);
  console.log(`[bridge] project: ${projectCwd}`);
  console.log(`[bridge] logs   : ${transcriptDir}`);
  console.log(`[bridge] company mode: POST /company/hire で案件を雇用できます (CLAUDE_BIN=${CLAUDE_BIN})`);
  switchToNewestFile();
});

/* ---------------- shutdown: 全子プロセスを kill ---------------- */
function shutdown() {
  killAllCases();
  try { server.close(); } catch {}
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
