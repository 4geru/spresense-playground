# Sony Spresense画像をLINE Botで送信するシステム構築ガイド

## はじめに

Sony Spresenseで撮影した画像を自動的にLINE Botで送信するシステムの構築方法を解説します。

この記事では、**Supabaseストレージを利用した画像アップロードとLINE Bot API連携**を実現する完全なシステムを構築します。

**こんな方におすすめ：**
- Spresenseで撮影した画像をLINEで共有したい
- IoTデバイスからの画像通知システムを作りたい
- Supabaseストレージを活用したい
- LINE Bot開発を学びたい

## TL;DR（結論）

**システム構成**: Spresense撮影 → Python処理 → Supabaseアップロード → LINE Bot送信  
**通信方法**: LINE Bot Push API + Supabase Storage API  
**制御**: Python → 画像アップロード → LINE送信

```python
# Python側で画像送信
from line_bot_push import send_image_with_line_push

success = send_image_with_line_push("images/peace.jpeg", "captured_images/preview.jpg")
```

## 環境・使用サービス

```
【ハードウェア】
- Sony Spresense メインボード + Camera Board
- 撮影済み画像ファイル

【クラウドサービス】
- LINE Bot (LINE Developers Console)
- Supabase (ストレージ + Database)

【ソフトウェア】
- Python 3.x
- 必要ライブラリ: supabase, requests, python-dotenv, Pillow

【開発環境】
- macOS/Windows/Linux
- .env ファイルでの環境変数管理
```

## システム概要

### 🔄 動作フロー

1. **画像準備**: Spresenseで撮影された画像ファイル（オリジナル・プレビュー）
2. **Supabaseアップロード**: 2つの画像をクラウドストレージにアップロード
3. **公開URL取得**: アップロードした画像の公開URLを取得
4. **LINE Bot送信**: 画像メッセージとして送信（プレビュー・オリジナル別指定）

### 📡 システム構成

```
Python Script
    ↓
[1] upload_images_to_supabase()
    ↓ 
Supabase Storage (画像保存)
    ↓
[2] send_line_message()
    ↓
LINE Bot API (メッセージ送信)
    ↓
LINEアプリ (ユーザーに配信)
```

## Python実装 (完全版)

### メインファイル: `line_bot_push.py`

