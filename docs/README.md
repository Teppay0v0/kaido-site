# 開土 KAIDO — Site Deliverable

札幌・暮らすように過ごせるレジデンスホテル「開土 KAIDO」の公式サイト。
**運営**: 株式会社北開道地所 / **所在地**: 〒060-0807 北海道札幌市北区北7条西7丁目2-16 / **TEL**: 011-200-0978

---

## ファイル構成

```
kaido-site/
├── index.html              # 本体（構造のみ、~17KB）
├── assets/
│   ├── styles.css          # 全スタイル
│   ├── script.js           # 全スクリプト
│   └── images/             # 17ファイル（~3.7MB）
├── content/
│   ├── rooms.json          # 部屋データ（CMS化時の構造リファレンス）
│   └── news.json           # ニュース項目（DUMMY、要差し替え）
└── docs/
    ├── README.md           # このファイル
    ├── design-tokens.md    # 色・フォント・余白の定数表
    └── components.md       # 繰り返し要素の構造解説
```

---

## デプロイ方法

### ① 静的サイトとしてそのまま納品する場合

1. `kaido-site/` ディレクトリ全体を Web サーバーにアップロードするだけ
2. ルート (`/`) を `index.html` にマッピング
3. Google Fonts を読み込むため、**インターネット接続が必要**（オフライン化したい場合は別途フォントセルフホストへの差し替えが必要）

特別なビルド作業・依存パッケージは不要。

### ② CMS化する場合（WordPress / STUDIO / Next.js 等）

#### 2-1. 部屋セクション (Rooms)
- `content/rooms.json` を参照 → 部屋情報を CMS のコレクション/カスタム投稿タイプに移行
- `index.html` の `<article class="room-row room-N reveal">` 4ブロックは1つのテンプレートからのループに置き換え可能
- フィールド対応は [components.md](./components.md) の Room コンポーネント節を参照

#### 2-2. ニュースセクション (News)
- `content/news.json` の構造をそのまま CMS 側のスキーマに使える
- `index.html` の `<a class="news-item reveal">` 4件は1つのテンプレートからのループに
- **現状はダミーコピー**。本番開業時に差し替え必須

#### 2-3. 画像
- `assets/images/` の各ファイルを CMS のメディアライブラリに登録
- ファイル名は意味付けされている (`hero1-brass-logo.jpg` `room_01_tsuchi.jpg` 等) ので、CMS側でそのまま slug にできる

#### 2-4. 静的部分
- ヒーロー / Concept / Philosophy / Atelier / Area / CTA / Footer は固定コンテンツ
- 編集頻度が低いので、CMS化するなら **Rooms と News のみ動的化**、その他は静的のまま、という構成がコスパ良し

---

## 技術仕様

### フォント (Google Fonts)
- **Shippori Mincho** (400/500/600/700) — 和文明朝
- **Cormorant Garamond** (300/400/500 + 300i) — 欧文セリフ
- **Cormorant Infant** (300/400 + 300i) — 欧文イタリック装飾

### ブレークポイント
- **Default**: ≥1101px (デスクトップ)
- **Tablet**: ≤1100px
- **Mobile**: ≤680px (この境界でハンバーガーメニューに切替)

### JavaScript依存の挙動 (`assets/script.js`)
1. **Hero 2-stage clip** (`tick()` 内): scrollに連動して `clip-path: inset()` で hero1 → hero2 の遷移。モバイルは中央配置・縦スイープのみに簡略化
2. **Atelier scroll-driven photo placement** (`updateAtelier()`): 7枚から4枚をランダム選択、scroll進捗に応じて順次配置
3. **風跡 (wind wisp)** (`triggerBreeze()`): 写真到着時にSVG曲線が画面を横切る。p2→p3→p4で交互に左右
4. **reveal on scroll** (IntersectionObserver): `.reveal`要素を視認時にfade-in
5. **Header on-hero state**: スクロール量に応じてヘッダーの色反転
6. **Mobile hamburger menu** (`#menuToggle`): 開閉トグル + body scroll lock

### アクセシビリティ
- `prefers-reduced-motion` 対応済み（reveal・線アニメ・wisp が無効化）
- ハンバーガーメニューは `aria-expanded` `aria-hidden` を更新、Escapeキーで閉じる

---

## 既知の TODO

- [ ] News 4件のコピーをダミーから本番に差し替え
- [ ] OGP画像・favicon の追加
- [ ] 利用規約 / 特定商取引 / Privacy Policy ページの作成（footer にリンクあり、現状 `href="#"`）
- [ ] Instagram URL の差し込み
- [ ] 予約システム連携（現状 Reserve ボタンは `#cta` セクションへスクロールのみ）

---

## 参考資料

- ブランドスローガン: `Hotel to Live, Room to Breathe.`
- シリーズスローガン: `あなたを、開く。` / `さっぽろ拓く` / `開土KAIDO Brand`
- デザイン参考: [https://byaku.site/](https://byaku.site/)
- 偕楽園史実出典: 札幌市公式 / HOKKAIDO LOVE! / Wikipedia「偕楽園 (札幌市)」
