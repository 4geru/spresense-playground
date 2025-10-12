#!/usr/bin/env python3
"""
Spresense AI画像処理統合システム

要件フロー:
[1] Spresenseカメラで撮影
[2] シリアル通信でMac送信  
[3] Gemini画像分析（人・ポーズ判定）→ JSON応答
[4] 条件マッチ時のみアメコミ風変換
[5] オリジナル+変換画像をSupabaseアップロード
[6] LINE Bot送信（original: アメコミ風, preview: オリジナル）

使用例:
python integrated_photo_system.py
"""

import os
import sys
import time
import json
import serial
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from dotenv import load_dotenv

# 既存モジュールからのインポート
from simple_image_editor import convert_to_comic_style
from line_bot_push import send_image_with_line_push
import google.generativeai as genai

# 環境変数をロード
load_dotenv()

# =============================================================================
# 設定・定数
# =============================================================================

# シリアル通信設定
SERIAL_PORT = '/dev/cu.SLAB_USBtoUART'
BAUD_RATE = 115200
START_MARKER = b'START_JPEG'
END_MARKER = b'END_JPEG'
OUTPUT_DIR = "captured_images"

# Gemini API設定
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ANALYSIS_MODEL = 'gemini-2.5-flash'

# =============================================================================
# コア機能: Spresense通信
# =============================================================================

def send_take_photo_command(ser: serial.Serial) -> bool:
    """Spresenseに撮影コマンドを送信"""
    try:
        print("📤 TAKE_PHOTOコマンドを送信...")
        ser.write(b'TAKE_PHOTO\\n')
        return True
    except Exception as e:
        print(f"❌ コマンド送信エラー: {e}")
        return False

def receive_image_from_spresense(ser: serial.Serial) -> Tuple[Optional[bytes], Optional[str]]:
    """
    Spresenseから画像データを受信してファイル保存
    
    Returns:
        (image_bytes, file_path) のタプル、失敗時は (None, None)
    """
    try:
        print("📥 開始マーカー待機中...")
        # Spresenseのコードに合わせてマーカー形式を修正
        line = ser.read_until(START_MARKER)
        
        if line.endswith(START_MARKER):
            print("✅ 画像データ送信開始を確認！")
            print("📥 バイナリJPEGデータ受信中...")
            
            jpeg_data = b''
            start_time = time.time()
            
            while True:
                chunk = ser.read(1024)
                if chunk:
                    # Spresenseのコードに合わせてマーカー処理を修正
                    if END_MARKER in chunk:
                        end_pos = chunk.find(END_MARKER)
                        jpeg_data += chunk[:end_pos]
                        break
                    else:
                        jpeg_data += chunk
                
                if time.time() - start_time > 30:
                    print("❌ 受信タイムアウト")
                    break

            if jpeg_data:
                # ファイル保存
                os.makedirs(OUTPUT_DIR, exist_ok=True)
                timestamp = int(time.time())
                file_name = os.path.join(OUTPUT_DIR, f"capture_{timestamp}.jpg")
                
                with open(file_name, "wb") as f:
                    f.write(jpeg_data)
                
                print(f"✅ 撮影完了！サイズ: {len(jpeg_data):,} bytes")
                print(f"📁 保存先: {file_name}")
                return jpeg_data, file_name
            else:
                print("❌ 画像データを受信できませんでした")
                return None, None
        else:
            print("❌ 開始マーカーを受信できませんでした")
            return None, None
            
    except Exception as e:
        print(f"❌ 画像受信エラー: {e}")
        return None, None

# =============================================================================
# コア機能: Gemini AI分析
# =============================================================================