```python
#!/usr/bin/env python3
"""
LINE Bot への画像情報を push するスクリプト

環境変数:
- LINE_CHANNEL_ACCESS_TOKEN: LINE Bot のアクセストークン
- LINE_USER_ID: 送信先のユーザーID (オプション: 指定しない場合はブロードキャスト)

使用例:
python line_bot_push.py
"""

import os
import sys
import requests
import json
from datetime import datetime
from typing import Optional, Tuple, List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

# .envファイルから環境変数を読み込み
load_dotenv()

# Supabaseクライアントの初期化
def _get_supabase_client() -> Tuple[Client, str]:
    """Supabaseクライアントとバケット名を取得"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    bucket_name = os.getenv('SUPABASE_BUCKET_NAME')
    
    if not all([supabase_url, supabase_key, bucket_name]):
        raise ValueError("Supabase environment variables are required")
    
    if not supabase_url.startswith('http'):
        supabase_url = f"https://{supabase_url}.supabase.co"
    
    supabase = create_client(supabase_url, supabase_key)
    return supabase, bucket_name

# LINE Botクライアントの初期化
def _get_line_bot_config() -> Tuple[str, str, str]:
    """LINE Botの設定を取得"""
    access_token = os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
    if not access_token:
        raise ValueError("LINE_CHANNEL_ACCESS_TOKEN environment variable is required")
    
    push_url = 'https://api.line.me/v2/bot/message/push'
    broadcast_url = 'https://api.line.me/v2/bot/message/broadcast'
    
    return access_token, push_url, broadcast_url

# [1] Supabaseへ画像をアップロードする関数
def upload_images_to_supabase(original_path: str, preview_path: str) -> Optional[Tuple[str, str]]:
    """
    指定されたオリジナル画像とプレビュー画像をSupabaseストレージにアップロード
    Args:
        original_path: オリジナル画像のファイルパス
        preview_path: プレビュー画像のファイルパス
    Returns: 
        (original_url, preview_url) のタプル、失敗時はNone
    """
    try:
        supabase, bucket_name = _get_supabase_client()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # オリジナル画像をアップロード
        with open(original_path, 'rb') as f:
            original_data = f.read()
        
        original_file_name = f"{timestamp}_original_{os.path.basename(original_path)}"
        
        supabase.storage.from_(bucket_name).upload(
            original_file_name,
            original_data,
            file_options={
                "content-type": "image/jpeg",
                "upsert": "true"
            }
        )
        
        # プレビュー画像をアップロード
        with open(preview_path, 'rb') as f:
            preview_data = f.read()
        
        preview_file_name = f"{timestamp}_preview_{os.path.basename(preview_path)}"
        
        supabase.storage.from_(bucket_name).upload(
            preview_file_name,
            preview_data,
            file_options={
                "content-type": "image/jpeg",
                "upsert": "true"
            }
        )
        
        # 公開URLを取得
        original_url = supabase.storage.from_(bucket_name).get_public_url(original_file_name)
        preview_url = supabase.storage.from_(bucket_name).get_public_url(preview_file_name)
        
        print(f"画像のアップロードに成功:")
        print(f"オリジナル: {original_file_name}")
        print(f"プレビュー: {preview_file_name}")
        print(f"オリジナルURL: {original_url}")
        print(f"プレビューURL: {preview_url}")
        
        return (original_url, preview_url)
        
    except Exception as e:
        print(f"画像のアップロード中にエラー: {e}")
        return None


# [2] LINE pushメッセージを送信する関数
def send_line_message(messages: List[Dict[str, Any]], user_id: Optional[str] = None) -> bool:
    """
    LINE Botでメッセージを送信
    Args:
        messages: 送信するメッセージのリスト
        user_id: 送信先のユーザーID (Noneの場合はブロードキャスト)
    Returns:
        送信成功時True、失敗時False
    """
    try:
        access_token, push_url, broadcast_url = _get_line_bot_config()
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # 送信するデータを構築
        if user_id:
            # 特定のユーザーに送信
            data = {
                "to": user_id,
                "messages": messages
            }
            response = requests.post(push_url, headers=headers, json=data)
        else:
            # ブロードキャスト送信
            data = {
                "messages": messages
            }
            response = requests.post(broadcast_url, headers=headers, json=data)
        
        if response.status_code == 200:
            print("メッセージの送信に成功")
            return True
        else:
            print(f"送信に失敗: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"メッセージ送信中にエラー: {e}")
        return False


# [3] preview/original URL指定してメッセージを送信する関数（他ファイルから呼び出し用）
def send_image_with_line_push(original_path: str, preview_path: str, user_id: Optional[str] = None) -> bool:
    """
    指定した画像をアップロードしてLINE Botで送信
    Args:
        original_path: オリジナル画像のファイルパス
        preview_path: プレビュー画像のファイルパス
        user_id: 送信先のユーザーID (Noneの場合はブロードキャスト)
    Returns:
        送信成功時True、失敗時False
    """
    try:
        # ファイルの存在確認
        if not os.path.exists(original_path):
            print(f"オリジナル画像が見つかりません: {original_path}")
            return False
        
        if not os.path.exists(preview_path):
            print(f"プレビュー画像が見つかりません: {preview_path}")
            return False
        
        # [1] 画像をSupabaseにアップロード
        image_urls = upload_images_to_supabase(original_path, preview_path)
        
        if not image_urls:
            print("画像のアップロードに失敗しました")
            return False
        
        original_url, preview_url = image_urls
        
        # メッセージを構築
        messages = []
        
        # 画像メッセージ
        messages.append({
            "type": "image",
            "originalContentUrl": original_url,
            "previewImageUrl": preview_url
        })
        
        # 情報テキスト
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        info_text = f"""📸 画像送信完了
オリジナル: {os.path.basename(original_path)}
プレビュー: {os.path.basename(preview_path)}
送信時刻: {timestamp}
✅ 画像アップロード成功"""
        
        messages.append({
            "type": "text",
            "text": info_text
        })
        
        # [2] LINE Botでメッセージを送信
        return send_line_message(messages, user_id)
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return False


# [4] mainで[3]から全てを呼び出す関数
def main():
    """
    メイン関数：指定された画像でLINE Bot送信を実行
    """
    try:
        # 指定された画像ファイル
        original_path = "images/peace.jpeg"
        preview_path = "captured_images/capture_1760191954.jpg"
        
        # 環境変数からユーザーIDを取得（オプション）
        user_id = os.getenv('LINE_USER_ID')
        
        print(f"LINE Bot画像送信を開始...")
        print(f"オリジナル画像: {original_path}")
        print(f"プレビュー画像: {preview_path}")
        
        # [3] 画像送信を実行
        success = send_image_with_line_push(original_path, preview_path, user_id)
        
        if success:
            print("✅ LINE Bot画像送信が完了しました")
        else:
            print("❌ LINE Bot画像送信に失敗しました")
            sys.exit(1)
            
    except ValueError as e:
        print(f"設定エラー: {e}")
        print("\n必要な環境変数:")
        print("- LINE_CHANNEL_ACCESS_TOKEN: LINE Bot のアクセストークン")
        print("- LINE_USER_ID: 送信先のユーザーID (オプション)")
        print("- SUPABASE_URL: Supabase プロジェクトのURL")
        print("- SUPABASE_ANON_KEY: Supabase の匿名キー")
        print("- SUPABASE_BUCKET_NAME: 画像保存用のバケット名")
        sys.exit(1)
    except Exception as e:
        print(f"予期しないエラー: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### 環境設定ファイル: `.env`

```bash
# Gemini API (既存)
GEMINI_API_KEY=your_gemini_api_key_here

