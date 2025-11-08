import os
import time
import json
import serial
from dotenv import load_dotenv
import google.generativeai as genai

# 1. 環境変数のロード
load_dotenv()

# --- 設定 ---
# ⚠️ .envからAPIキーを読み込み
API_KEY = os.getenv("GEMINI_API_KEY") 
MODEL_NAME = 'gemini-2.5-flash'

# シリアル通信設定
SERIAL_PORT = '/dev/cu.SLAB_USBtoUART' 
BAUD_RATE = 115200
START_MARKER = b'START_JPEG'
END_MARKER = b'END_JPEG' 
OUTPUT_DIR = "captured_images"

# -------------------------------------------------------------------
# シリアル通信でSpresenseから画像を受信する関数
# -------------------------------------------------------------------
def receive_image_from_spresense(ser) -> tuple[bytes | None, str | None]:
    """
    シリアル通信でSpresenseからJPEGデータを受信し、バイトデータとファイル名を返す。
    """
    # 1. 開始マーカーを待機
    # read_until()でSTART_MARKERが検出されるまでデータを読み捨てる
    line = ser.read_until(START_MARKER)
    
    if line.endswith(START_MARKER):
        print("\n📥 画像データ受信開始...")
        
        jpeg_data = b''
        start_time = time.time()
        
        # 2. JPEGデータ本体と終了マーカーを受信する
        while True:
            # データを読み取り（タイムアウトあり）
            chunk = ser.read(1024)  # 1KBずつ読み取り
            
            if chunk:
                # 終了マーカーが含まれているかチェック
                if END_MARKER in chunk:
                    # マーカーまでのデータ本体を取得
                    jpeg_data += chunk.split(END_MARKER)[0]
                    break
                else:
                    jpeg_data += chunk
            
            # タイムアウト対策（5MP RAWファイル用に延長）
            if time.time() - start_time > 120:  # 120秒（5MP RAW用）
                print("❌ 受信タイムアウト。データが途切れた可能性があります。")
                break

        if jpeg_data:
            # 3. 受信完了とファイル保存
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            file_name = os.path.join(OUTPUT_DIR, f"capture_{int(time.time())}.jpg")
            with open(file_name, "wb") as f:
                f.write(jpeg_data)
            
            print(f"💾 受信完了。サイズ: {len(jpeg_data)} bytes. 保存先: {file_name}")
            return jpeg_data, file_name
        else:
            print("⚠️ データを受信できませんでした。")
    
    return None, None

# -------------------------------------------------------------------
# ローカルファイルからJPEGバイトデータを読み込む関数（既存ファイル用）
# -------------------------------------------------------------------
def load_image_file_bytes(file_path: str) -> bytes | None:
    """
    指定されたパスの画像ファイル（JPEG推奨）をバイナリデータとして読み込む。
    """
    if not os.path.exists(file_path):
        print(f"❌ エラー: 指定された画像ファイル '{file_path}' が見つかりません。")
        return None
    
    print(f"✅ 画像ファイル '{file_path}' を読み込みました。")
    with open(file_path, "rb") as f:
        return f.read()
# -------------------------------------------------------------------

def analyze_image_with_gemini(jpeg_data: bytes):
    """
    JPEGバイトデータをGemini APIに送信し、顔とポーズの判定を行います。（以前と同じ関数）
    """
    # [この関数の内部ロジックは前回実装したものと同じです]
    if not API_KEY:
        print("❌ エラー: 環境変数 GEMINI_API_KEY が設定されていません。")
        return None

    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel(MODEL_NAME)

        # 2. ポーズ判定を含むプロンプトを作成
        prompt = (
            "この画像について分析してください。\n"
            "1. 人の顔は映っていますか？ (Yes/No)\n"
            "2. 映っている場合、その人はカメラに向かって何かポーズ（ピースサイン、グッドサイン、ガッツポーズ）をしていますか？ (Yes/No)\n"
            "結果を以下のJSON形式でのみ出力してください: "
            "{'face_detected': 'Yes/No', 'is_pose': 'Yes/No'}"
        )

        print("🔍 Gemini APIに画像とプロンプトを送信中...")
        start_time = time.time()
        
        # 3. Gemini APIにリクエストを送信
        response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": jpeg_data}])
        
        end_time = time.time()
        print(f"⏱️ 応答受信完了 (処理時間: {end_time - start_time:.2f}秒)")

        # 4. 応答を解析して結果を返す
        try:
            print(response.text)  # 応答内容をデバッグ表示
            analysis_result = json.loads(response.text)
            print(analysis_result)
            return analysis_result
        except json.JSONDecodeError:
            print("❌ エラー: APIの応答が有効なJSON形式ではありませんでした。")
            return None

    except Exception as e:
        print(f"❌ Gemini API通信中に予期せぬエラーが発生しました: {e}")
        return None

