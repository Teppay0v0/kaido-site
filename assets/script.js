// ===== Header on-hero state (transparent over hero, opaque after) =====
const header    = document.getElementById('header');
const heroEl    = document.getElementById('hero');
const heroFront = document.getElementById('heroFront');
const heroBase  = document.querySelector('.hero-layer.hero-base');
const heroVert  = document.getElementById('heroVert');

// ===== Hero scroll-driven 2-stage clip =====
// Layout: .hero is 300vh tall; inside it .hero-stage is sticky (100vh) and stays pinned.
// Scrollable distance inside hero = 300vh - 100vh = 200vh.
// progress p (0 → 1) maps to that scroll range.
//
//   STAGE 1  (0 → STAGE1_END):
//     hero1 is clipped from the LEFT → its left edge retreats rightward,
//     gradually exposing hero2 underneath, from the left side first.
//     clip-path: inset(0 0 0 X%)  where X grows 0 → KEEP_LEFT.
//
//   STAGE 2  (STAGE1_END → 1):
//     The remaining sliver of hero1 occupies the right portion of the screen
//     (a narrow strip on the right, ~1/3 of width). It now retreats from
//     the BOTTOM upward, sweeping itself away.
//     clip-path: inset(0 0 Y% KEEP_LEFT%)  where Y grows 0 → 100.
//
// After stage 2: hero1 fully gone, only hero2 visible.
const STAGE1_END  = 0.55;   // proportion of total scroll dedicated to stage 1
const KEEP_LEFT   = 66.66;  // % of width hidden from the left at end of stage 1
                            //   → leaves a ~33% strip of hero1 on the right
const easeOut = t => 1 - Math.pow(1 - t, 2.2);

