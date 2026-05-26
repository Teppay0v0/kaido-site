# 開土 KAIDO 公式ウェブサイト ／ 確認用納品物
2026.05.21 ver

---

## オンラインで確認する
最新版が常に公開されています(推奨):
**🔗 https://teppay0v0.github.io/kaido-site/**

スマホ/PC どちらでもご確認いただけます。本ZIPは納品ファイル一式のスナップショットです。

---

## ローカルで確認する
1. `kaido-site` フォルダを任意の場所に展開
2. `kaido-site` の中で右クリック → ターミナル/コマンドラインを開く
3. 以下のコマンドを実行(Python 3 が必要):
   ```
   python3 -m http.server 8080
   ```
4. ブラウザで `http://localhost:8080/` を開く

Pythonが入っていない場合は VS Code の Live Server 拡張等でも動作します。
`index.html` をブラウザに直接ドロップしても表示はできますが、一部のアニメーションが正常に動かない場合があります。

---

## サイト構成(全11ページ)

| # | ページ | URL |
|---|---|---|
| 1 | TOP | `index.html` |
| 2 | CONCEPT(コンセプト) | `concept.html` |
| 3 | ROOMS 一覧 | `index.html#rooms` (TOP内) |
| 4 | 4F・空 SORA 詳細 | `room-sora.html` |
| 5 | 3F・木 KI 詳細 | `room-ki.html` ※暫定 |
| 6 | 2F・石 ISHI 詳細 | `room-ishi.html` ※暫定 |
| 7 | 1F・土 TSUCHI 詳細 | `room-tsuchi.html` ※暫定 |
| 8 | GALLERY | `gallery.html` |
| 9 | NEWS 一覧 | `news.html` |
| 10 | NEWS 記事 | `news-detail.html` |
| 11 | CONTACT | `contact.html` |

---

## デザインの特徴
- The Row 風 ／ エディトリアル(純白背景・極小テキスト・写真主体・大胆な余白)
- ブランドカラー: マルーン `#904848`
- フォント: Zen Kaku Gothic New Bold(Google Webフォント・無料)で全面統一
- マルーン額装ヒーロー & スクロール連動の2段クリップ演出
- 共通の固定ヘッダー&フッター(全ページ統一)

---

## 主要なインタラクション
- TOP Hero: スクロールでブラスKAIDOロゴが消え、エントランス写真が現れる
- TOP 中扉/写真: 6スライドが1枚ずつめくれて表示
- Rooms カード: ホバーで写真が枠ごと拡大、文字が光る、右下に "MORE →"
- ROOM SORA Gallery: 写真クリックでライトボックス拡大(← → / Esc 操作)
- GALLERY ページ: スクロールで写真が順に重なる(リロード毎にランダム10枚)
- ACCESS マップ: OpenFreeMap カスタムスタイル、maroon マーカー
- CONTACT: フォーム送信で受付完了画面に切替

---

## 現在は仮(ダミー)/確定情報待ち

| 項目 | 現状 | 必要な情報 |
|---|---|---|
| 本文コピー全般 | 「ここにテキストが入ります。」 | 各ページの確定コピー |
| ROOM 詳細(木/石/土) | 暫定テンプレ | 写真選定 + 構成 |
| NEWS 記事 | 12件すべてダミー | 実際のお知らせ |
| 予約システム | RESERVE → CONTACT フォーム経由 | tripla等の予約サービス連携 |
| CONTACT 送信先 | ダミー(画面切替のみ) | Formspree等の設定 |
| 法務ページ | 未作成(リンクのみ) | 利用規約 / 特商法 / プライバシーポリシー |
| SNS / 関連URL | `#` プレースホルダ | Instagram / 運営会社サイト URL |
| 部屋詳細スペック | 「—㎡(仮)」 | 確定の広さ / ベッド構成 / アメニティ |

---

## 写真素材
- ご提供撮影素材 245枚を 2026/05/20 部屋割り表に従いリネーム済
  - 4F=SORA: 110枚 / 3F=KI: 62枚 / 2F=ISHI: 36枚 / 1F=TSUCHI: 36枚
- TOPと SORA 詳細に組み込み済 / Gallery 用 50枚プール
- Web表示用に圧縮済(JPEG q80-82, 最長辺 1400-1800px)

---

## 技術仕様
- 静的サイト(HTML / CSS / JavaScript のみ)
- ホスティング: GitHub Pages(独自ドメイン移行可能)
- スマホ/PC レスポンシブ対応
- 外部依存: Google Webフォント / MapLibre GL JS(地図) / OpenFreeMap(地図タイル)
- すべて無料・APIキー不要

---

## ご確認いただきたいポイント
1. **全体のトーン&マナー** (配色・余白・タイポ・写真の見せ方)
2. **インタラクション** (Hero・中扉・GALLERY のアニメ)
3. **写真選定** (特に SORA 詳細ページの各セクション)
4. **本文コピーの方向性**
5. **未確定の素材・情報** (上記表)

ご確認のうえ、修正・追加点があればお知らせください。

---

合同会社HANABI ／ 担当: 廣田哲平
teppei.hirota@gmail.com
