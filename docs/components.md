# Components — 繰り返し要素の構造解説

CMS化や React/Vue コンポーネント分割の際の参考。
**現状はすべて静的HTMLで書かれている**ので、繰り返し部分を見つけて1つのテンプレートに集約する作業がメイン。

---

## Room (部屋カード)

### データ型 (`content/rooms.json` 参照)
```ts
type Room = {
  floor: 1 | 2 | 3 | 4
  kanji: '土' | '石' | '木' | '宙'
  kanjiReading: 'つち' | 'いし' | 'き' | 'そら'
  en: 'Tsuchi' | 'Ishi' | 'Ki' | 'Sora'
  tagline: string         // 英文小タグ "the soil that begins everything" 等
  description: string     // 本文（和文、改行は <br> なしのまま）
  area: string            // "72m²" 等
  guests: number
  sauna: 'Private Sauna' | 'Rooftop Sauna'
  themeColor: string      // hex — 強調文字の色 (--accent-N)
  image: string           // 画像パス
  displayOrder: 1 | 2 | 3 | 4   // 上から下、現状は 04宙 → 03木 → 02石 → 01土
}
```

### HTML構造
`index.html` の `<section class="rooms">` 内、`<div class="room-list">` 直下にある `<article class="room-row room-N reveal">` がループ単位。

```html
<article class="room-row room-{floor} reveal">
  <div class="room-floor">
    <span class="num">{floor zero-padded}</span>
    <span class="lbl">— {ordinal} Floor</span>
  </div>
  <div class="room-info">
    <div>
      <div class="room-name">
        <span class="ko">{kanji}</span>
        <span class="en">{en}</span>
      </div>
      <div class="room-tag">— {tagline}</div>
      <p class="room-desc">{description}</p>
      <div class="room-meta">
        <span>{area}</span>
        <span>{guests} Guests</span>
        <span>{sauna}</span>
      </div>
    </div>
  </div>
  <div class="room-visual">
    <div class="room-img"></div>
    <div class="room-visual-label">
      <span>{floor}F · {Earth/Stone/Timber/Sky}</span>
      <span class="big">{kanji}</span>
    </div>
    <a href="#" class="room-link">→</a>
  </div>
</article>
```

### CSS命名のキー
- `.room-1` 〜 `.room-4` がフロアの識別子。背景画像は `assets/styles.css` の `.room-N .room-img{ background-image: url(...) }` で割り当て
- `themeColor` はインラインスタイル `style="color: var(--accent)"` で description 内の強調語に
- `.room-tag` の文字色は `var(--accent)` 固定（デフォは土の色）

### CMS化の注意
- **表示順**: フロア番号と表示順は逆（4F→1F の順）。`displayOrder` フィールドで明示
- **kanji 文字**: 単一文字のため、CMSのテキストフィールドではなく **enum** での運用推奨
- **背景画像**: 現状 CSSで割当だが、CMS化なら `style="background-image: url({image})"` をインライン化

---

## News Item (ニュース項目)

### データ型 (`content/news.json` 参照)
```ts
type NewsItem = {
  date: string         // ISO format "YYYY-MM-DD" — 表示時 "2026 . 04 . 15" にフォーマット
  category: 'Brand' | 'Opening' | 'Press' | 'Event' | string
  title: string        // 和文タイトル
  url: string          // 詳細記事URL or "#"
}
```

### HTML構造
```html
<a href="{url}" class="news-item reveal">
  <span class="news-date">{date formatted as YYYY . MM . DD}</span>
  <span class="news-cat">{category}</span>
  <span class="news-title">{title}</span>
  <span class="news-arrow">→</span>
</a>
```

### CMS化の注意
- 日付フォーマット: ISO → 表示用 `YYYY . MM . DD` (スペース込み) への変換ロジックが必要
- 現状の4件はすべてダミー、要差し替え

---

## Atelier Photo Pool

### データ型
7枚のJPEG画像のうち、ページロード時にランダムで4枚を抽出して4スロットに配置。
画像は `assets/images/atelier_01.jpg` 〜 `atelier_07.jpg`。

### JS実装
`assets/script.js` 内 `ATELIER_POOL` 配列に画像URLが列挙。
`shuffle()` → `slice(0, 4)` で4枚を抽出し、`.atelier-photo.p1〜p4` の `background-image` に設定。

### CMS化の注意
- 画像セット自体は固定運用（増減することは少ない想定）
- 増減させる場合は `ATELIER_POOL` 配列を CMS から取得する形に

---

## Floor of Atelier の解釈

実装ロジックの順番:
1. `p1` がページロード時から既に机に置かれている（`updateAtelier()` で `i===0` のとき `t=1` 固定）
2. `p2` がスクロール進捗 ~28% で着地 → 風跡 (右→左)
3. `p3` が ~55% で着地 → 風跡 (左→右)
4. `p4` が ~82% で着地 → 風跡 (右→左)

風跡 (`triggerBreeze()`) は4本のSVG曲線を110ms stagger で生成、各曲線は `0.9〜2.0px` 幅、`opacity 0.12〜0.22`、軌道は S字 / 2山波からランダム選択。

---

## Mobile Menu

ハンバーガーボタン `#menuToggle` をタップ → `.mobile-menu#mobileMenu` を全画面オーバーレイ表示。

### 構造
```html
<div class="mobile-menu" id="mobileMenu">
  <div class="mobile-menu-inner">
    <ul class="mobile-menu-list">
      <li><a href="...">Concept</a></li>
      ...6項目
    </ul>
    <div class="mobile-menu-meta">
      <div class="lang">JP / EN</div>
      <a class="reserve-btn">Reserve</a>
    </div>
  </div>
</div>
```

### 制御
- `.is-open` クラスでフェードイン
- 各リンク tap → `setOpen(false)` で自動で閉じる + アンカー先へスクロール
- `Esc` キーで閉じる
- `body.menu-open` で背景スクロールロック
