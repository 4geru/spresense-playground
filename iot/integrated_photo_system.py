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
import glob
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
SERIAL_PORTS = [
    '/dev/cu.SLAB_USBtoUART',
    '/dev/cu.usbserial-10',
    '/dev/tty.SLAB_USBtoUART',
    '/dev/tty.usbserial-10'
]
BAUD_RATE = 115200
TIMEOUT = 10  # 10秒タイムアウト
START_MARKER = b'START_JPEG'
END_MARKER = b'END_JPEG'
OUTPUT_DIR = "captured_images"

# Gemini API設定
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ANALYSIS_MODEL = 'gemini-2.5-flash'

# =============================================================================
# ユーティリティ機能
# =============================================================================

def cleanup_old_files(directory: str, max_files: int = 10) -> None:
    """
    指定ディレクトリ内のファイルを作成日時順でソートし、
    最新のmax_files件以外を削除する
    
    Args:
        directory: 対象ディレクトリ
        max_files: 保持する最大ファイル数
    """
    try:
        if not os.path.exists(directory):
            return
        
        # 対象ファイルの取得（画像ファイルのみ）
        file_patterns = [
            os.path.join(directory, "*.jpg"),
            os.path.join(directory, "*.jpeg"), 
            os.path.join(directory, "*.png")
        ]
        
        all_files = []
        for pattern in file_patterns:
            all_files.extend(glob.glob(pattern))
        
        if len(all_files) <= max_files:
            return  # ファイル数が上限以下なら何もしない
        
        # ファイルを作成日時順でソート（新しい順）
        files_with_time = []
        for file_path in all_files:
            try:
                stat = os.stat(file_path)
                files_with_time.append((file_path, stat.st_mtime))
            except OSError:
                continue
        
        files_with_time.sort(key=lambda x: x[1], reverse=True)
        
        # 古いファイルを削除
        files_to_delete = files_with_time[max_files:]
        deleted_count = 0
        
        for file_path, _ in files_to_delete:
            try:
                os.remove(file_path)
                deleted_count += 1
                print(f"🗑️ 古いファイルを削除: {os.path.basename(file_path)}")
            except OSError as e:
                print(f"⚠️ ファイル削除失敗: {file_path} - {e}")
        
        if deleted_count > 0:
            print(f"✅ {deleted_count}個の古いファイルを削除しました")
            print(f"📁 {directory} に {len(all_files) - deleted_count}個のファイルが残っています")
        
    except Exception as e:
        print(f"⚠️ ファイルクリーンアップエラー: {e}")

# =============================================================================
# シリアル通信ユーティリティ
# =============================================================================

def find_available_serial_port() -> Optional[str]:
    """
    利用可能なSpresenseシリアルポートを自動検出
    
    Returns:
        利用可能なポート名、見つからない場合はNone
    """
    print("🔍 Spresenseポートを検索中...")
    
    # まず実際に存在するポートを確認
    import glob
    existing_ports = []
    for pattern in ['/dev/cu.*', '/dev/tty.*']:
        existing_ports.extend(glob.glob(pattern))
    
    # Spresense関連のポートを優先的にテスト
    spresense_keywords = ['SLAB_USBtoUART', 'usbserial', 'USB']
    priority_ports = []
    
    for port in existing_ports:
        for keyword in spresense_keywords:
            if keyword in port:
                priority_ports.append(port)
                break
    
    # 設定済みポートと検出されたポートをマージ
    test_ports = priority_ports + [p for p in SERIAL_PORTS if p in existing_ports]
    
    if not test_ports:
        print("❌ Spresense関連のポートが見つかりません")
        print("💡 USBケーブルとSpresenseの接続を確認してください")
        return None
    
    for port in test_ports:
        try:
            # より安全なポート検証
            if not os.path.exists(port):
                continue
                
            test_ser = serial.Serial(
                port=port,
                baudrate=BAUD_RATE,
                timeout=0.5,
                write_timeout=0.5
            )
            
            # 接続テスト
            time.sleep(0.1)
            test_ser.close()
            print(f"✅ ポート検出: {port}")
            return port
            
        except (serial.SerialException, OSError, ValueError):
            continue
        except Exception:
            continue
    
    print("❌ 利用可能なSpresenseポートが見つかりませんでした")
    print("💡 USBケーブル・電源・ドライバーを確認してください")
    return None

