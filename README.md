# Tarot Everyday — 毎日の占いノート

タロットの練習と、生年月日から読み解く7つの占術で毎日の運勢を確かめる占いノート。

- **運勢** — 生年月日(と出生時刻・出生地)を登録すると、数秘術・九星気学・マヤ暦・四柱推命・算命学・宿曜・西洋占星術の7つの占術で今日・今月・今年の運勢と生まれ持った性質を表示
- **タロット** — 1day タロット、スプレッド占い、カードの意味のクイズ
- **早見表** — タロット78枚と7つの占術の要素(星・紋章・干支・星座など)の意味を一覧と詳細ページで確認。項目を横断して検索できる

## セットアップ

```bash
npm install
```

### カード画像の準備

カード画像（78枚）はリポジトリに含まれていません。以下のスクリプトで Wikimedia Commons からパブリックドメインの Rider-Waite-Smith 図版をダウンロードしてください。

```bash
node scripts/download-cards.js
```

`public/cards/` 以下に大アルカナ22枚・小アルカナ56枚が配置されます。

```
public/cards/
├── major/        # 00-fool.jpg … 21-world.jpg
└── minor/
    ├── cups/     # 01.jpg … 14.jpg
    ├── pentacles/
    ├── swords/
    └── wands/
```

### 早見表の画像の準備

早見表の十二星座・天体・十二支には、Wikimedia Commons のパブリックドメインの絵画・写真(Sidney Hall『Urania's Mirror』、Sebald Beham『The Seven Planets』、NASA の天王星・海王星・冥王星、歌川国芳『道化十二支』)を表示します。画像はリポジトリに含まれていないので、以下のスクリプトでダウンロードしてください。

```bash
node scripts/download-guide-images.mjs
```

使う画像の一覧(ファイル名・代替テキスト・出典・切り抜きの位置)は `src/data/guide/photos.json` にあり、`public/guide-images/` 以下に34枚が配置されます。画像がなければ、早見表は記号・文字の画像を表示します。

### キロンの位置の表(通常は不要)

西洋占星術のキロンの位置は、JPL Horizons から取得した表(`src/lib/fortune/horoscope/chiron-table.ts`)をコミットしてあります。表を作り直すときだけ実行します。

```bash
node scripts/fetch-chiron.mjs
```

## 開発

```bash
npm run dev
```

http://localhost:3000 で確認できます。

## テスト

```bash
npm test              # Vitest（ユニットテスト）
npx playwright test   # Playwright（E2Eテスト、ポート3100）
```

## ビルド & デプロイ

静的エクスポートで S3 + CloudFront にデプロイしています。

```bash
npm run build         # out/ に静的ファイルを生成
```

## 技術スタック

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + shadcn/ui (@base-ui/react)
- **Framer Motion** — アニメーション
- **Vitest** + **Playwright** — テスト
- **AWS S3 + CloudFront** — ホスティング（日本限定配信）
