# QRコード経由のスマホ遷移セットアップガイド

## 概要

PCでスライドショーを閲覧中にQRコードを表示し、スマホで読み取ることでLINE経由で同じ画像をスマホで開ける機能です。

## フロー

```
① PCで /slides/:file_id を表示
② 「QR」ボタンをクリック → QRコード表示
③ スマホでQRコード読み取り
④ LINEアプリが開く（Bot未友達の場合は友達追加画面）
⑤ 自動的に「view:{hashId}」メッセージが送信される
⑥ Supabase Edge Function (line-webhook) が画像を検索
⑦ Botが画像とLIFFリンクを含むFlex Messageで返信
⑧ 「スライドショーで見る」ボタンをタップ
⑨ LIFF経由でスマホにスライド表示
```

## セットアップ手順

### 1. 環境変数の設定

#### フロントエンド（Next.js）

`.env.local` ファイルに以下を追加:

```bash
# LINE Bot設定
NEXT_PUBLIC_LINE_BOT_ID=@168tgskj  # あなたのBot ID

# LIFF設定
NEXT_PUBLIC_LIFF_ID=your_liff_id

# Supabase設定（既存）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### Supabase Edge Function

Supabase Dashboard > Settings > Edge Functions で以下の環境変数（Secrets）を設定:

```bash
# LINE Bot設定
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# LIFF設定
LIFF_ID=your_liff_id

# Supabase設定（自動で設定済み）
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# その他
GEMINI_API_KEY=your_gemini_api_key
BUCKET_NAME=your_bucket_name
```

### 2. フロントエンド（Next.js）

既に実装済みです。

- `components/QRCodeShare.tsx`: QRコード表示コンポーネント
- `app/slides/[file_id]/page.tsx`: QRボタン統合済み

### 3. Supabase Edge Function のデプロイ

既存の `line-webhook` Edge Function に `view:{hashId}` 処理を追加済みです。

#### 3.1 Edge Function をデプロイ

```bash
cd supabase
supabase functions deploy line-webhook
```

#### 3.2 環境変数（Secrets）を設定

Supabase Dashboard > Settings > Edge Functions で `LIFF_ID` を追加:

```bash
supabase secrets set LIFF_ID=your_liff_id
```

### 4. LINE Developers Consoleの設定

#### 4.1 Webhook URL の確認

既に設定済みのはずですが、確認してください:

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 該当のBotを選択
3. 「Messaging API」タブを開く
4. 「Webhook URL」を確認:
   - 例: `https://your-project.supabase.co/functions/v1/line-webhook`
5. 「Webhookの利用」がONになっているか確認

#### 4.2 LIFF IDの取得（未設定の場合）

1. LINE Developers Console > LIFF タブ
2. 「追加」をクリック
3. 設定:
   - **LIFF app name**: Spresense Slideshow
   - **Size**: Full
   - **Endpoint URL**: `https://your-domain.vercel.app/slides`
   - **Scopes**: `profile`, `openid`
4. 作成後に表示される LIFF ID を環境変数に追加

## 使用方法

### PC側（デスクトップ）

1. Next.jsアプリで `/slides/{file_id}` を開く
   - 開発環境: `npm run dev` → `http://localhost:3000/slides/...`
   - 本番環境: `https://your-domain.vercel.app/slides/...`
2. ヘッダーの「QR」ボタンをクリック（デスクトップのみ表示）
3. QRコードモーダルが表示される

### スマホ側

1. スマホのカメラまたはLINEアプリのQRコードリーダーでQRコードを読み取る
2. LINEアプリが開く
   - Bot未友達の場合: 友達追加画面 → 追加後にメッセージ送信
   - Bot友達済みの場合: トーク画面が開いて自動メッセージ送信
3. 自動的に「view:{hashId}」メッセージが送信される
4. Botから画像付きのFlex Messageが届く
5. 「🎬 スライドショーで見る」ボタンをタップ
6. LIFFアプリで画像がスライドショー表示される

## トラブルシューティング

### QRコードが表示されない

- **原因**: モバイルブラウザで開いている
- **解決**: デスクトップブラウザ（画面幅768px以上）で開く

### Botがメッセージに反応しない

1. Supabase Edge Functionがデプロイされているか確認
   ```bash
   supabase functions list
   ```
2. Webhook URLが正しいか確認（LINE Developers Console）
3. Edge Functionのログを確認:
   ```bash
   supabase functions logs line-webhook
   ```
   または Supabase Dashboard > Edge Functions > line-webhook > Logs

### 画像が見つからないエラー

- **原因**: hashIdが一致する画像がSupabaseにない
- **解決**:
  1. Supabaseバケットに `_original_` を含むファイルが存在するか確認
  2. hashIdの生成ロジックが一致しているか確認（`lib/utils.ts` の `generateHashId`）

### Flex Messageが表示されない

1. LIFF URLが正しいか確認
2. 画像URLがアクセス可能か確認（ブラウザで直接開けるか）
3. Flex Message JSONのフォーマットが正しいか確認

## 本番環境へのデプロイ

### Supabase Edge Function

既にデプロイ済みです（`line-webhook`）

環境変数（Secrets）を本番環境に設定:

```bash
supabase secrets set LIFF_ID=your_production_liff_id --project-ref your-project-ref
```

### フロントエンド（Next.js）

Vercelにデプロイする場合、環境変数を設定:

1. Vercel Dashboard > Settings > Environment Variables
2. 以下を追加:
   ```
   NEXT_PUBLIC_LINE_BOT_ID=@168tgskj
   NEXT_PUBLIC_LIFF_ID=your_liff_id
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. 再デプロイ

## 技術スタック

- **フロントエンド**: Next.js 16, qrcode.react, @line/liff
- **バックエンド**: Supabase Edge Functions (Deno), @line/bot-sdk
- **インフラ**: Supabase Functions, Vercel

## ファイル構成

```
spresense/
├── spresense-slideshow/
│   ├── components/
│   │   └── QRCodeShare.tsx          # QRコード表示コンポーネント
│   ├── app/
│   │   └── slides/
│   │       └── [file_id]/
│   │           └── page.tsx         # QRボタン統合済み
│   └── lib/
│       └── utils.ts                 # generateHashId関数
│
├── supabase/
│   └── functions/
│       └── line-webhook/
│           ├── index.ts             # メインハンドラー（view:{hashId}処理追加済み）
│           ├── line.ts              # LINE API処理（Flex Message送信追加済み）
│           ├── storage.ts           # Storage処理（hashId検索追加済み）
│           └── gemini.ts            # Gemini API処理
│
└── QR_CODE_SETUP.md                # このファイル
```

## 次のステップ

- [ ] リッチメニューに「スライドショーを見る」ボタンを追加
- [ ] Flex Messageのデザインをカスタマイズ
- [ ] エラーハンドリングの強化
- [ ] アクセスログの記録