def analyze_person_and_pose(image_data: bytes) -> Optional[Dict[str, str]]:
    """
    Gemini APIで人・ポーズ判定を実行
    
    Args:
        image_data: JPEGバイナリデータ
        
    Returns:
        {"face_detected": "Yes/No", "is_pose": "Yes/No"} または None
    """
    if not GEMINI_API_KEY:
        print("❌ エラー: 環境変数 GEMINI_API_KEY が設定されていません")
        return None

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(ANALYSIS_MODEL)

        # 人・ポーズ判定プロンプト（要件に基づく）
        prompt = (
            "この画像について分析してください。\\n"
            "1. 人の顔は映っていますか？ (Yes/No)\\n"
            "2. 映っている場合、その人はカメラに向かって何かポーズ（ピースサイン、グッドサイン、ガッツポーズ）をしていますか？ (Yes/No)\\n"
            "結果を以下のJSON形式でのみ出力してください: "
            "{'face_detected': 'Yes/No', 'is_pose': 'Yes/No'}"
        )

        print("🔍 Gemini AIで人・ポーズ判定中...")
        start_time = time.time()
        
        response = model.generate_content([
            prompt, 
            {"mime_type": "image/jpeg", "data": image_data}
        ])
        
        end_time = time.time()
        print(f"⏱️ AI分析完了 (処理時間: {end_time - start_time:.2f}秒)")

        # JSON解析（Markdownコードブロック対応）
        try:
            print(f"🤖 AI応答: {response.text}")
            
            # Markdownコードブロックを除去
            response_text = response.text.strip()
            if response_text.startswith('```'):
                # ```json と ``` を除去
                lines = response_text.split('\n')
                json_lines = []
                in_code_block = False
                
                for line in lines:
                    if line.startswith('```'):
                        in_code_block = not in_code_block
                        continue
                    if in_code_block:
                        json_lines.append(line)
                
                response_text = '\n'.join(json_lines).strip()
            
            # シングルクォートをダブルクォートに変換（JSONの場合）
            if response_text.startswith("{'") and response_text.endswith("'}"):
                response_text = response_text.replace("'", '"')
            
            print(f"🔧 解析用テキスト: {response_text}")
            analysis_result = json.loads(response_text)
            
            face_detected = analysis_result.get('face_detected', 'No')
            is_pose = analysis_result.get('is_pose', 'No')
            
            print(f"👁️  人の顔: {face_detected}")
            print(f"🤲 ポーズ: {is_pose}")
            
            return analysis_result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON解析エラー: {e}")
            print(f"応答内容: {response.text}")
            
            # フォールバック: テキストから直接パース
            try:
                print("🔄 フォールバック解析を試行...")
                text = response.text.lower()
                
                # テキストから判定結果を抽出
                face_detected = 'Yes' if 'face_detected' in text and 'yes' in text else 'No'
                is_pose = 'Yes' if 'is_pose' in text and 'yes' in text else 'No'
                
                fallback_result = {
                    'face_detected': face_detected,
                    'is_pose': is_pose
                }
                
                print(f"🔧 フォールバック結果: {fallback_result}")
                return fallback_result
                
            except Exception as fallback_error:
                print(f"❌ フォールバック解析も失敗: {fallback_error}")
                return None

    except Exception as e:
        print(f"❌ Gemini API通信エラー: {e}")
        return None

# =============================================================================
# 統合ワークフロー
# =============================================================================

def should_convert_to_comic(analysis_result: Optional[Dict[str, str]]) -> bool:
    """
    AI分析結果から、アメコミ風変換を実行するかどうか判定
    
    条件: face_detected=Yes AND is_pose=Yes
    """
    if not analysis_result:
        return False
        
    face_detected = analysis_result.get('face_detected', '').lower()
    is_pose = analysis_result.get('is_pose', '').lower()
    
    should_convert = (face_detected == 'yes' and is_pose == 'yes')
    
    if should_convert:
        print("✅ 条件マッチ: 人がいてポーズをしている → アメコミ風変換を実行")
    else:
        print("❌ 条件不一致: アメコミ風変換をスキップ")
        print(f"   - 人の顔: {face_detected}")
        print(f"   - ポーズ: {is_pose}")
    
    return should_convert

def capture_and_process_photo() -> tuple[bool, bool]:
    """
    統合ワークフロー: 撮影から送信まで（1回分）
    
    Returns:
        (処理成功, LINE送信実行) のタプル
    """
    ser = None
    try:
        # [1-2] Spresense撮影・受信
        print("=" * 60)
        print("🚀 Spresense AI画像処理システム開始")
        print("=" * 60)
        
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=10)
        print(f"✅ シリアル接続: {SERIAL_PORT}")
        
        time.sleep(1)
        ser.reset_input_buffer()
        
        # 撮影コマンド送信
        if not send_take_photo_command(ser):
            return False
        
        # Spresenseからの応答をデバッグ表示
        print("🔍 Spresenseからの応答を5秒間監視...")
        start_time = time.time()
        while time.time() - start_time < 5:
            if ser.in_waiting > 0:
                response = ser.read(ser.in_waiting)
                print(f"📡 受信データ: {response}")
                break
            time.sleep(0.1)
        
        # 画像受信
        image_data, original_path = receive_image_from_spresense(ser)
        if not image_data or not original_path:
            print("❌ 画像受信に失敗しました")
            return False, False
        
        # [3] Gemini AI分析（人・ポーズ判定）
        print("\\n" + "=" * 60)
        print("🧠 AI画像分析フェーズ")
        print("=" * 60)
        
        analysis_result = analyze_person_and_pose(image_data)
        if not analysis_result:
            print("❌ AI分析に失敗しました")
            print("⏭️ 処理をスキップして次の撮影に進みます")
            return True, False  # 処理成功、送信なし
        
        # [4] 条件分岐判定
        print("\\n" + "=" * 60)
        print("🎯 条件判定フェーズ")  
        print("=" * 60)
        
        convert_needed = should_convert_to_comic(analysis_result)
        
        if not convert_needed:
            print("⏭️ 人・ポーズが検出されませんでした。送信をスキップして次の撮影に進みます")
            return True, False  # 処理成功、送信なし
        
        # [5] アメコミ風変換（条件マッチ時のみ）
        print("\\n" + "=" * 60)
        print("🎨 アメコミ風変換フェーズ")
        print("=" * 60)
        
        comic_path = convert_to_comic_style(original_path)
        if not comic_path:
            print("❌ アメコミ風変換に失敗しました")
            print("⏭️ 変換失敗のため送信をスキップして次の撮影に進みます")
            return True, False  # 処理成功、送信なし
        
        print(f"✅ アメコミ風変換完了: {comic_path}")
        
        # [6-7] Supabaseアップロード・LINE送信
        print("\\n" + "=" * 60)
        print("📤 LINE Bot送信フェーズ")
        print("=" * 60)
        
        # アメコミ風変換済み: アメコミ風をメイン、オリジナルをプレビューに
        print("🦸 アメコミ風画像をメインとして送信")
        success = send_image_with_line_push(
            original_path=comic_path,    # メイン: アメコミ風
            preview_path=original_path   # プレビュー: オリジナル
        )
        
        if success:
            print("\\n" + "=" * 60)
            print("🎉 処理完了: アメコミ風画像がLINEで送信されました！")
            print("=" * 60)
            return True, True  # 処理成功、送信成功
        else:
            print("❌ LINE送信に失敗しました")
            return True, False  # 処理成功、送信失敗
        
    except serial.SerialException as e:
        print(f"❌ シリアル通信エラー: {e}")
        print("Spresenseの接続を確認してください")
        return False, False
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        return False, False
    finally:
        if ser and ser.is_open:
            ser.close()

