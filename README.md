# Boom!ヒーロー!! 🦸‍♂️💥

**ポーズを決めろ！その瞬間、キミはヒーローだ。**

「Boom!ヒーロー!!」は、Sony Spresenseカメラで撮影した写真や、LINEで送信した画像を、AIが自動でアメコミ風に変換し、LINE BotとWebアプリケーションで楽しむことができる完全自動化システムです。

撮影から変換、通知、共有まで全自動。誰でも簡単にヒーローになれる、新しいエンターテイメント体験を提供します。

---

## 🎯 3つのポイント

### 1. ⚙️🤖 完全自動化システム
撮影 → AI判定・変換 → 保存 → LINE通知が全自動で動作。人の手を介さないシームレスな処理を実現しています。

### 2. 🔗💡 IoT × AI × Web の統合
Spresense (IoT) + Gemini (AI) + Supabase + LINE Bot + Next.js。最新技術を横断的に統合したモダンなアーキテクチャです。

### 3. 🦸‍♂️✨ 誰でもヒーローになれる体験
ポーズを決めるだけでアメコミ風の画像に変換。LINEで受け取り、友達と簡単に共有できるエンタメ性の高いアプリケーションです。

---

## 🌟 2つの利用方法

本システムは、**2つの入り口**から利用できます：

### 📸 方法① Spresense IoTカメラによる自動撮影
- Sony Spresenseカメラがあなたのヒーローポーズを自動撮影
- AIがポーズを判定し、条件に合う場合のみアメコミ風に変換
- イベントやパーティーでの自動撮影に最適

### 📱 方法② LINE Botで画像を送信
- LINEアプリから直接画像を送信
- すべての画像をアメコミ風に自動変換
- 既存の写真をヒーロー風にしたいときに便利

---

## 🛠️ システム構成図

![システム構成図](docs/wham_pose_detector_system.png)

本システムは、IoTデバイス、AI、クラウドサービス、メッセージングアプリ、Webアプリケーションを連携させた8つのフェーズで構成される完全自動化システムです。

### フロー① LINE Bot経由の画像処理

1. **フェーズ1A: 画像送信** - ユーザーがLINEで画像を送信
2. **フェーズ2A: 通信** - LINE Webhook (Supabase Edge Function) が受信
3. **フェーズ3A: AI変換** - Gemini APIでアメコミ風に変換
4. **フェーズ6: アップロード** - Supabase Storageに保存
5. **フェーズ7: 配信** - Edge Functionが画像リストを配信
6. **フェーズ8: 表示** - LINE Push APIで通知 & Web表示

### フロー② Spresense経由の自動撮影

1. **フェーズ1B: 撮影** - Spresenseカメラが自動撮影
2. **フェーズ2B: 通信** - シリアル通信でPythonスクリプトに送信
3. **フェーズ3B: AI分析** - Gemini APIでポーズ判定
4. **フェーズ4: 判定** - ポーズありの場合のみ次へ
5. **フェーズ5: 変換** - MetaMeクラウドでアメコミ風に変換
6. **フェーズ6-8** - 保存・配信・表示

---

## ✨ 主な機能

### 📸 IoT自動撮影（Spresense）
Sony Spresenseボードがヒーローポーズを自動撮影。カメラの前でポーズを決めるだけで、自動で処理が始まります。

### 📱 LINE Bot画像処理（Webhook）
LINEアプリから画像を送信するだけで、すべての画像をアメコミ風に自動変換。手軽に楽しめます。

### 🤖 AIによる自動変換（Gemini + MetaMe）
- **Google Gemini AI 2.5 Flash**: 人物・ポーズの自動判定
- **MetaMeクラウドレンダリング**: アメコミ風画像変換
  - 太い輪郭線
  - 鮮やか色彩
  - 効果音追加

### 💬 LINE Bot連携
変換された画像とオリジナル画像が、あなたのLINEに直接届きます。プッシュ通知で即座に確認できます。

### 🌐 Webアプリケーション（Next.js）

4つのページで構成：

- **`/`** - リアルタイムスライドショー（2-3秒でランダム切替、30秒ごとに新規画像を自動検出）
- **`/lp`** - サービス紹介LP・LINE Bot友達追加導線
- **`/slides`** - 写真ギャラリー（グリッド表示、全画像一覧）
- **`/slides/[id]`** - 画像詳細・LIFF共有ページ

