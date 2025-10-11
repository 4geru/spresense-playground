import serial
import time
import os

# ⚠️ MacでのSpresenseのポート名に置き換えてください (例: /dev/cu.SLAB_USBtoUART)
SERIAL_PORT = '/dev/cu.SLAB_USBtoUART' 
BAUD_RATE = 115200

# SpresenseのC++コードと完全に一致させること
# C++で Serial.println(END_MARKER) を使った場合、改行コードが末尾に付く
START_MARKER = b'START_JPEG'
END_MARKER = b'END_JPEG' 
OUTPUT_DIR = "captured_images"

def save_jpeg_from_spresense():
    """
    シリアル通信でSpresenseからJPEGデータを受信し、ファイルとして保存する。
    """
    # 出力ディレクトリが存在しなければ作成
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    try:
        # シリアルポートを開く
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1.0)
        print(f"✅ シリアルポート {SERIAL_PORT} でSpresenseからのデータ待機中...")
        print(f"📁 画像は '{OUTPUT_DIR}' フォルダに保存されます。")
        
        capture_count = 0
        last_log_time = time.time()
        
        while True:
            # 10秒ごとに待機状態をログ出力
            current_time = time.time()
            if current_time - last_log_time >= 10:
                print(f"⏰ [{time.strftime('%H:%M:%S')}] データ待機中... (受信済み: {capture_count}枚)")
                last_log_time = current_time
            
            # 1. 開始マーカーを待機
            # read_until()でSTART_MARKERが検出されるまでデータを読み捨てる
            line = ser.read_until(START_MARKER)
            
            if line.endswith(START_MARKER):
                capture_count += 1
                print(f"\n--- [Capture {capture_count}] 受信開始 ---")
                
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
                    
                    # タイムアウト対策（HD画像用に延長）
                    if time.time() - start_time > 45:  # 45秒（HD用）
                        print("❌ 受信タイムアウト。データが途切れた可能性があります。")
                        break

                if jpeg_data:
                    # 3. 受信完了とファイル保存
                    file_name = os.path.join(OUTPUT_DIR, f"capture_{int(time.time())}.jpg")
                    with open(file_name, "wb") as f:
                        f.write(jpeg_data)
                    
                    print(f"💾 受信完了。サイズ: {len(jpeg_data)} bytes. 保存先: {file_name}")
                else:
                    print("⚠️ データを受信できませんでした。")

            time.sleep(0.1) # CPU負荷軽減のための短い待機

    except serial.SerialException as e:
        print(f"\n❌ シリアルポート接続エラー: {e}")
        print("ポート名が正しいか、Spresenseが接続されているか確認してください。")
    except KeyboardInterrupt:
        print("\n👋 スクリプトを終了します。")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()

if __name__ == "__main__":
    save_jpeg_from_spresense()