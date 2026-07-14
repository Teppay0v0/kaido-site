# KAIDO STUDIO — エージェント・オフィス (`agents.html`)

Claude Codeのエージェント達がオフィスで働く様子を可視化するページ。3つのモードがあります。

## 🎬 デモモード（デフォルト）

台本による演出。`agents.html` をブラウザで開くだけで動きます。
「LP作って / バグ直して / 記事書いて / 新機能ちょうだい」の4ワークフロー。

## 🤖 AIモード — 会話と成果物を本物のOpusが生成

キャラ達の会話台本と成果物（LPのHTML・記事）を **claude-opus-4-8** がリアルタイム生成します。

1. 右上の ⚙️ 設定から Anthropic APIキー（`sk-ant-...`）を保存
2. 上部タブで「🤖 AI」に切替
3. 「温泉旅館のLP作って」などと指示

- 台本は構造化出力（JSON Schema）で1コール、成果物はストリーミング生成
- 生成中はオフィスの大型モニターにコードが流れます
- 完成するとプレビュー（iframe・JS無効サンドボックス）＋ダウンロードボタン
- APIキーはブラウザの localStorage にのみ保存されます。**共有PCでは使用後に消去してください**

## 📡 LIVEモード — 実際のClaude Codeセッションを中継

ローカルで動いているClaude Codeのセッションログ
（`~/.claude/projects/<プロジェクト>/`）をブリッジサーバーが監視し、
実際のエージェント稼働を画面に反映します。

```bash
# リポジトリのルートで
node tools/agents-bridge.mjs            # このリポジトリのセッションを監視
node tools/agents-bridge.mjs ~/my-app   # 別プロジェクトを監視
PORT=9000 node tools/agents-bridge.mjs  # ポート変更
```

ブラウザで http://localhost:8787/agents.html を開き「📡 LIVE」タブへ。

| Claude Code側の出来事 | 画面上の演出 |
|---|---|
| アシスタントの発言 | PMの吹き出し＋ログ |
| Bash / Write / Edit | リクが作業 |
| Read / Grep / Glob | ソウが調査 |
| WebSearch / WebFetch | ナギが調べもの |
| サブエージェント起動 | 空いてるメンバーがタスク受領→自席で作業中に |
| 短時間に複数サブエージェント起動 | PMが会議テーブルで「並列でいくよ、手分けして！」と号令 |
| サブエージェント完了 | ✅を出して待機に戻る |
| TodoWrite / TaskCreate / TaskUpdate | 左上の**スプリントボード**にTODOが貼り出され、進捗(☐/🔨/✅)が更新される |
| ツールの失敗 (is_error) | 担当キャラが💦を出して震え、ログに赤字でエラー内容 |
| タスク完了 | PMが✅、ログに完了記録 |

- 完了検知はメインセッションのAgentツール結果（`agentId:`）＋12秒無活動タイムアウト
- 接続時に過去ログは再生しません（接続後の新しいイベントのみ演出）
- 依存パッケージなし（Node 18+）

## キャラクター

6方向スプライト（`assets/images/agents/<name>-{front,front45,left,right,back,back45}.png`）。
移動方向に応じて向きが切り替わります。差し替えは同名PNGを置き換えるだけ。

| ID | 名前 | 役割 |
|---|---|---|
| pm | マネジャー | PM（指揮官） |
| design | アオイ | Designer |
| front | リク | Frontend |
| back | ハル | Backend |
| write | ナギ | Writer |
| qa | ソウ | QA（探偵） |