### 📲 LIFFによる共有
LINEアプリ内で動作するWebページから、あなたの「ヒーロー」写真を友達に直接共有できます。

### 📱 MetaMeバーチャル世界
MetaMeギャラリーで画像を表示。新しいXR体験を提供します。

---

## 💻 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **ハードウェア** | Sony Spresense + Camera |
| **IoT/バックエンド** | Python + Arduino |
| **AI/画像処理** | Google Gemini AI 2.5 Flash<br>MetaMeクラウドレンダリング |
| **クラウド** | Supabase (Storage + Edge Functions) |
| **Webhook** | LINE Webhook (Supabase Edge Function) |
| **メッセージング** | LINE Bot API + LIFF |
| **フロントエンド** | Next.js + TypeScript + Tailwind CSS |
| **ホスティング** | GitHub Pages |
| **CI/CD** | GitHub Actions |
| **XR体験** | MetaMeバーチャル世界 |

---

## 📂 ディレクトリ構成

```
spresense/
├── frontend/              # Next.js Webアプリケーション
│   ├── app/              # App Router (Next.js 14+)
│   │   ├── page.tsx      # スライドショーページ (/)
│   │   ├── lp/           # ランディングページ (/lp)
│   │   └── slides/       # ギャラリー・詳細ページ
│   ├── components/       # Reactコンポーネント
│   └── lib/              # ユーティリティ・型定義
├── supabase/             # Supabase関連
│   └── functions/        # Edge Functions
│       ├── get-original-images/   # 画像リスト取得API
│       └── line-webhook/          # LINE Webhook処理
├── iot/                  # IoT/Pythonスクリプト
│   └── integrated_photo_system.py # Spresense連携システム
├── docs/                 # ドキュメント
│   └── wham_pose_detector_system.drawio/png # システム構成図
└── README.md             # このファイル
```

---

## 🚀 セットアップ

### 1. フロントエンドのセットアップ

`/frontend` ディレクトリでWebアプリケーションをローカルで実行できます。

#### 依存関係のインストール

```bash
cd frontend
pnpm install
```

#### 環境変数の設定

`frontend`ディレクトリに `.env.local` ファイルを作成し、以下の内容を記述します。

```env
# Supabase
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-supabase-project-id
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# LINE
NEXT_PUBLIC_LIFF_ID=your-liff-id
NEXT_PUBLIC_LINE_BOT_ID=your-line-bot-id
```

#### 開発サーバーの起動

```bash
pnpm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 2. Supabase Edge Functionsのセットアップ

```bash
# Supabase CLIをインストール
npm install -g supabase

# プロジェクトにリンク
supabase link --project-ref your-project-ref

# Edge Functionsをデプロイ
supabase functions deploy get-original-images
supabase functions deploy line-webhook
```

### 3. IoT（Spresense）のセットアップ

詳細は `/iot` ディレクトリのドキュメントを参照してください。

---

## 🌐 デプロイ

このリポジトリでは、GitHub Actionsを利用して、`main`ブランチへのプッシュをトリガーに`/frontend`アプリケーションをビルドし、GitHub Pagesへ自動でデプロイします。

デプロイを機能させるには、GitHubリポジトリの **Settings > Secrets and variables > Actions** で、以下の**Repository secrets**を設定する必要があります。

- `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_LIFF_ID`
- `NEXT_PUBLIC_LINE_BOT_ID`

---

## ⚡ 処理フロー

- **撮影〜AI分析**: 5-15秒
- **アメコミ変換**: 10-30秒
- **アップロード〜LINE配信**: 2-5秒
- **Web自動リフレッシュ**: 30秒間隔
- **合計処理時間**: 約20-50秒/枚

---

## 🎨 ユースケース

- **イベント会場**: デジタルサイネージとしてスライドショーを大画面表示
- **パーティー**: 参加者の写真をリアルタイムで共有
- **エンターテイメント**: 誰でも楽しめるアメコミヒーロー体験
- **技術デモ**: IoT × AI × Web の統合システムのショーケース

---

## 📝 ライセンス

このプロジェクトは [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ライセンスの下で公開されています。
---

## 🔗 リンク

- **デモサイト**: [https://4geru.github.io/spresense-playground/](https://4geru.github.io/spresense-playground/)
- **Protopedia**: [https://protopedia.net/prototype/7609](https://protopedia.net/prototype/7609)

---

**「Boom!ヒーロー!!」で、あなたもヒーローになろう！ 🦸‍♂️💥**