def open_serial_connection(port: str) -> Optional[serial.Serial]:
    """
    指定ポートでシリアル接続を開く
    
    Args:
        port: シリアルポート名
        
    Returns:
        シリアル接続オブジェクト、失敗時はNone
    """
    try:
        print(f"📡 シリアル接続中...")
        
        # より慎重な接続手順
        ser = serial.Serial()
        ser.port = port
        ser.baudrate = BAUD_RATE
        ser.timeout = TIMEOUT
        ser.write_timeout = TIMEOUT
        ser.bytesize = serial.EIGHTBITS
        ser.parity = serial.PARITY_NONE
        ser.stopbits = serial.STOPBITS_ONE
        ser.rtscts = False  # ハードウェアフロー制御を無効
        ser.dsrdtr = False  # DTR/DSR制御を無効
        
        # 接続を開く
        ser.open()
        
        # DTRをリセット（一部のデバイスで必要）
        ser.setDTR(False)
        time.sleep(0.1)
        ser.setDTR(True)
        time.sleep(0.1)
        
        # 接続安定化のため待機
        time.sleep(1)
        
        # バッファをクリア
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        
        # 接続テスト
        if ser.is_open:
            print(f"✅ 接続成功")
            return ser
        else:
            ser.close()
            
    except (serial.SerialException, OSError, ValueError):
        pass
    except Exception:
        pass
    
    print(f"❌ シリアル接続に失敗しました")
    return None

# =============================================================================
# コア機能: Spresense通信
# =============================================================================

