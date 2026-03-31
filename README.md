# Tarot Everyday — タロット暗記アプリ

占い師を目指す人のためのタロットカード暗記・学習アプリ。78枚の早見表、カード詳細、1dayタロット占い、スプレッド占い、クイズモードで毎日の学習をサポート。

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
