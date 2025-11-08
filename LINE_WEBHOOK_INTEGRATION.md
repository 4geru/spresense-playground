# LINE Webhook統合ガイド

## 概要

このプロジェクトでは、**2つの画像入力ソース**に対応しています：

1. **Spresenseカメラ** → Python → Gemini分析 → LINE Push API送信
2. **LINE画像投稿** → Supabase Edge Function → Gemini分析 → LINE Reply API返信

## システム構成

```
┌─────────────────────────────────────────────────────────────┐
│                    画像入力ソース                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] Spresenseカメラ           [2] LINEユーザー             │
│       │                              │                       │
│       │ (シリアル通信)                │ (画像送信)            │
│       ▼                              ▼                       │
│  integrated_photo_system.py    Supabase Edge Function       │
│  (Python)                      (TypeScript/Deno)             │
│       │                              │                       │
│       ├─ Gemini: 人・ポーズ判定      ├─ Gemini: 人・ポーズ判定│
│       ├─ アメコミ風変換              ├─ アメコミ風変換       │
│       ├─ Supabase Storage           ├─ Supabase Storage     │
│       │  アップロード                │  アップロード         │
│       ▼                              ▼                       │
│  LINE Push API                 LINE Reply API               │
│  (ブロードキャスト)             (会話として返信)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## ファイル構成

```
spresense/
│
├── integrated_photo_system.py          # Spresense用Python処理
├── line_bot_push.py                    # LINE Push API
├── simple_image_editor.py              # Python版アメコミ変換
│
└── supabase/
    └── functions/
        └── line-webhook/               # 🆕 LINE Webhook処理
            ├── index.ts                # メインハンドラー
            ├── gemini.ts               # Gemini API処理
            ├── line.ts                 # LINE API処理
            ├── storage.ts              # Supabase Storage処理
            └── README.md               # 詳細ドキュメント
```

## 新機能: LINE Webhook対応

### 機能概要

LINEから画像を投稿すると、以下の処理が自動実行されます：

1. **Webhook受信**: Supabase Edge Functionが画像メッセージを受信
2. **署名検証**: LINE署名を検証してセキュリティ確保
3. **画像ダウンロード**: LINE APIから画像バイナリを取得
4. **Gemini分析**: 人・ポーズ判定（Spresenseと同じロジック）
5. **条件判定**: face=Yes AND pose=Yes
6. **アメコミ風変換**: 条件マッチ時のみ実行
7. **Storageアップロード**: オリジナル & アメコミ風画像を保存
8. **Reply API返信**: 会話の流れでアメコミ風画像を返信

### Spresenseとの違い

| 項目 | Spresense | LINE Webhook |
|------|-----------|--------------|
| **実装言語** | Python | TypeScript/Deno |
| **トリガー** | シリアル通信 | LINE画像投稿 |
| **送信方法** | Push API | Reply API |
| **実行環境** | ローカルMac | Supabase Edge Function |
| **スケール** | 1台のMac | サーバーレス・自動スケール |

### メリット

✅ **どこからでも利用可能**: Macが起動していなくてもLINEから画像投稿可能
✅ **自然な会話フロー**: Reply APIで返信するため、トーク画面で自然なやりとり
✅ **サーバーレス**: インフラ管理不要、自動スケーリング
✅ **コスト効率**: 使った分だけ課金
✅ **全てTypeScript**: 保守性向上、型安全性

## セットアップ方法

### 前提条件

- ✅ Supabase CLI インストール済み
- ✅ Supabaseプロジェクト作成済み
- ✅ LINE Bot作成済み
- ✅ Gemini API Key取得済み

### クイックスタート

1. **環境変数を設定**

```bash
cd supabase/functions
cp .env.local.sample .env.local
# .env.local を編集して LINE_CHANNEL_SECRET を追加
```

2. **ローカルでテスト**

```bash
# Edge Functionをローカルで起動
supabase functions serve line-webhook --env-file supabase/functions/.env.local

# 別のターミナルでngrokを起動
ngrok http 54321
```

3. **LINE Webhook URL設定**

LINE Developer Console:
```
https://xxxx.ngrok-free.app/functions/v1/line-webhook
```

4. **本番デプロイ**

```bash
# デプロイ実行
supabase functions deploy line-webhook

# Supabaseダッシュボードで環境変数を設定
# LINE Webhook URLを本番URLに変更
https://fyxftmwypdfuierggfqw.supabase.co/functions/v1/line-webhook
```

詳細は `supabase/functions/line-webhook/README.md` を参照してください。

## 使い方

### Spresenseカメラで撮影

```bash
# Pythonスクリプト実行（既存）
python integrated_photo_system.py
```

→ Spresenseで撮影 → Macで処理 → LINE Push APIで送信

### LINEから画像投稿

1. LINE Botを友だち追加
2. 人がポーズをしている写真を送信
3. Botが自動で分析・変換して返信

→ LINE投稿 → Edge Functionで処理 → LINE Reply APIで返信

## 動作フロー比較

### Spresenseカメラの場合

```
Spresense撮影
    ↓
シリアル通信でMacに送信
    ↓
integrated_photo_system.py
    ├─ Gemini: 人・ポーズ判定
    ├─ アメコミ風変換
    └─ Supabase Storage
    ↓
LINE Push API
    ↓
全ユーザーに配信
```

### LINEから画像投稿の場合

```
LINE画像送信
    ↓
Edge Function (line-webhook)
    ├─ 署名検証
    ├─ 画像ダウンロード
    ├─ Gemini: 人・ポーズ判定
    ├─ アメコミ風変換
    └─ Supabase Storage
    ↓
LINE Reply API
    ↓
送信者に返信
```

## トラブルシューティング

### LINE_CHANNEL_SECRETが必要

`.env.local` に以下を追加してください:

```bash
LINE_CHANNEL_SECRET=your_channel_secret_here
```

LINE Developer Console > Basic settings > Channel secret から取得できます。

### ローカルテストでWebhookが届かない

1. ngrokが起動しているか確認
2. LINE Developer ConsoleのWebhook URLが正しいか確認
3. Use webhook が ON になっているか確認

### 本番環境で動作しない

1. Supabaseダッシュボードで環境変数が設定されているか確認
2. Edge Functionのログを確認
3. LINE Webhook URLが本番URLになっているか確認

## 参考リンク

- [Supabase Edge Functions ドキュメント](https://supabase.com/docs/guides/functions)
- [LINE Messaging API リファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- [Gemini API ドキュメント](https://ai.google.dev/docs)

## 次のステップ

1. ✅ ローカルでテスト
2. ✅ 本番デプロイ
3. ✅ LINE Webhook URL設定
4. 📸 LINEから画像を送信してテスト
5. 🎨 アメコミ風変換を楽しむ！

---

**作成日**: 2025-01-08
**バージョン**: 1.0.0
