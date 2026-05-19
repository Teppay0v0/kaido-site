# Design Tokens — 開土 KAIDO

CSS-in-JS / Tailwind / SCSS変数 等への移植時に参照してください。
ソースは `assets/styles.css` の `:root` ブロック。

---

## カラー

### ベース
| トークン | 値 | 用途 |
|---|---|---|
| `--bg` | `#f3efe7` | 和紙ベース、メイン背景 |
| `--bg-2` | `#ebe5d8` | やや沈んだ砂色、newsセクション等 |
| `--ink` | `#1a1612` | 墨色、メインテキスト |
| `--ink-soft` | `#3d342a` | やや薄い土色テキスト、本文用 |
| `--ink-mute` | `#6b5d4d` | ミュート色、メタ情報用 |
| `--line` | `#cdc3b1` | hairline 罫線 |

### アクセント（4部屋テーマ色）
| トークン | 値 | 部屋 |
|---|---|---|
| `--accent` | `#7a4a26` | 土 (Tsuchi) — earth red-brown |
| `--accent-2` | `#3a3a32` | 石 (Ishi) — stone grey |
| `--accent-3` | `#5a4a2e` | 木 (Ki) — timber |
| `--accent-4` | `#1c2230` | 宙 (Sora) — night sky |

> `--accent` (土) はサイト全体のメインアクセントとしても使用（リンクhover、強調文字、装飾線等）

### Hero専用
- `#dcc18a` — 真鍮ハイライト色（Hero1の `<em>` 部分）
- `#1a1612` — Heroのフォールバック背景

---

## タイポグラフィ

### フォントスタック
| トークン | 値 |
|---|---|
| `--serif` | `'Shippori Mincho', 'Cormorant Garamond', serif` |
| `--serif-en` | `'Cormorant Garamond', 'Shippori Mincho', serif` |
| `--serif-it` | `'Cormorant Infant', serif` |

### サイズスケール
| 用途 | サイズ | 補足 |
|---|---|---|
| Hero kanji-en | `clamp(36px, 5.4vw, 78px)` | Cormorant 300 italic装飾 |
| Hero vertical (`.hero-meta.vert`) | `34px` (デスクトップ) / `22px` (モバイル) | 「あなたを開く」 |
| `.h-display` | `clamp(34px, 4.4vw, 64px)` | セクションメインヘディング |
| `.intro-slogan` | `clamp(40px, 5.4vw, 76px)` | Concept欧文スローガン |
| `.philosophy-quote` | `clamp(28px, 3.4vw, 48px)` | Philosophy引用文 |
| `.cta-title` | `clamp(40px, 5.4vw, 78px)` | CTA見出し |
| Body | `15-16px` | line-height 1.85〜2.3、letter-spacing .04〜.09em |
| Caption / メタ | `11-13px` | letter-spacing .3〜.5em（欧文大文字） |

### Letter Spacing 規則
- 欧文大文字 (UPPERCASE) — `.32em〜.5em`
- 和文タイトル — `.2〜.4em`
- 和文本文 — `.04〜.09em`
- ホバー時の字間広がり — 通常から `+.02〜.06em` 程度

### Font Features
- 全テキストに `font-feature-settings: "palt", "kern", "liga"` を適用済み
- Heading類は追加で `"dlig"` (discretionary ligatures) を有効化

---

## 余白・スペーシング

### セクション padding (デスクトップ → モバイル)
| セクション | デスクトップ | 1100px以下 | 680px以下 |
|---|---|---|---|
| `.intro` | `160px 80px 180px` | 32px sides | `100px 32px 120px` |
| `.rooms` | `140px 0 180px` | 32px sides on header/list | 同 |
| `.philosophy` | `200px 80px 220px` | 120px top/bottom | `90px 24px` |
| `.atelier` | `height:280vh` (固定) | 同 | 同 |
| `.area` | `180px 80px` | 120px top/bottom | `90px 24px` |
| `.news` | `160px 80px` | 32px sides | `90px 24px` |
| `.cta` | `200px 80px` | 32px sides | `120px 24px` |
| `.footer` | `100px 80px 40px` | `80px 32px 32px` | `64px 24px 28px` |

### コンテナ最大幅
- `1500px` — rooms-header, room-list, footer-grid, news-inner, area, philosophy-inner
- `1400px` — intro-grid
- `560–520px` — 本文段落の max-width

---

## ブレークポイント

| 名称 | クエリ | 用途 |
|---|---|---|
| Tablet | `@media (max-width: 1100px)` | 2カラム→1カラム化、ロゴ縮小 |
| Mobile | `@media (max-width: 680px)` | ナビ→ハンバーガー、hero強制中央配置 |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | アニメ無効化 |

---

## トランジション・イージング

| 用途 | 値 |
|---|---|
| 標準 hover (色・opacity) | `.35s ease` |
| 字間広がり / padding shift | `.45s〜.55s cubic-bezier(.2,.7,.2,1)` |
| 画像 scale / room-img | `1.2s cubic-bezier(.2,.7,.2,1)` |
| reveal fade-up | `1.2s cubic-bezier(.2,.7,.2,1)` |
| ボタン fill (`::before` translateY) | `.5s cubic-bezier(.7,0,.2,1)` |

---

## エフェクト

### 紙テクスチャ overlay (`body::before`)
SVG fractalNoise を `mix-blend-mode: multiply` で全面に乗算合成。  
opacity `.35`、ピクセルレベルの粒状感を付与。モバイルメニューにも同様の overlay (`opacity:.32`)。

### Hairline drop animation
`@keyframes lineDrop` — 縦罫が `scaleY 0 → 1` で `1.4s cubic-bezier(.2,.7,.2,1)` で描き下ろされる。  
intro / philosophy / area / news / cta セクションの top に配置。

### Reveal on scroll
`.reveal` クラス + IntersectionObserver で fade-up。  
rooms-list と news-list の子要素には `transition-delay` で stagger（0.06s ずつ）。
