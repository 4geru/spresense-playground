import os
from google import genai
from google.genai import types
from PIL import Image
from dotenv import load_dotenv
import time
from io import BytesIO
import base64
import sys

# 環境変数をロード
load_dotenv()

class ImageEditor:
    """
    Gemini 2.0 Flash を使用したアメコミ風画像変換クラス
    """
    
    def __init__(self, model_name='gemini-2.0-flash-exp', output_dir="edited_images"):
        """
        初期化
        
        Args:
            model_name (str): 使用するGeminiモデル名
            output_dir (str): 出力ディレクトリ
        """
        self.model_name = model_name
        self.output_dir = output_dir
        self.client = None
        self._setup_gemini()
    
    def _setup_gemini(self):
        """Gemini APIを初期化する"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("環境変数 'GEMINI_API_KEY' が設定されていません。")
        
        try:
            self.client = genai.Client(api_key=api_key)
            print(f"✅ Gemini API 初期化完了: {self.model_name}")
        except Exception as e:
            raise Exception(f"Gemini API初期化に失敗しました: {e}")
    
    @staticmethod
    def get_comic_style_prompt():
        """
        アメコミ風変換用の詳細プロンプトを返す
        
        Returns:
            str: アメコミ風変換プロンプト
        """
        return """Transform this image into American comic book style with the following specific elements:

1. BOLD OUTLINES: Add thick, strong black outlines around all characters and objects to create the distinctive comic book look with visual impact and character presence.

2. VIBRANT COLORS AND HIGH CONTRAST: Use bright, primary colors with high saturation and strong light-dark contrast. Adjust the photo's color tone to be brighter and more vivid. Express shadows clearly to emphasize three-dimensional effect.

3. ACTION LINES AND SPEED LINES: Add concentration lines and speed lines in the background to express movement, emotion, and impact. This creates dynamism and energy throughout the entire image.

4. ONOMATOPOEIA (SOUND EFFECTS): Place bold sound effect text like "POW!", "CHOMP!", "SLURP!", "ZZZ!" strategically. These visual sound effects should reinforce the visual information and instantly convey situations and emotions to viewers. Design the text in hand-drawn style with bold fonts following classic comic book typography.

5. HALFTONE (DOT) EXPRESSION: Apply small dot (halftone) textures to backgrounds and shadow areas, which is a classic comic book expression born from printing technology constraints. This creates a retro comic book atmosphere.

6. EXAGGERATED EMOTIONS: Make facial expressions more pronounced and expressive, incorporating the emotional exaggeration characteristic of comic book characters. Enlarge smiles and make expressions more dramatic.

Combine these elements to not just process the photo, but to recreate the visual language and expression style specific to the American comic book genre."""
    
    def edit_image(self, image_path, edit_prompt, output_filename=None):
        """
        指定された画像を編集する
        
        Args:
            image_path (str): 編集する画像のパス
            edit_prompt (str): 編集内容のプロンプト
            output_filename (str): 保存ファイル名（省略時は自動生成）
        
        Returns:
            str: 編集された画像のファイルパス（失敗時はNone）
        """
        
        # ファイル存在確認
        if not os.path.exists(image_path):
            print(f"❌ ファイルが見つかりません: {image_path}")
            return None
        
        if not self.client:
            print("❌ Gemini APIが初期化されていません")
            return None
        
        # 画像を読み込み
        try:
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            encoded_image = base64.b64encode(image_data).decode('utf-8')
            
            # MIMEタイプを判定
            if image_path.lower().endswith('.png'):
                mime_type = 'image/png'
            elif image_path.lower().endswith(('.jpg', '.jpeg')):
                mime_type = 'image/jpeg'
            elif image_path.lower().endswith('.gif'):
                mime_type = 'image/gif'
            elif image_path.lower().endswith('.webp'):
                mime_type = 'image/webp'
            else:
                mime_type = 'image/jpeg'  # デフォルト
            
            print(f"📷 画像読み込み完了: {os.path.basename(image_path)}")
            print(f"📊 ファイルサイズ: {len(image_data):,} bytes")
            
        except Exception as e:
            print(f"❌ 画像読み込みエラー: {e}")
            return None
        
        # 出力ディレクトリ作成
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 出力ファイル名生成
        if not output_filename:
            base_name = os.path.splitext(os.path.basename(image_path))[0]
            timestamp = int(time.time())
            output_filename = f"comic_{base_name}_{timestamp}.png"
        
        output_path = os.path.join(self.output_dir, output_filename)
        
        try:
            print(f"🎨 画像編集中...")
            print("⏳ Gemini APIに送信中...")
            
            # 画像編集リクエスト
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": f"Edit this image: {edit_prompt}"
                            },
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": encoded_image
                                }
                            }
                        ]
                    }
                ],
                config=types.GenerateContentConfig(
                    response_modalities=["Text", "Image"],
                    temperature=0.7,
                    max_output_tokens=2048
                )
            )
            
            print("✨ レスポンス受信完了")
            
            # 編集された画像を処理
            image_saved = False
            
            for part in response.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    try:
                        new_image_data = part.inline_data.data
                        
                        if isinstance(new_image_data, str):
                            new_image_data = base64.b64decode(new_image_data)
                        
                        # PILで画像を保存
                        image = Image.open(BytesIO(new_image_data))
                        image.save(output_path)
                        
                        print(f"💾 編集画像保存完了: {output_path}")
                        image_saved = True
                        
                    except Exception as img_error:
                        print(f"⚠️ 画像保存エラー: {img_error}")
            
            if image_saved:
                return output_path
            else:
                print("⚠️ 編集画像が生成されませんでした")
                return None
            
        except Exception as e:
            print(f"❌ 画像編集エラー: {e}")
            return None

def convert_to_comic_style(image_path):
    """
    指定された画像をアメコミ風に変換する
    
    Args:
        image_path (str): 変換する画像のファイルパス
    
    Returns:
        str: 変換された画像のファイルパス（失敗時はNone）
    """
    # ファイル存在確認
    if not os.path.exists(image_path):
        print(f"❌ ファイルが見つかりません: {image_path}")
        return None
    
    # ImageEditorインスタンス作成
    try:
        editor = ImageEditor()
    except Exception as e:
        print(f"❌ 初期化エラー: {e}")
        return None
    
    # アメコミ風プロンプト取得
    comic_prompt = ImageEditor.get_comic_style_prompt()
    
    print(f"🦸 アメコミ風変換開始: {os.path.basename(image_path)}")
    
    # 画像変換実行
    result = editor.edit_image(image_path, comic_prompt)
    
    if result:
        print(f"✅ アメコミ風変換完了: {result}")
        return result
    else:
        print("❌ アメコミ風変換に失敗しました")
        return None

def main():
    """メイン実行関数"""
    print("🦸 アメコミ風画像変換ツール")
    print("📱 Gemini 2.0 Flash でアメリカンコミック風に変換")
    print("=" * 50)
    
    # 変換する画像ファイルを変数で定義
    image_path = "captured_images/capture_1760235365.jpg"
    
    print(f"🖼️ 変換対象: {image_path}")
    
    # アメコミ風変換実行
    result = convert_to_comic_style(image_path)
    
    if result:
        print(f"\n🎉 変換完了: {result}")
    else:
        print("\n💥 変換失敗")

if __name__ == "__main__":
    main()