# -------------------------------------------------------------------
# 統合メイン処理：Spresense画像受信 + Gemini AI分析
# -------------------------------------------------------------------
def main_live_analysis():
    """
    Spresenseからリアルタイムで画像を受信し、Gemini AIで分析する
    """
    try:
        # シリアルポート接続
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1.0)
        print(f"✅ シリアルポート {SERIAL_PORT} に接続しました")
        print("📷 Spresenseからの画像を待機し、リアルタイムで分析します...")
        print("🤖 Gemini AIによる画像内容認識を開始します")
        print("=" * 50)
        
        capture_count = 0
        last_log_time = time.time()
        
        while True:
            # 10秒ごとに待機状態をログ出力
            current_time = time.time()
            if current_time - last_log_time >= 10:
                print(f"⏰ [{time.strftime('%H:%M:%S')}] データ待機中... (受信済み: {capture_count}枚)")
                last_log_time = current_time
            
            # Spresenseから画像を受信
            image_data, file_path = receive_image_from_spresense(ser)
            
            if image_data and file_path:
                capture_count += 1
                print(f"\n🎯 [画像 {capture_count}] Gemini AI分析開始...")
                
                # Gemini AIで画像分析
                result = analyze_image_with_gemini(image_data)
                
                if result:
                    print("\n" + "=" * 50)
                    print(f"  🤖 AI画像分析結果 [画像 {capture_count}]")
                    print("=" * 50)
                    print(f"📷 ファイル: {os.path.basename(file_path)}")
                    print(f"👁️  主な被写体: {result.get('main_subject', '不明')}")
                    print(f"🏞️  背景: {result.get('background', '不明')}")
                    print(f"💡 光の状況: {result.get('lighting', '不明')}")
                    print(f"✨ 全体印象: {result.get('overall_impression', '不明')}")
                    print("=" * 50)
                else:
                    print("❌ 画像分析に失敗しました")
            
            time.sleep(0.1)  # CPU負荷軽減のための短い待機
            
    except serial.SerialException as e:
        print(f"❌ シリアルポート接続エラー: {e}")
        print("Spresenseが正しく接続されているか確認してください")
    except KeyboardInterrupt:
        print("\n👋 分析を終了します")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()

def main_file_analysis(image_path: str):
    """
    既存の画像ファイルをGemini AIで分析する
    """
    image_bytes = load_image_file_bytes(image_path)
    
    if image_bytes:
        print(f"🎯 ファイル分析開始: {os.path.basename(image_path)}")
        result = analyze_image_with_gemini(image_bytes)
        
        if result:
            print("\n" + "=" * 50)
            print("  🤖 AI画像分析結果")
            print("=" * 50)
            print(f"📷 ファイル: {os.path.basename(image_path)}")
            print(f"👁️  主な被写体: {result.get('main_subject', '不明')}")
            print(f"🏞️  背景: {result.get('background', '不明')}")
            print(f"💡 光の状況: {result.get('lighting', '不明')}")
            print(f"✨ 全体印象: {result.get('overall_impression', '不明')}")
            print("=" * 50)

# --- メイン処理 ---
if __name__ == "__main__":
    print("🤖 Spresense + Gemini AI リアルタイム画像分析システム")
    main_live_analysis()
# -------------------------------------------------------------------
