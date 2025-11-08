#!/usr/bin/env python3
"""
LINE Bot Webhook Server

QRコード経由でスマホから送信された view:{hashId} メッセージを処理し、
画像とLIFFリンクを含むFlex Messageを返信します。

環境変数:
- LINE_CHANNEL_ACCESS_TOKEN: LINE Bot のアクセストークン
- LINE_CHANNEL_SECRET: LINE Bot のチャネルシークレット
- SUPABASE_URL: Supabase プロジェクトのURL
- SUPABASE_ANON_KEY: Supabase の匿名キー
- SUPABASE_BUCKET_NAME: 画像保存用のバケット名
- LIFF_ID: LIFF アプリのID

使用例:
python line_bot_webhook.py
"""

import os
import sys
import hashlib
import hmac
import json
from typing import Optional, List, Dict, Any
from flask import Flask, request, abort
from dotenv import load_dotenv
from supabase import create_client, Client

# 環境変数をロード
load_dotenv()

# Flask アプリの初期化
app = Flask(__name__)

# 環境変数の取得
LINE_CHANNEL_ACCESS_TOKEN = os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
LINE_CHANNEL_SECRET = os.getenv('LINE_CHANNEL_SECRET')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_BUCKET_NAME = os.getenv('SUPABASE_BUCKET_NAME')
LIFF_ID = os.getenv('LIFF_ID')

