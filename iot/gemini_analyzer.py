import os
import time
import json
from dotenv import load_dotenv
from google import genai
from google.genai.types import Part

# 1. 環境変数のロード
load_dotenv()

# --- 設定 ---
# ⚠️ .envからAPIキーを読み込み
API_KEY = os.getenv("GEMINI_API_KEY") 
MODEL_NAME = 'gemini-2.5-flash'

# -------------------------------------------------------------------
# 【修正箇所】: ローカルファイルからJPEGバイトデータを読み込む関数
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
        client = genai.Client(api_key=API_KEY)
        
        # 1. 画像データをPartオブジェクトに変換
        image_part = Part.from_bytes(
            data=jpeg_data,
            mime_type='image/jpeg'  # 画像のMIMEタイプを正確に指定
        )

        # 2. ポーズ判定を含むプロンプトを作成
        prompt = (
            "この画像について分析してください。\n"
            "1. 人の顔は映っていますか？ (Yes/No)\n"
            "2. 映っている場合、その人はカメラに向かってピースサインをしていますか？ (Yes/No)\n"
            "結果を以下のJSON形式でのみ出力してください: "
            "{'face_detected': 'Yes/No', 'is_peacesign': 'Yes/No'}"
        )

        print("🔍 Gemini APIに画像とプロンプトを送信中...")
        start_time = time.time()
        
        # 3. Gemini APIにリクエストを送信
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt, image_part],
            config={"response_mime_type": "application/json"}
        )
        
        end_time = time.time()
        print(f"⏱️ 応答受信完了 (処理時間: {end_time - start_time:.2f}秒)")

        # 4. 応答を解析して結果を返す
        try:
            analysis_result = json.loads(response.text)
            return analysis_result
        except json.JSONDecodeError:
            print("❌ エラー: APIの応答が有効なJSON形式ではありませんでした。")
            return None

    except Exception as e:
        print(f"❌ Gemini API通信中に予期せぬエラーが発生しました: {e}")
        return None

# --- メイン処理 ---
if __name__ == "__main__":
    # -------------------------------------------------------------------
    # 【実行箇所】: Mac上にある検証したい画像ファイルのパスを指定
    # -------------------------------------------------------------------
    # 例: スクリプトと同じディレクトリにある 'test_pose.jpg' を指定
    IMAGE_PATH = "./images/peace.jpeg" 
    # IMAGE_PATH = "./images/angry.jpeg" 
    
    # 別の場所の画像を指定する場合はフルパスを使用
    # 例: IMAGE_PATH = "/Users/yourname/Pictures/pose_20251011.jpg"

    image_bytes = load_image_file_bytes(IMAGE_PATH) 

    if image_bytes:
        result = analyze_image_with_gemini(image_bytes)
        
        if result:
            print("\n==============================")
            print("  AIポーズ判定結果")
            print("==============================")
            print(f"👤 顔の検出: {result.get('face_detected')}")
            print(f"✌️ ピースサイン: {result.get('is_peacesign')}")
            
            if result.get('face_detected') == 'Yes' and result.get('is_peacesign') == 'Yes':
                print("\n🎉 判定成功！ (ピースサインが検出されました)")
            else:
                print("\n😟 判定失敗。")
    # -------------------------------------------------------------------
