# Spresense Slideshow - Next.js

Supabaseから画像を取得してランダムにスライドショー表示するNext.jsアプリケーション。

## 機能

- Supabaseバケットから "original_capture" を含む画像を自動取得
- ランダムにスライドショー表示（2-3秒間隔）
- 30秒ごとに新しい画像を自動チェック
- 新しい画像が追加されたときの通知表示
- フルスクリーン表示対応
- リアルタイム時刻表示

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成して、Supabaseの設定を追加：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_BUCKET=line-images
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## ビルドとデプロイ

### 本番ビルド

```bash
npm run build
npm start
```

### Vercelへのデプロイ

環境変数を忘れずに設定してください：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_BUCKET`

デプロイは [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) から簡単にできます。

詳細は [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。

## 技術スタック

- **Next.js 16** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Supabase** - バックエンド・ストレージ

## プロジェクト構造

```
spresense-slideshow/
├── app/
│   ├── globals.css       # グローバルスタイル
│   ├── layout.tsx        # レイアウトコンポーネント
│   └── page.tsx          # メインのスライドショーページ
├── .env.local            # 環境変数（要作成）
├── next.config.ts        # Next.js設定
└── package.json
```

## 元のHTMLファイルからの移植

このプロジェクトは `slideshow.html` から移植されました：

- JavaScript クラス → React hooks (useState, useEffect)
- DOM 操作 → React state と JSX
- setInterval → useEffect で管理
- インラインスタイル → Tailwind CSS

## ライセンス

MIT
