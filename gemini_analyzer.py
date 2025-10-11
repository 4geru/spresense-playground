from google import genai
from dotenv import load_dotenv
from google.genai.types import Part
import time
import os

load_dotenv()

# --- 設定 ---
# ⚠️ あなたのGemini APIキーをここに設定してください ⚠️
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = 'gemini-2.5-flash' # 高速な画像理解に適したモデル

# -------------------------------------------------------------------
# 検証用のモックデータ: 
# 実際には、この 'jpeg_bytes' に Spresenseからシリアル通信で受信した
# JPEGのバイトデータが入ります。
# -------------------------------------------------------------------
def get_mock_jpeg_bytes(file_path="mock_image.jpg"):
    """モックとしてファイルからJPEGのバイトデータを読み込む関数"""
    if not os.path.exists(file_path):
        print(f"⚠️ モックファイル '{file_path}' が見つかりません。")
        print("代わりにダミーデータを使用しますが、APIは失敗する可能性があります。")
        return b'\xff\xd8\xff\xe0\x00\x10JFIF' # 最小限のJPEGヘッダー
    
    with open(file_path, "rb") as f:
        print(f"✅ モックファイル '{file_path}' からデータを読み込みました。")
        return f.read()

# 実際の連携では、シリアル受信したデータを使用します
jpeg_bytes = get_mock_jpeg_bytes() 
# -------------------------------------------------------------------

def analyze_image_with_gemini(jpeg_data: bytes):
    """
    JPEGバイトデータをGemini APIに送信し、顔とポーズの判定を行います。
    """
    if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY":
        print("❌ エラー: API_KEYが設定されていません。")
        return None

    try:
        client = genai.Client(api_key=API_KEY)
        
        # 1. 画像データをPartオブジェクトに変換
        image_part = Part.from_bytes(
            data=jpeg_data,
            mime_type='image/jpeg'
        )

        # 2. ポーズ判定を含むプロンプトを作成
        # 自由な表現で複雑な判定を依頼できます。
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
            config={"response_mime_type": "application/json"} # JSON形式で出力を強制
        )
        
        end_time = time.time()
        print(f"⏱️ 応答受信完了 (処理時間: {end_time - start_time:.2f}秒)")

        # 4. 応答を解析して結果を返す
        import json
        try:
            # response.textはJSON文字列として返ってくる
            analysis_result = json.loads(response.text)
            return analysis_result
        except json.JSONDecodeError:
            print("❌ エラー: APIの応答が有効なJSON形式ではありませんでした。")
            print(f"生の応答: {response.text}")
            return None

    except Exception as e:
        print(f"❌ Gemini API通信中に予期せぬエラーが発生しました: {e}")
        return None

# --- メイン処理 ---
if __name__ == "__main__":
    if jpeg_bytes:
        result = analyze_image_with_gemini(jpeg_bytes)
        
        if result:
            print("\n==============================")
            print("  AIポーズ判定結果")
            print("==============================")
            print(f"👤 顔の検出: {result.get('face_detected')}")
            print(f"✌️ ピースサイン: {result.get('is_peacesign')}")
            
            # ポーズが成立した場合の最終アクション
            if result.get('face_detected') == 'Yes' and result.get('is_peacesign') == 'Yes':
                print("\n🎉 判定成功！おめでとうございます。")
                # ここにSpresenseへ「撮影OK」コマンドをシリアル送信するロジックが入ります
            else:
                print("\n😟 判定失敗。ポーズを確認してください。")
        else:
             print("\n処理を続行できませんでした。設定を確認してください。")