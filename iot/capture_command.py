import serial
import time
import os

SERIAL_PORT = '/dev/cu.SLAB_USBtoUART'
BAUD_RATE = 115200
START_MARKER = b'START_JPEG'
END_MARKER = b'END_JPEG'
OUTPUT_DIR = "captured_images"

def test_command_and_save():
    """
    Spresenseにコマンドを送信して写真を撮影・保存
    """
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=10)  # タイムアウトを延長
        print(f"✅ シリアル接続: {SERIAL_PORT}")
        
        # 既存のデータをクリア
        time.sleep(1)
        ser.reset_input_buffer()
        
        print("📤 TAKE_PHOTOコマンドを送信...")
        ser.write(b'TAKE_PHOTO\n')
        
        print("📥 開始マーカー待機中...")
        # バイト形式のマーカーで待機（START_MARKERは既にbytes）
        start_marker_bytes = START_MARKER + b'\r\n'
        line = ser.read_until(start_marker_bytes)
        
        if line.endswith(start_marker_bytes):
            print("✅ 画像データ送信開始を確認！")
            print("📥 バイナリJPEGデータ受信中...")
            
            # バイナリデータを直接受信
            jpeg_data = b''
            start_time = time.time()
            
            while True:
                chunk = ser.read(1024)
                if chunk:
                    # END_MARKERが含まれているかチェック（END_MARKERは既にbytes）
                    end_marker_bytes = b'\r\n' + END_MARKER
                    if end_marker_bytes in chunk:
                        # マーカー前のデータを取得
                        end_pos = chunk.find(end_marker_bytes)
                        jpeg_data += chunk[:end_pos]
                        break
                    else:
                        jpeg_data += chunk
                
                if time.time() - start_time > 30:
                    print("❌ 受信タイムアウト")
                    break

            if jpeg_data:
                # ファイル保存（jpeg_saver.pyと同じ方式）
                os.makedirs(OUTPUT_DIR, exist_ok=True)
                file_name = os.path.join(OUTPUT_DIR, f"test_capture_{int(time.time())}.jpg")
                with open(file_name, "wb") as f:
                    f.write(jpeg_data)
                
                print(f"✅ 撮影完了！サイズ: {len(jpeg_data)} bytes")
                print(f"📁 保存先: {file_name}")
            else:
                print("❌ 画像データを受信できませんでした")
        else:
            print("❌ 開始マーカーを受信できませんでした")
        
        ser.close()
        
    except Exception as e:
        print(f"❌ エラー: {e}")

if __name__ == "__main__":
    test_command_and_save()