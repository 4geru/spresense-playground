# LINE Webhook Edge Function

LINEから送信された画像を受け取り、Gemini AIで人・ポーズ判定を行い、条件マッチ時にアメコミ風変換を実行してReply APIで返信するSupabase Edge Functionです。

## 機能概要

```
LINE画像送信
    ↓
Webhook受信 & 署名検証
    ↓
画像ダウンロード
    ↓
Gemini AI: 人・ポーズ判定
    ↓
条件判定 (face=Yes AND pose=Yes)
    ↓
アメコミ風変換 (条件マッチ時のみ)
    ↓
Supabase Storageアップロード
    ↓
LINE Reply API返信
```

## ディレクトリ構成

```
supabase/functions/line-webhook/
├── index.ts         # メインハンドラー
├── gemini.ts        # Gemini API処理
├── line.ts          # LINE API処理
├── storage.ts       # Supabase Storage処理
└── README.md        # このファイル
```

## セットアップ手順

### 1. 前提条件

- Supabase CLI がインストール済み
- Supabaseプロジェクトが作成済み
- LINE Botが作成済み
- Gemini API Keyを取得済み

### 2. Supabase CLI インストール（未インストールの場合）

```bash
# macOS
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### 3. Supabaseプロジェクトにログイン

```bash
# Supabaseにログイン
supabase login

# プロジェクトとリンク（初回のみ）
cd /path/to/spresense
supabase link --project-ref fyxftmwypdfuierggfqw
```

### 4. 環境変数の設定

#### ローカルテスト用（.env.local）

`supabase/functions/.env.local` ファイルを編集：

```bash
# LINE Developer Consoleから取得
LINE_CHANNEL_SECRET=your_channel_secret_here

# その他の値は既に設定済み
GEMINI_API_KEY=...
LINE_CHANNEL_ACCESS_TOKEN=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
BUCKET_NAME=line-images
```

**重要**: `LINE_CHANNEL_SECRET` を必ず設定してください！

LINE Developer Consoleで取得:
1. https://developers.line.biz/console/ にアクセス
2. 該当のチャネルを選択
3. Basic settings > Channel secret をコピー

#### 本番環境用（Supabaseダッシュボード）

デプロイ後、Supabaseダッシュボードで環境変数を設定：

1. https://supabase.com/dashboard/project/fyxftmwypdfuierggfqw にアクセス
2. Edge Functions > 環境変数 を開く
3. 以下の環境変数を追加：

```
GEMINI_API_KEY
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
SUPABASE_URL
SUPABASE_ANON_KEY
BUCKET_NAME
```

### 5. Supabase Storage バケット作成

Supabaseダッシュボードで `line-images` バケットを作成（未作成の場合）：

1. Storage > Create a new bucket
2. Name: `line-images`
3. Public bucket: ✅ チェック
4. Create bucket

## ローカルテスト

### 1. Edge Function をローカルで起動

```bash
# プロジェクトルートで実行
cd /Users/4geru/space/spresense

# Edge Functionをローカルで起動
supabase functions serve line-webhook --env-file supabase/functions/.env.local
```

起動すると以下のURLでアクセス可能になります:
```
http://localhost:54321/functions/v1/line-webhook
```

### 2. ngrok でトンネルを作成（LINE Webhookテスト用）

別のターミナルで実行:

```bash
# ngrok をインストール（未インストールの場合）
brew install ngrok

# トンネルを作成
ngrok http 54321
```

ngrokが起動すると、以下のような公開URLが表示されます:
```
https://xxxx-xxxx-xxxx.ngrok-free.app
```

### 3. LINE DeveloperコンソールでWebhook URLを設定

1. https://developers.line.biz/console/ にアクセス
2. 該当のチャネルを選択
3. Messaging API settings > Webhook URL を編集
4. 以下のURLを入力:
   ```
   https://xxxx-xxxx-xxxx.ngrok-free.app/functions/v1/line-webhook
   ```
5. Verify ボタンでテスト（成功すれば ✅）
6. Use webhook: ON に設定

### 4. LINE Botに画像を送信してテスト

1. LINE Botを友だち追加
2. 人がポーズをしている画像を送信
3. ログを確認:
   ```bash
   # Edge Functionのログが表示されます
   # ローカルサーバーのターミナルで確認
   ```

## 本番デプロイ

### 1. Edge Functionをデプロイ

```bash
# プロジェクトルートで実行
cd /Users/4geru/space/spresense