function tick(){
  // Sub-pages (rooms/gallery/access) have no #hero — skip all hero logic.
  // Their header is rendered statically as `.header.scrolled` in the HTML.
  if(!heroEl) return;
  const rect  = heroEl.getBoundingClientRect();
  const total = heroEl.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), total);
  const p = total > 0 ? scrolled / total : 0;

  // ===== Vertical center text fade =====
  // Fade 「あなたを開く」 out as the user starts scrolling. By the time the
  // scroll-line indicator has visibly traveled (about p ≈ 0.18 of hero scroll),
  // the text is fully gone. Below that threshold the entrance animation
  // governs the opacity (target .92), so we only intervene once scrolling begins.
  if(heroVert){
    const FADE_END = 0.18;
    if(p <= 0){
      heroVert.style.opacity = '';   // let entrance animation drive it
    } else {
      const fade = Math.max(0, 1 - p / FADE_END);
      heroVert.style.opacity = (0.92 * fade).toFixed(3);
    }
  }

  // Mobile shows the logo CENTERED horizontally (no left clip during stage 1) — the
  // narrow viewport doesn't have room for the right-strip framing the desktop uses.
  const _vw0 = window.innerWidth;
  const isMobileHero = _vw0 <= 680;
  const keepLeft = isMobileHero ? 0 : KEEP_LEFT;

  let clipL = 0, clipR = 0, clipB = 0;

  if(p <= STAGE1_END){
    // Stage 1 — eat hero1 from the LEFT (desktop). On mobile, keepLeft is 0 → no clip yet.
    const t = easeOut(p / STAGE1_END);
    clipL = t * keepLeft;
  } else {
    // Stage 2 — sweep the remaining strip (or, on mobile, the full image) from BOTTOM.
    const t = easeOut((p - STAGE1_END) / (1 - STAGE1_END));
    clipL = keepLeft;
    clipB = t * 100;
  }

  heroFront.style.clipPath = `inset(0% ${clipR}% ${clipB}% ${clipL}%)`;

  // ===== Static positioning of hero1 image =====
  // hero1 must FULLY COVER the viewport at all times (no gaps showing hero2 underneath).
  // At the same time, the logo (at LOGO_X, LOGO_Y inside the image) must be positioned so it
  // appears horizontally at the center of the right (100-KEEP_LEFT)% band of the viewport.
  //
  // Approach:
  //   1. Start with a "cover" scale: image is large enough that BOTH dimensions ≥ viewport.
  //   2. Compute the desired bgLeft to put the logo at the band center.
  //   3. If that bgLeft would expose blank space on either side (bgLeft > 0 OR bgLeft + imgW < vw),
  //      enlarge the image until it can both cover the viewport AND honor the logo position.
  // === ロゴを常に「右1/3ストリップの中心」に固定（画面比に依存しない座標ロジック）===
  // 基準は hero-front 要素の実寸（額装インセット後の実際の描画ボックス）。
  // 画像の既知点 (LOGO_X, LOGO_Y) を、ボックス内の目標点 (TX, TY) に重ねる。
  // どのアスペクト比でも cover を保ちつつロゴ位置を厳守。resize毎に再計算。
  const _b = heroFront.getBoundingClientRect();
  const bw = _b.width  || window.innerWidth;
  const bh = _b.height || window.innerHeight;
  const LOGO_X = 0.7837;   // hero1-brass-logo.jpg 内のロゴ中心(実測, 横)
  const LOGO_Y = 0.4763;   // 同上(縦)
  const IMG_AR = 2400 / 1600;             // = 1.5
  const TX = (100 + keepLeft) / 200;       // desktop:0.833(右1/3中心) / mobile:0.5
  const TY = 0.5;                          // ボックス縦中心

  // cover + 余白ゼロ + ロゴ位置厳守 を全て満たす最小幅を求める
  const wCover  = bw;                                  // 横カバー
  const wCoverH = bh * IMG_AR;                          // 縦カバー
  const wLeft   = (TX * bw) / LOGO_X;                   // 左に隙間を作らない
  const wRight  = (bw * (1 - TX)) / (1 - LOGO_X);       // 右に隙間を作らない
  const wTop    = ((TY * bh) / LOGO_Y) * IMG_AR;        // 上に隙間を作らない
  const wBottom = ((bh * (1 - TY)) / (1 - LOGO_Y)) * IMG_AR; // 下に隙間を作らない
  const imgW = Math.max(wCover, wCoverH, wLeft, wRight, wTop, wBottom);
  const imgH = imgW / IMG_AR;
  const bgLeft = TX * bw - imgW * LOGO_X;
  const bgTop  = TY * bh - imgH * LOGO_Y;

  heroFront.style.backgroundSize     = `${imgW}px ${imgH}px`;
  heroFront.style.backgroundPosition = `${bgLeft}px ${bgTop}px`;

  // === 後ろ(エントランス)画像も座標ロジックで「エントランス開口部」を常にボックス中心へ ===
  // 画面比に依存せず、焦点(FX,FY)をボックス中心(0.5,0.5)に重ねる。resize対応。
  if(heroBase){
    const eb = heroBase.getBoundingClientRect();
    const ew = eb.width  || window.innerWidth;
    const eh = eb.height || window.innerHeight;
    const EAR = 2040 / 1601;                 // hero2(左15%トリミング後)の実アスペクト
    // 間口(開口部)の中心を、画面比に依存せず常にボックス中央へ固定。
    // 焦点(FX,FY)をボックス中心(0.5,0.5)に重ね、cover+余白ゼロを担保。
    const FX = 0.398, FY = 0.58;             // 開口部中心(左右壁が表示上均等になるよう微調整)
    const TX = 0.5,   TY = 0.5;              // ボックス中央に置く
    const wCover  = ew;
    const wCoverH = eh * EAR;
    const wLeft   = (TX * ew) / FX;
    const wRight  = (ew * (1 - TX)) / (1 - FX);
    const wTop    = ((TY * eh) / FY) * EAR;
    const wBottom = ((eh * (1 - TY)) / (1 - FY)) * EAR;
    const ewW = Math.max(wCover, wCoverH, wLeft, wRight, wTop, wBottom);
    const ewH = ewW / EAR;
    heroBase.style.backgroundSize     = `${ewW}px ${ewH}px`;
    heroBase.style.backgroundPosition = `${TX * ew - ewW * FX}px ${TY * eh - ewH * FY}px`;
  }

  // Fade out the overlay text as we move through stage 1.
  // By the time stage 1 ends, only the photograph speaks.
  const overlay = document.getElementById('heroOverlay');
  if(overlay){
    const t = Math.max(0, 1 - (p / STAGE1_END) * 1.4);
    overlay.style.opacity = t;
  }

  // ===== Atelier — scroll-driven photo placement =====
  updateAtelier();

  // Header state: stay "on-hero" until we've passed the first viewport-worth of scroll.
  if(scrolled < window.innerHeight * 0.6){
    header.classList.add('on-hero');
    header.classList.remove('scrolled');
  } else {
    header.classList.remove('on-hero');
    header.classList.add('scrolled');
  }
}