# LINE Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here
LINE_USER_ID=your_line_user_id_here

# Supabase 設定
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_BUCKET_NAME=your_bucket_name_here
```

### 依存関係ファイル: `requirements-dev.txt`

```
google-genai
python-dotenv
google-generativeai
pyserial
Pillow
line-bot-sdk
requests
supabase
```

## 🛠️ セットアップ手順

### Step 1: LINE Bot の作成

1. **LINE Developers Console にアクセス**
   - https://developers.line.biz/console/
   
2. **新しいプロバイダーとチャネルを作成**
   - チャネル種別: "Messaging API"
   
3. **必要な情報を取得**
   ```
   Channel Access Token: .envのLINE_CHANNEL_ACCESS_TOKEN
   ユーザーID: 友だち追加後にメッセージから取得
   ```

### Step 2: Supabase プロジェクトの準備

1. **Supabaseアカウント作成・プロジェクト作成**
   - https://supabase.com/
   
2. **ストレージバケット作成**
   ```sql
   -- Storage > Create bucket
   Bucket name: line-images
   Public bucket: true
   ```

3. **プロジェクト情報を取得**
   ```
   Project URL: Settings > API > Project URL
   Anon Key: Settings > API > anon/public key
   ```

### Step 3: Python環境の準備

1. **仮想環境セットアップ**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # macOS/Linux
   # .venv\Scripts\activate   # Windows
   ```

2. **依存関係インストール**
   ```bash
   pip install -r requirements-dev.txt
   ```

3. **環境変数設定**
   - `.env`ファイルに実際の値を設定

### Step 4: 動作テスト

```bash
# テスト実行
python3 line_bot_push.py
```

期待される出力:
```
LINE Bot画像送信を開始...
オリジナル画像: images/peace.jpeg
プレビュー画像: captured_images/capture_1760191954.jpg
画像のアップロードに成功:
オリジナル: 20241012_101631_original_peace.jpeg
プレビュー: 20241012_101631_preview_capture_1760191954.jpg
オリジナルURL: https://fyxftmwypdfuierggfqw.supabase.co/storage/v1/object/public/line-images/20241012_101631_original_peace.jpeg
プレビューURL: https://fyxftmwypdfuierggfqw.supabase.co/storage/v1/object/public/line-images/20241012_101631_preview_capture_1760191954.jpg
メッセージの送信に成功
✅ LINE Bot画像送信が完了しました
```

## 🎯 実装上の重要ポイント

### 1. 関数ベース設計

**✅ 利点:**
```python
# [1] アップロード関数
upload_images_to_supabase(original_path, preview_path)

# [2] 送信関数  
send_line_message(messages, user_id)

# [3] 統合関数（他ファイルから呼び出し可能）
send_image_with_line_push(original_path, preview_path, user_id)
```

### 2. 別URLでのプレビュー・オリジナル指定

```python
# LINE Bot画像メッセージの構造
{
    "type": "image",
    "originalContentUrl": "https://example.com/original.jpg",    # タップ時の高解像度
    "previewImageUrl": "https://example.com/preview.jpg"         # 一覧表示用
}
```

### 3. エラーハンドリング

```python
# ファイル存在確認
if not os.path.exists(original_path):
    print(f"オリジナル画像が見つかりません: {original_path}")
    return False

# API応答確認
if response.status_code == 200:
    return True
else:
    print(f"送信に失敗: {response.status_code} - {response.text}")
    return False
```

## 🔧 他ファイルからの呼び出し方法

### カメラキャプチャスクリプトとの連携

```python
# capture_and_notify.py
from line_bot_push import send_image_with_line_push

def capture_and_notify():
    """撮影後にLINE通知"""
    # Spresenseで撮影実行
    latest_image = capture_latest_image()  # 撮影関数
    
    if latest_image:
        # LINE Botで通知
        success = send_image_with_line_push(
            original_path="images/peace.jpeg",      # 固定のオリジナル画像
            preview_path=latest_image,              # 撮影した画像をプレビューに
            user_id=None  # ブロードキャスト
        )
        
        if success:
            print("📱 LINE通知完了")
        else:
            print("❌ LINE通知失敗")
```