# Supabaseクライアントの初期化
def get_supabase_client() -> Client:
    """Supabaseクライアントを取得"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("Supabase configuration missing")

    supabase_url = SUPABASE_URL
    if not supabase_url.startswith('http'):
        supabase_url = f"https://{supabase_url}.supabase.co"

    return create_client(supabase_url, SUPABASE_ANON_KEY)


def generate_hash_id(filename: str) -> str:
    """ファイル名からhashIdを生成（フロントエンドと同じロジック）"""
    return hashlib.md5(filename.encode()).hexdigest()[:8]


def get_image_by_hash_id(hash_id: str) -> Optional[Dict[str, Any]]:
    """
    hashIdから画像情報を取得

    Args:
        hash_id: 画像のハッシュID

    Returns:
        画像情報の辞書、見つからない場合はNone
    """
    try:
        supabase = get_supabase_client()

        # バケット内の全ファイルを取得
        files = supabase.storage.from_(SUPABASE_BUCKET_NAME).list()

        # _original_ を含むファイルのみをフィルタリング
        original_files = [f for f in files if '_original_' in f['name']]

        # hashIdが一致するファイルを検索
        for file in original_files:
            file_hash = generate_hash_id(file['name'])
            if file_hash == hash_id:
                # 公開URLを生成
                public_url = supabase.storage.from_(SUPABASE_BUCKET_NAME).get_public_url(file['name'])

                return {
                    'name': file['name'],
                    'url': public_url,
                    'hash_id': hash_id
                }

        return None

    except Exception as e:
        print(f"❌ Error fetching image by hash_id: {e}")
        return None


def create_image_flex_message(image_url: str, hash_id: str, liff_url: str) -> Dict[str, Any]:
    """
    画像とLIFFリンクを含むFlex Messageを生成

    Args:
        image_url: 画像のURL
        hash_id: 画像のハッシュID
        liff_url: LIFF アプリのURL

    Returns:
        Flex Message の辞書
    """
    return {
        "type": "flex",
        "altText": "📸 画像をスライドショーで見る - Boom!ヒーロー!!",
        "contents": {
            "type": "bubble",
            "hero": {
                "type": "image",
                "url": image_url,
                "size": "full",
                "aspectRatio": "4:3",
                "aspectMode": "cover",
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "📸 画像が見つかりました！",
                        "weight": "bold",
                        "size": "xl",
                        "color": "#06C755",
                    },
                    {
                        "type": "separator",
                        "margin": "md",
                    },
                    {
                        "type": "text",
                        "text": "スライドショーで大きく表示できます",
                        "size": "sm",
                        "color": "#aaaaaa",
                        "margin": "md",
                        "wrap": True,
                    },
                ],
                "backgroundColor": "#16213e",
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "spacing": "sm",
                "contents": [
                    {
                        "type": "button",
                        "style": "primary",
                        "action": {
                            "type": "uri",
                            "label": "🎬 スライドショーで見る",
                            "uri": liff_url,
                        },
                        "color": "#06C755",
                    },
                ],
                "backgroundColor": "#16213e",
            },
            "styles": {
                "body": {
                    "backgroundColor": "#16213e",
                },
                "footer": {
                    "backgroundColor": "#16213e",
                },
            },
        },
    }


def send_reply_message(reply_token: str, messages: List[Dict[str, Any]]) -> bool:
    """
    LINE Messaging APIでリプライメッセージを送信

    Args:
        reply_token: リプライトークン
        messages: 送信するメッセージのリスト

    Returns:
        送信成功時True、失敗時False
    """
    import requests

    try:
        url = 'https://api.line.me/v2/bot/message/reply'
        headers = {
            'Authorization': f'Bearer {LINE_CHANNEL_ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        }

        data = {
            "replyToken": reply_token,
            "messages": messages
        }

        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 200:
            print(f"✅ Reply message sent successfully")
            return True
        else:
            print(f"❌ Failed to send reply: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error sending reply message: {e}")
        return False


def verify_signature(body: bytes, signature: str) -> bool:
    """
    LINE Webhookのリクエスト署名を検証

    Args:
        body: リクエストボディ
        signature: X-Line-Signature ヘッダーの値

    Returns:
        署名が正しい場合True、それ以外False
    """
    if not LINE_CHANNEL_SECRET:
        return False

    hash_digest = hmac.new(
        LINE_CHANNEL_SECRET.encode('utf-8'),
        body,
        hashlib.sha256
    ).digest()

    expected_signature = hash_digest.hex()

    return hmac.compare_digest(expected_signature, signature)


@app.route('/webhook', methods=['POST'])
def webhook():
    """LINE Bot Webhook エンドポイント"""

    # 署名検証
    signature = request.headers.get('X-Line-Signature', '')
    body = request.get_data()

    if not verify_signature(body, signature):
        print("❌ Invalid signature")
        abort(400)

    # リクエストボディを解析
    try:
        events = request.get_json()['events']
    except (KeyError, TypeError):
        print("❌ Invalid request body")
        abort(400)

    # 各イベントを処理
    for event in events:
        if event['type'] != 'message' or event['message']['type'] != 'text':
            continue

        message_text = event['message']['text']
        reply_token = event['replyToken']

        print(f"📥 Received message: {message_text}")

        # view:{hashId} パターンをチェック
        if message_text.startswith('view:'):
            hash_id = message_text.split(':', 1)[1].strip()
            print(f"🔍 Searching for image with hash_id: {hash_id}")

            # 画像を検索
            image_info = get_image_by_hash_id(hash_id)

            if image_info:
                # LIFF URLを生成
                liff_url = f"https://liff.line.me/{LIFF_ID}/slides/{hash_id}"

                print(f"✅ Image found: {image_info['name']}")
                print(f"🔗 LIFF URL: {liff_url}")

                # Flex Messageを生成
                flex_message = create_image_flex_message(
                    image_url=image_info['url'],
                    hash_id=hash_id,
                    liff_url=liff_url
                )

                # 返信
                send_reply_message(reply_token, [flex_message])
            else:
                # 画像が見つからない場合
                print(f"❌ Image not found for hash_id: {hash_id}")
                error_message = {
                    "type": "text",
                    "text": f"申し訳ありません。画像が見つかりませんでした。\n(ID: {hash_id})"
                }
                send_reply_message(reply_token, [error_message])
        else:
            # その他のメッセージには応答しない（または別の処理を実装）
            print(f"ℹ️ Ignoring non-view message: {message_text}")

    return 'OK', 200


@app.route('/health', methods=['GET'])
def health():
    """ヘルスチェックエンドポイント"""
    return {'status': 'ok'}, 200


def main():
    """メイン実行関数"""
    print("🚀 LINE Bot Webhook Server")
    print("=" * 60)

    # 環境変数確認
    required_vars = [
        'LINE_CHANNEL_ACCESS_TOKEN',
        'LINE_CHANNEL_SECRET',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_BUCKET_NAME',
        'LIFF_ID'
    ]

    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print("❌ 環境変数設定エラー:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n.envファイルを確認してください")
        sys.exit(1)

    print("✅ 環境変数確認完了")
    print("\n📋 Webhook URL:")
    print("   http://localhost:5000/webhook")
    print("\n💡 ngrokを使用する場合:")
    print("   ngrok http 5000")
    print("   → LINE Developers ConsoleにWebhook URLを設定してください")
    print("\n🛑 終了するには Ctrl+C を押してください")
    print("=" * 60)

    # Flaskサーバーを起動
    app.run(host='0.0.0.0', port=5000, debug=True)


if __name__ == "__main__":
    main()
