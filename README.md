# Boom!ヒーロー!! 🦸‍♂️💥

「Boom!ヒーロー!!」は、Sony Spresenseカメラで撮影した写真を、AIが自動でアメコミ風に変換し、LINE BotとWebアプリケーションで楽しむことができる完全自動化システムです。

あなたがヒーローポーズを決めると、その瞬間がクールなコミックアートに生まれ変わります！

```mermaid
graph TD
    subgraph "1. 撮影フェーズ"
        A[📸 Spresenseカメラ] -- 写真撮影 --> B(💻 Mac上のPythonスクリプト);
        B -- 撮影コマンド送信 --> A;
    end

    subgraph "2. AI分析・画像変換フェーズ"
        B -- 画像データ --> C{🤖 Google Gemini API};
        C -- ポーズ判定結果 --> B;
        B -- "ポーズあり"の場合 --> D[🎨 アメコミ風に画像変換];
        B -- "ポーズなし"の場合 --> E[処理をスキップ];
    end

    subgraph "3. 保存・通知フェーズ"
        D -- 変換後 & オリジナル画像 --> F[☁️ Supabase Storage];
        E -- オリジナル画像 --> F;
        F -- 画像URL --> G[💬 LINE Bot];
        G -- プッシュメッセージ送信 --> H[📱 ユーザーのLINEアプリ];
    end

    subgraph "4. Webフロントエンドフェーズ (GitHub Pages)"
        I[🌐 Next.js アプリ] -- 画像リスト要求 --> J[☁️ Supabase Functions];
        J -- 画像リスト応答 --> I;
        K[💻 ユーザーのブラウザ] -- アクセス --> I;
        I -- スライドショー/ギャラリー表示 --> K;
        H -- メッセージ内のリンクをクリック --> I;
        K -- 共有ボタンクリック --> L[🔗 LIFF (LINE Front-end Framework)];
        L -- LINEの友達に共有 --> H;
    end
```

---

## ✨ 主な機能

- **📸 IoT写真撮影:** Sony Spresenseボードがあなたのヒーローポーズを撮影します。
- **🤖 AIによる自動変換:** Google Geminiが写真から人物のポーズを認識し、条件に合う場合にのみ自動でアメコミ風の画像に変換します。
- **💬 LINE Bot連携:** 変換された画像とオリジナル画像が、あなたのLINEに直接届きます。
- **🖼️ Webスライドショー＆ギャラリー:** Next.jsで構築されたWebサイトで、これまでに撮影された全ての画像をスライドショーやギャラリー形式で閲覧できます。
- **📲 LIFFによる共有:** LINEアプリ内で動作するWebページから、あなたの「ヒーロー」写真を友達に直接共有できます。

## 🛠️ システムアーキテクチャ

本システムは、IoTデバイス、AI、クラウドサービス、メッセージングアプリを連携させたモダンな構成です。

1.  **Spresense (`/iot`)**: カメラで写真を撮影し、USBシリアル経由でPC（Pythonスクリプト）に送信します。
2.  **Pythonバックエンド (`/iot`)**:
    -   受信した画像をGoogle Gemini APIに送信し、人物やポーズの有無を判定します。
    -   判定結果に基づき、画像をアメコミ風に変換します。
    -   オリジナル画像と変換後画像をSupabase Storageにアップロードします。
    -   処理結果をLINE Bot経由でユーザーに通知します。
3.  **Supabase (`/supabase`)**:
    -   **Storage**: 全ての画像を保存・管理します。
    -   **Edge Functions**: フロントエンドに画像リストを配信するAPIを提供します。
4.  **Next.jsフロントエンド (`/frontend`)**:
    -   Supabaseから画像を取得し、スライドショーやギャラリーページを生成します。
    -   GitHub Pages上で静的サイトとしてホスティングされます。
    -   LINE Front-end Framework (LIFF) と連携し、LINE内でのシームレスな体験（ログイン、共有）を提供します。

## 💻 技術スタック

-   **ハードウェア**: Sony Spresense
-   **IoT / バックエンド**: Python, Arduino
-   **AI**: Google Gemini
-   **フロントエンド**: Next.js, React, TypeScript, Tailwind CSS
-   **クラウド**: Supabase (Storage, Edge Functions), GitHub Pages (Hosting)
-   **メッセージング**: LINE Bot, LIFF

## 🚀 フロントエンドのセットアップ

`/frontend` ディレクトリでWebアプリケーションをローカルで実行できます。

### 1. 依存関係のインストール

```bash
cd frontend
pnpm install
```

### 2. 環境変数の設定

`frontend`ディレクトリに `.env.local` ファイルを作成し、以下の内容を記述します。

```env
# Supabase
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-supabase-project-id
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# LINE
NEXT_PUBLIC_LIFF_ID=your-liff-id
NEXT_PUBLIC_LINE_BOT_ID=your-line-bot-id
```

### 3. 開発サーバーの起動

```bash
pnpm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 🌐 デプロイ

このリポジトリでは、GitHub Actionsを利用して、`main`ブランチへのプッシュをトリガーに`/frontend`アプリケーションをビルドし、GitHub Pagesへ自動でデプロイします。

デプロイを機能させるには、GitHubリポジトリの **Settings > Secrets and variables > Actions** で、以下の**Repository secrets**を設定する必要があります。

-   `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
-   `NEXT_PUBLIC_LIFF_ID`
-   `NEXT_PUBLIC_LINE_BOT_ID`