### 定期実行スクリプト

```python
# scheduler.py
import schedule
import time
from line_bot_push import send_image_with_line_push

def hourly_capture():
    """毎時撮影・通知"""
    latest_image = get_latest_captured_image()
    send_image_with_line_push(
        original_path="images/peace.jpeg",
        preview_path=latest_image
    )

# 毎時0分に実行
schedule.every().hour.at(":00").do(hourly_capture)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## 🌟 応用・拡張アイデア

### 1. 複数画像対応

```python
def send_multiple_images(image_pairs: List[Tuple[str, str]]):
    """複数画像の一括送信"""
    for original, preview in image_pairs:
        send_image_with_line_push(original, preview)
        time.sleep(1)  # レート制限対策
```

### 2. 画像解析連携

```python
def analyze_and_notify(image_path: str):
    """AI解析結果付きで通知"""
    # Gemini AIで画像解析
    analysis = analyze_with_gemini(image_path)
    
    # 解析結果をテキストに追加
    messages = [{
        "type": "text", 
        "text": f"🤖 AI解析結果:\n{analysis}"
    }]
    
    send_line_message(messages)
```

### 3. 条件分岐通知

```python
def smart_notification(image_path: str):
    """条件に応じた通知"""
    file_size = os.path.getsize(image_path)
    
    if file_size > 1024 * 1024:  # 1MB以上
        # 高解像度画像として通知
        send_image_with_line_push("images/high_quality.jpg", image_path)
    else:
        # 通常画像として通知
        send_image_with_line_push(image_path, image_path)
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

| 症状 | 原因 | 解決方法 |
|------|------|----------|
| `❌ ValueError: LINE_CHANNEL_ACCESS_TOKEN environment variable is required` | 環境変数未設定 | `.env`ファイルに正しいトークンを設定 |
| `❌ ValueError: Supabase environment variables are required` | Supabase設定不足 | URL、KEY、BUCKET_NAMEを全て設定 |
| 画像が送信されない | ファイルパス間違い | `os.path.exists()`で存在確認 |
| 400 Bad Request | LINE Bot設定エラー | チャネル設定とトークンを再確認 |

### デバッグ用コマンド

```python
# 環境変数確認
def check_environment():
    required_vars = [
        'LINE_CHANNEL_ACCESS_TOKEN',
        'SUPABASE_URL', 
        'SUPABASE_ANON_KEY',
        'SUPABASE_BUCKET_NAME'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        print(f"{var}: {'✅ 設定済み' if value else '❌ 未設定'}")

# ファイル存在確認
def check_files():
    files = ["images/peace.jpeg", "captured_images/capture_1760191954.jpg"]
    for file_path in files:
        exists = os.path.exists(file_path)
        print(f"{file_path}: {'✅ 存在' if exists else '❌ 未発見'}")
```

## 📚 参考資料・関連リンク

### 公式ドキュメント
- 📖 [LINE Messaging API リファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- 🔧 [Supabase Storage ドキュメント](https://supabase.com/docs/guides/storage)
- 🐍 [Python Supabase Client](https://github.com/supabase/supabase-py)

### 関連技術
- 📡 [LINE Bot SDK for Python](https://github.com/line/line-bot-sdk-python)
- 🖼️ [PIL/Pillow 画像処理ライブラリ](https://pillow.readthedocs.io/)

## 🎪 実際の活用例

**このシステムが活かせるプロジェクト：**
- 🏠 **IoTセキュリティ通知** - 侵入検知時の即座な画像通知
- 🌱 **植物育成モニタリング** - 成長記録の自動共有
- 🔬 **研究データ共有** - 実験結果の即時配信
- 📷 **ペット見守りカメラ** - 可愛い瞬間の自動通知
- 🏭 **製造業品質管理** - 異常検知時の画像レポート

## 🏷️ タグ
`#LINE Bot` `#Supabase` `#Python` `#画像処理` `#クラウドストレージ` `#IoT` `#通知システム` `#画像アップロード` `#API連携`

---

この記事が、Sony Spresense画像をLINE Botで効率的に送信するシステム開発の参考になれば幸いです！質問やコメントがあれば、お気軽にお寄せください。

**🔄 更新履歴**
- 2024/10/12: 初回公開
- 2024/10/12: 関数ベース設計とSupabase連携方法を詳細化
- 2024/10/12: 他ファイルからの呼び出し例とトラブルシューティングを追加