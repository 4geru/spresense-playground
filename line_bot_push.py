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