// ===== Atelier — random photos placed onto a desk =====
// Layout: .atelier is 560vh; inside, .atelier-stage is sticky (100vh).
// On every page load, pick 4 random images from the pool of 7 and assign them to the 4 slots.
// Then, as the user scrolls through the section, each photo descends from above and settles
// into its slot's resting position. Each visit therefore shows a different combination & order.
//
// IMPORTANT: these declarations must come BEFORE the first tick() call, because tick() invokes
// updateAtelier() which references these constants. `const` is in the Temporal Dead Zone until
// its declaration is reached — calling tick() too early would throw ReferenceError and break
// every subsequent piece of script (including hero & header logic).
const atelierEl     = document.getElementById('atelier');
const atelierIntro  = document.getElementById('atelierIntro');
const atelierPhotos = document.querySelectorAll('.atelier-photo');
const atelierGalleryLink = document.getElementById('atelierGalleryLink');

const ATELIER_POOL = [
  "assets/images/atelier_01.jpg",
  "assets/images/atelier_02.jpg",
  "assets/images/atelier_03.jpg",
  "assets/images/atelier_04.jpg",
  "assets/images/atelier_05.jpg",
  "assets/images/atelier_06.jpg",
  "assets/images/atelier_07.jpg",
];

function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignAtelierPhotos(){
  const picks = shuffle(ATELIER_POOL).slice(0, 4);
  atelierPhotos.forEach((el, i) => {
    el.style.backgroundImage = `url("${picks[i]}")`;
    // Fresh random initial-rotation offset for each visit, in degrees, range ±15
    el._rotOffset = (Math.random() * 30) - 15;
  });
}
assignAtelierPhotos();

const ATELIER_INTRO_END = 0.10;
const ATELIER_TAIL      = 0.10;
const ATELIER_OVERLAP   = 0.28;