# デプロイ実行
supabase functions deploy line-webhook
```

デプロイが成功すると、以下のようなURLが表示されます:
```
https://fyxftmwypdfuierggfqw.supabase.co/functions/v1/line-webhook
```

### 2. 本番環境の環境変数を設定

Supabaseダッシュボードで環境変数を設定（前述の「本番環境用」を参照）

### 3. LINE DeveloperコンソールでWebhook URLを更新

1. https://developers.line.biz/console/ にアクセス
2. 該当のチャネルを選択
3. Messaging API settings > Webhook URL を編集
4. 以下のURLを入力:
   ```
   https://fyxftmwypdfuierggfqw.supabase.co/functions/v1/line-webhook
   ```
5. Verify ボタンでテスト
6. Use webhook: ON に設定

## 動作確認

### 成功パターン

1. **人がポーズをしている画像を送信**
   - 顔検出: Yes
   - ポーズ検出: Yes
   - → アメコミ風変換実行
   - → アメコミ風画像が返信される

### スキップパターン

2. **人がいるがポーズをしていない画像**
   - 顔検出: Yes
   - ポーズ検出: No
   - → 変換スキップ
   - → 「ポーズが検出されませんでした」というメッセージが返信される

3. **人がいない画像**
   - 顔検出: No
   - ポーズ検出: No
   - → 変換スキップ
   - → 「人の顔が検出されませんでした」というメッセージが返信される

## ログの確認

### ローカル環境

Edge Functionを起動しているターミナルでリアルタイムに表示されます。

### 本番環境

Supabaseダッシュボードでログを確認:

1. https://supabase.com/dashboard/project/fyxftmwypdfuierggfqw にアクセス
2. Edge Functions > line-webhook を選択
3. Logs タブを開く

## トラブルシューティング

### 署名検証エラー (401 Invalid signature)

**原因**: `LINE_CHANNEL_SECRET` が正しく設定されていない

**解決策**:
1. LINE Developer Consoleで Channel secret を確認
2. `.env.local` または Supabaseダッシュボードで正しい値を設定
3. 再起動/再デプロイ

### 画像ダウンロード失敗

**原因**: `LINE_CHANNEL_ACCESS_TOKEN` が無効

**解決策**:
1. LINE Developer Consoleで Channel access token を再発行
2. `.env.local` または Supabaseダッシュボードで更新
3. 再起動/再デプロイ

### AI分析失敗

**原因**: `GEMINI_API_KEY` が無効または上限到達

**解決策**:
1. Gemini API Keyが有効か確認
2. API使用量を確認（上限チェック）
3. 必要に応じて新しいAPI Keyを発行

### Storage アップロード失敗

**原因**: バケットが存在しないまたはアクセス権限不足

**解決策**:
1. Supabaseダッシュボードで `line-images` バケットが存在するか確認
2. バケットが Public に設定されているか確認
3. `SUPABASE_ANON_KEY` が正しいか確認

## モジュール詳細

### gemini.ts

- `analyzePersonAndPose()`: 人・ポーズ判定
- `convertToComicStyle()`: アメコミ風変換
- `shouldConvertToComic()`: 条件判定

### line.ts

- `validateSignature()`: Webhook署名検証
- `downloadImageContent()`: 画像ダウンロード
- `replyMessage()`: Reply API送信
- `sendComicConversionResult()`: 成功メッセージ送信
- `sendConditionNotMetMessage()`: 条件不一致メッセージ送信

### storage.ts

- `uploadImage()`: 単一画像アップロード
- `uploadBothImages()`: オリジナル&アメコミ両方アップロード
- `uploadOriginalOnly()`: オリジナルのみアップロード

### index.ts

- メインハンドラー: Webhook受信、署名検証、処理フロー制御

## 開発時の注意点

1. **非同期処理**: LINE Webhookは5秒以内に200を返す必要があるため、画像処理は非同期で実行
2. **エラーハンドリング**: 各段階でエラーをキャッチしてユーザーに適切なメッセージを返信
3. **ログ出力**: デバッグしやすいように各段階でログを出力
4. **型安全性**: TypeScriptの型定義を活用してバグを防止

## ライセンス

このプロジェクトは個人利用のみを想定しています。

## サポート

問題が発生した場合は、Supabase Edge Functionのログを確認してください。