def send_take_photo_command(ser: serial.Serial) -> bool:
    """Spresenseに撮影コマンドを送信"""
    try:
        print("📤 撮影コマンド送信...")
        ser.write(b'TAKE_PHOTO\\n')
        ser.flush()  # 送信バッファを強制フラッシュ
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
        print("📥 📷 Spresenseからの撮影応答を待機中...")
        print("   ⏳ START_JPEGマーカーを監視...")
        
        # Spresenseのコードに合わせてマーカー形式を修正
        start_time = time.time()
        line = ser.read_until(START_MARKER)
        
        if line.endswith(START_MARKER):
            elapsed = time.time() - start_time
            print("🎉 ✅ 撮影成功！画像データ送信開始を確認！")
            print(f"   ⏱️ 撮影時間: {elapsed:.2f}秒")
            print("📥 🖼️ バイナリJPEGデータ受信中...")
            
            jpeg_data = b''
            receive_start = time.time()
            last_progress_time = receive_start
            total_chunks = 0
            
            while True:
                chunk = ser.read(1024)
                if chunk:
                    total_chunks += 1
                    # 進捗表示（1秒ごと）
                    current_time = time.time()
                    if current_time - last_progress_time >= 1.0:
                        print(f"   📊 受信中... {len(jpeg_data):,} bytes ({total_chunks} chunks)")
                        last_progress_time = current_time
                    
                    # Spresenseのコードに合わせてマーカー処理を修正
                    if END_MARKER in chunk:
                        end_pos = chunk.find(END_MARKER)
                        jpeg_data += chunk[:end_pos]
                        print("🏁 ✅ END_JPEGマーカー検出！受信完了")
                        break
                    else:
                        jpeg_data += chunk
                
                if time.time() - receive_start > 30:
                    print("❌ ⏰ 受信タイムアウト（30秒）")
                    break

            if jpeg_data:
                receive_time = time.time() - receive_start
                print(f"📊 受信統計:")
                print(f"   📦 データサイズ: {len(jpeg_data):,} bytes")
                print(f"   📈 チャンク数: {total_chunks}")
                print(f"   ⏱️ 受信時間: {receive_time:.2f}秒")
                print(f"   🚀 転送速度: {len(jpeg_data)/receive_time/1024:.1f} KB/s")
                
                # ファイル保存
                os.makedirs(OUTPUT_DIR, exist_ok=True)
                
                # 古いファイルのクリーンアップ（最新10件を保持）
                cleanup_old_files(OUTPUT_DIR, max_files=10)
                timestamp = int(time.time())
                file_name = os.path.join(OUTPUT_DIR, f"capture_{timestamp}.jpg")
                
                with open(file_name, "wb") as f:
                    f.write(jpeg_data)
                
                print("🎊 🎉 撮影・保存完了！")
                print(f"📁 💾 保存先: {file_name}")
                print("=" * 50)
                return jpeg_data, file_name
            else:
                print("❌ 📷 画像データを受信できませんでした（空データ）")
                return None, None
        else:
            print("❌ 📷 START_JPEGマーカーを受信できませんでした")
            print("   💡 Spresenseが応答していない可能性があります")
            return None, None
            
    except Exception as e:
        print(f"❌ 📷 画像受信エラー: {e}")
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
        print("✅ 🤖🤖🤖 条件マッチ: 人がいてポーズをしている → アメコミ風変換を実行 🤖🤖🤖")
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
        
        # 自動ポート検出
        available_port = find_available_serial_port()
        if not available_port:
            print("❌ 利用可能なSpresenseポートが見つかりません")
            return False, False
        
        # シリアル接続を開く
        ser = open_serial_connection(available_port)
        if not ser:
            print("❌ シリアル接続に失敗しました")
            return False, False
        
        # 撮影コマンド送信
        print("📸 📷 カメラ撮影フェーズ開始")
        print("=" * 40)
        
        if not send_take_photo_command(ser):
            print("❌ 撮影コマンド送信に失敗")
            return False, False
        
        # Spresenseからの応答を簡潔に監視
        time.sleep(0.5)  # 短い待機のみ
        
        # 画像受信
        print("📸 🖼️ 画像データ受信フェーズ")
        print("-" * 40)
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
            current_time = datetime.now().strftime("%H:%M:%S")
            
            print(f"\\n🔄 📷 撮影サイクル {cycle_count} 開始 [{current_time}]")
            print("=" * 60)
            print(f"📊 現在の統計: 撮影実行 {cycle_count-1}回, LINE送信成功 {send_count}回")
            print("=" * 60)
            
            # 1回の撮影・処理を実行
            cycle_start_time = time.time()
            process_success, send_executed = capture_and_process_photo()
            cycle_duration = time.time() - cycle_start_time
            
            print("\\n" + "=" * 60)
            print(f"🏁 サイクル {cycle_count} 完了 [処理時間: {cycle_duration:.1f}秒]")
            
            if process_success:
                if send_executed:
                    send_count += 1
                    print(f"✅ 📤 LINE送信成功: サイクル {cycle_count}")
                    print("🎉 ヒーローポーズが検出されました！")
                else:
                    print(f"⏭️ 📤 送信スキップ: サイクル {cycle_count}")
                    print("😊 通常の撮影でした（ポーズ検出なし）")
                
                success_rate = (send_count / cycle_count) * 100
                print(f"📊 最新統計: 撮影 {cycle_count}回, 送信 {send_count}回 (成功率: {success_rate:.1f}%)")
            else:
                print("⚠️ ❌ 撮影・処理に失敗しました。次の撮影に進みます")
            
            print("=" * 60)
            
            # 次の撮影まで待機
            print("⏰ ⏳ 5秒後に次の撮影を開始...")
            for i in range(5, 0, -1):
                print(f"   ⏰ {i}秒...", end="", flush=True)
                time.sleep(1)
                if i > 1:
                    print("", end="\\r", flush=True)
            print("\\n")
            
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
    
    # デフォルトはループモードで開始
    print("\\n🔄 連続撮影ループモードで開始します")
    print("   💡 1回だけ実行したい場合は --once オプションを使用してください")
    print("   💡 例: python integrated_photo_system.py --once")
    print("\\n実行モード:")
    print("   📸 連続撮影ループ（人・ポーズ検出時のみ送信）")
    print("   🗑️ 自動ファイルクリーンアップ（最新10件を保持）")
    print("   🛑 終了するには Ctrl+C を押してください")
    
    # コマンドライン引数の確認
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        # 1回だけ実行モード
        print("\\n🎯 1回実行モードで開始")
        print("=" * 40)
        
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
    else:
        # デフォルト: 連続撮影ループ
        print("\\n⏳ 3秒後に連続撮影を開始します...")
        time.sleep(3)
        
        try:
            continuous_photo_loop()
            sys.exit(0)
        except KeyboardInterrupt:
            print("\\n👋 ユーザーにより処理が中断されました")
            sys.exit(0)

if __name__ == "__main__":
    main()