def continuous_photo_loop():
    """
    連続撮影・処理ループ
    
    人・ポーズが検出された場合のみアメコミ風変換とLINE送信を実行
    それ以外の場合はスキップして次の撮影に進む
    """
    print("🔄 連続撮影モード開始")
    print("⚡ 人・ポーズが検出された場合のみ変換・送信します")
    print("🛑 終了するには Ctrl+C を押してください")
    print("=" * 60)
    
    cycle_count = 0
    send_count = 0
    
    try:
        while True:
            cycle_count += 1
            print(f"\\n🔄 撮影サイクル {cycle_count} 開始")
            print("=" * 40)
            
            # 1回の撮影・処理を実行
            process_success, send_executed = capture_and_process_photo()
            
            if process_success:
                if send_executed:
                    send_count += 1
                    print(f"📤 LINE送信実行: サイクル {cycle_count}")
                else:
                    print(f"⏭️ 送信スキップ: サイクル {cycle_count}")
                
                print(f"📊 統計: 撮影回数 {cycle_count}, 送信回数 {send_count}")
            else:
                print("⚠️ 撮影・処理に失敗しました。次の撮影に進みます")
            
            # 次の撮影まで待機
            print("⏰ 5秒後に次の撮影を開始...")
            time.sleep(5)
            
    except KeyboardInterrupt:
        print(f"\\n👋 連続撮影を終了します")
        print(f"📈 最終統計: 撮影回数 {cycle_count}, 送信回数 {send_count}")
        return

# =============================================================================
# コマンドラインインターフェース
# =============================================================================

def main():
    """メイン実行関数"""
    print("🚀 Spresense AI画像処理統合システム")
    print("=" * 60)
    print("📋 処理フロー:")
    print("   [1] Spresenseカメラで撮影")
    print("   [2] シリアル通信でMac送信")
    print("   [3] Gemini AI分析（人・ポーズ判定）")
    print("   [4] 条件マッチ時: アメコミ風変換")
    print("   [5] Supabaseアップロード")
    print("   [6] LINE Bot送信")
    print("=" * 60)
    
    # 環境変数確認
    required_vars = [
        'GEMINI_API_KEY',
        'LINE_CHANNEL_ACCESS_TOKEN',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_BUCKET_NAME'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ 環境変数設定エラー:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\\n.envファイルを確認してください")
        sys.exit(1)
    
    print("✅ 環境変数確認完了")
    
    # 実行モードの選択
    print("\\n実行モードを選択してください:")
    print("1: 1回だけ撮影・処理")
    print("2: 連続撮影ループ（人・ポーズ検出時のみ送信）")
    
    try:
        mode = input("\\n選択 (1 or 2): ").strip()
        
        if mode == "1":
            # 1回だけ実行
            process_success, send_executed = capture_and_process_photo()
            
            if process_success:
                if send_executed:
                    print("\\n🎊 処理が完了しました！アメコミ風画像を送信しました")
                else:
                    print("\\n✅ 処理が完了しました！条件不一致のため送信はスキップされました")
                sys.exit(0)
            else:
                print("\\n💥 処理中にエラーが発生しました")
                sys.exit(1)
                
        elif mode == "2":
            # 連続撮影ループ
            continuous_photo_loop()
            sys.exit(0)
            
        else:
            print("❌ 無効な選択です。1 または 2 を入力してください")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\\n👋 ユーザーにより処理が中断されました")
        sys.exit(0)

if __name__ == "__main__":
    main()