const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
const easeOutBack  = t => {
  const c1 = 1.18, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function updateAtelier(){
  if(!atelierEl) return;
  const rect  = atelierEl.getBoundingClientRect();
  const total = atelierEl.offsetHeight - window.innerHeight;
  if(rect.bottom < 0 || rect.top > window.innerHeight) return;
  const scrolled = Math.min(Math.max(-rect.top, 0), total);
  const p = total > 0 ? scrolled / total : 0;

  // ---- Intro fade ----
  if(atelierIntro){
    const introT = Math.min(1, p / ATELIER_INTRO_END);
    const introOpacity = 1 - introT;
    const introY = -introT * 40;
    atelierIntro.style.opacity = introOpacity;
    atelierIntro.style.transform = `translateX(-50%) translateY(${introY}px)`;
  }

  // ---- Photo slicing ----
  // Slot 0 (p1) is already placed from the start of the section.
  // Slots 1..N-1 (p2/p3/p4) share the rest of the scroll runway.
  const animRange = 1 - ATELIER_INTRO_END - ATELIER_TAIL;
  const N = atelierPhotos.length;
  const N_DRIVEN = N - 1;
  const sliceLen = animRange / (N_DRIVEN - (N_DRIVEN - 1) * ATELIER_OVERLAP);

  atelierPhotos.forEach((el, i) => {
    let t;
    if(i === 0){
      // First photo is laid out before the user even arrives — always at full settle.
      t = 1;
    } else {
      const j = i - 1;
      const start = ATELIER_INTRO_END + j * sliceLen * (1 - ATELIER_OVERLAP);
      const end   = start + sliceLen;
      t = (p - start) / (end - start);
      t = Math.max(0, Math.min(1, t));
    }

    // Each photo carries a random initial-rotation offset (in degrees), generated once per visit.
    // The offset is stored on the element so it stays consistent across scroll updates.
    // Range: ±15deg — enough to feel like a hand-tossed print, restrained enough to feel curated.
    if(el._rotOffset === undefined){
      el._rotOffset = (Math.random() * 30) - 15;
    }
    const rotOffset = el._rotOffset;

    // ---- Detect a fresh "arrival" and trigger a soft breeze on the already-placed photos ----
    // p2 (i=1) lands → wind right→left.  p3 (i=2) → left→right.  p4 (i=3) → right→left.
    if(i > 0){
      const ARRIVAL_T = 0.05;
      const placedNow = t >= ARRIVAL_T;
      if(placedNow && !el._wasPlaced){
        const direction = (i % 2 === 1) ? 'rtl' : 'ltr';
        triggerBreeze(direction);
      }
      el._wasPlaced = placedNow;
    }

    // Photo center anchor: -50% offset places the element's own center on (left:50%, top:50%).
    // The photos themselves never move in response to the breeze — only the wind-line trails do.
    const xExpr = `calc(-50% + var(--rest-x))`;
    const yExpr = `calc(-50% + var(--rest-y))`;

    if(t === 0){
      // Not yet arrived — held off-screen via opacity, but already at rest position & enlarged,
      // and rotated by the random initial offset.
      el.style.opacity = 0;
      el.style.transform =
        `translate3d(${xExpr}, ${yExpr}, 0) rotate(calc(var(--rest-r) + ${rotOffset}deg)) scale(1.4)`;
      return;
    }

    // APPROACH (0..0.78): fade in (0→1), shrink (1.4 → 1.02), and rotation eases from
    //                     (rest + rotOffset) toward rest as the print "settles" into place.
    // SETTLE   (0.78..1): tiny ease-out-back nudge around scale 1.0 — the "tap" of placement.
    const approachEnd = 0.78;
    if(t < approachEnd){
      const at = easeOutQuart(t / approachEnd);
      const scale   = 1.4 - 0.38 * at;       // 1.4 → 1.02
      const opacity = at;                     // 0 → 1
      const wobble  = rotOffset * (1 - at);   // rotOffset → 0
      el.style.opacity = opacity;
      el.style.transform =
        `translate3d(${xExpr}, ${yExpr}, 0) ` +
        `rotate(calc(var(--rest-r) + ${wobble}deg)) ` +
        `scale(${scale})`;
    } else {
      const st = (t - approachEnd) / (1 - approachEnd);
      const settle = easeOutBack(st);
      const scale = 1.02 - 0.02 * settle;
      el.style.opacity = 1;
      el.style.transform =
        `translate3d(${xExpr}, ${yExpr}, 0) ` +
        `rotate(var(--rest-r)) ` +
        `scale(${scale})`;
    }
  });

  // ---- Gallery link — fades in after the 4th photo (p4) has visibly landed ----
  // We use p4's local placement progress (t) directly: once it crosses ~0.6 the
  // photo has come out of the approach phase, the breeze has begun, and the
  // composition is ready to "graduate" into the gallery CTA.
  if(atelierGalleryLink){
    const p4 = atelierPhotos[atelierPhotos.length - 1];
    let p4t = 0;
    if(p4){
      const j = atelierPhotos.length - 2;
      const start = ATELIER_INTRO_END + j * sliceLen * (1 - ATELIER_OVERLAP);
      const end   = start + sliceLen;
      p4t = (p - start) / (end - start);
      p4t = Math.max(0, Math.min(1, p4t));
    }
    const shouldShow = p4t >= 0.6;
    if(shouldShow !== atelierGalleryLink.classList.contains('is-visible')){
      atelierGalleryLink.classList.toggle('is-visible', shouldShow);
    }
  }
}

// ===== Soft breeze — wind-line trail =====
// When a new photo arrives, a faint hairline drifts across the desk in the wind's direction.
// The photos themselves do not react. Intentionally barely-there: a wisp of moving air,
// suggested rather than depicted.
const atelierStage = document.querySelector('.atelier-stage');
function triggerBreeze(direction){
  if(!atelierStage) return;
  // Layered curves — like wisps of mist drifting past the desk. Each wisp carries
  // its own random shape, vertical band, stroke width, and opacity, so the bundle
  // reads as a soft current of air rather than as four parallel lines.
  const N = 4;
  for(let i = 0; i < N; i++){
    setTimeout(()=> spawnWisp(direction, i), i * 110);
  }
}
function spawnWisp(direction, layer){
  const stageW = atelierStage.offsetWidth;
  const stageH = atelierStage.offsetHeight;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'atelier-wisp');
  svg.setAttribute('viewBox', `0 0 ${stageW} ${stageH}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // Each layer drifts at a slightly different vertical band so the bundle reads as
  // overlapping waves rather than parallel lines.
  const yBands = [.18, .28, .38, .62, .72, .82];
  const idx = (layer + Math.floor(Math.random() * 2)) % yBands.length;
  const yBase = stageH * yBands[idx] + (Math.random() * 24 - 12);

  const overshoot = 120;
  const x0 = direction === 'rtl' ? stageW + overshoot : -overshoot;
  const x3 = direction === 'rtl' ? -overshoot         : stageW + overshoot;
  const totalDx = x3 - x0;

  // Some layers describe a single S, others a longer 2-hump wave.
  const useDoubleWave = (layer % 2 === 1);
  const sign = (Math.random() > 0.5 ? 1 : -1);
  const ampl = 28 + Math.random() * 34;            // gentle vertical bow
  const yEnd = yBase + (Math.random() * 44 - 22);  // drift in landing height

  let d;
  if(!useDoubleWave){
    // Single S-curve — control points pull in opposite directions to create one inflection.
    const c1x = x0 + totalDx * (0.26 + Math.random() * 0.10);
    const c2x = x0 + totalDx * (0.66 + Math.random() * 0.10);
    const c1y = yBase + sign * ampl;
    const c2y = yEnd  - sign * ampl * (0.7 + Math.random() * 0.5);
    d = `M ${x0} ${yBase} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x3} ${yEnd}`;
  } else {
    // Two cubic segments chained for a wave with two distinct humps.
    const yMid = yBase + (Math.random() * 26 - 13);
    const xMid = x0 + totalDx * 0.5;
    d  = `M ${x0} ${yBase}` +
         ` C ${x0 + totalDx * 0.18} ${yBase + sign * ampl},` +
         ` ${x0 + totalDx * 0.32} ${yBase + sign * ampl},` +
         ` ${xMid} ${yMid}` +
         ` S ${x0 + totalDx * 0.82} ${yEnd - sign * ampl * 0.85},` +
         ` ${x3} ${yEnd}`;
  }

  // Per-stroke style — each layer is randomly thin/pale so the bundle has texture.
  const strokeOpacity = 0.12 + Math.random() * 0.10;     // 0.12–0.22
  const strokeWidth   = 0.9 + Math.random() * 1.1;       // 0.9–2.0px
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', `rgba(60, 48, 36, ${strokeOpacity})`);
  path.setAttribute('stroke-width', strokeWidth);

  svg.appendChild(path);
  atelierStage.appendChild(svg);

  // Long visible segment so the wave reads as a flowing brushstroke, not a comet head.
  const totalLen = path.getTotalLength();
  const segLen   = totalLen * (0.50 + Math.random() * 0.18);   // 50%–68% of the path
  path.style.strokeDasharray  = `${segLen} ${totalLen}`;
  path.style.strokeDashoffset = `${segLen}`;
  path.style.opacity = '0';

  const duration = 1800 + Math.random() * 600;   // 1.8s–2.4s — slow & gentle

  const anim = path.animate([
    { strokeDashoffset: `${segLen}`,                       opacity: 0 },
    { strokeDashoffset: `${segLen - totalLen * 0.18}`,    opacity: 1, offset: 0.18 },
    { strokeDashoffset: `${segLen - totalLen * 0.82}`,    opacity: 1, offset: 0.82 },
    { strokeDashoffset: `${-totalLen}`,                    opacity: 0 }
  ], { duration, easing: 'cubic-bezier(.4,.1,.4,1)' });
  anim.onfinish = () => svg.remove();
}

let ticking = false;
function onScroll(){
  if(!ticking){
    requestAnimationFrame(()=>{ tick(); ticking = false; });
    ticking = true;
  }
}
window.addEventListener('scroll', onScroll, {passive:true});
window.addEventListener('resize', tick, {passive:true});
tick();

// ===== Mobile hamburger menu =====
(function(){
  const toggle = document.getElementById('menuToggle');
  const menu   = document.getElementById('mobileMenu');
  if(!toggle || !menu) return;
  function setOpen(open){
    toggle.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', () => {
    setOpen(!toggle.classList.contains('is-open'));
  });
  // Close when any nav link is tapped (so anchor scroll works on the freshly-revealed page).
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  // Escape closes.
  document.addEventListener('keydown', e => { if(e.key === 'Escape') setOpen(false); });
  // Auto-close if the viewport grows past the mobile breakpoint while the menu is open.
  window.addEventListener('resize', () => {
    if(window.innerWidth > 680 && toggle.classList.contains('is-open')) setOpen(false);
  });
})();

// ===== reveal on scroll =====
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, {threshold:.15, rootMargin:'0px 0px -60px 0px'});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Safety net: if the IntersectionObserver never fires for some element
// (browser quirk, timing, deferred-script edge cases), don't leave content
// invisible forever — force-reveal anything still hidden after 2s.
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in'));
  }, 2000);
});

// ===== Philosophy background slideshow (3-second dissolve) =====
(function(){
  const slides = document.querySelectorAll('#philosophySlides .philosophy-slide');
  if(slides.length < 2) return;
  let idx = 0;
  setInterval(() => {
    slides[idx].classList.remove('is-active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('is-active');
  }, 3000);
})();
