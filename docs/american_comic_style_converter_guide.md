# Sony Spresense画像をアメコミ風に変換するシステム構築ガイド

## はじめに

Sony Spresenseで撮影した画像をGemini 2.0 Flash AIを使ってアメリカンコミック風に変換するシステムの構築方法を解説します。

この記事では、**詳細な6要素アメコミプロンプトとGemini 2.0 Flash APIを活用した高品質変換**を実現する完全なシステムを構築します。

**こんな方におすすめ：**
- Spresenseで撮影した画像をアート風に変換したい
- AI画像編集・生成技術を学びたい
- Gemini 2.0 Flash の画像生成機能を活用したい
- アメリカンコミック風の表現技法に興味がある

## TL;DR（結論）

**システム構成**: 画像ファイル → Python処理 → Gemini 2.0 Flash API → アメコミ風変換画像  
**変換方法**: 6要素詳細プロンプト + Gemini 2.0 Flash 画像編集機能  
**制御**: シンプル関数1つで完結

```python
# Python側でアメコミ風変換
from simple_image_editor import convert_to_comic_style

result = convert_to_comic_style("my_photo.jpg")
```

## 環境・使用サービス

```
【ハードウェア】
- Sony Spresense メインボード + Camera Board
- 撮影済み画像ファイル（JPEG, PNG対応）

【クラウドサービス】
- Google Gemini 2.0 Flash API (画像生成・編集対応)

【ソフトウェア】
- Python 3.x
- 必要ライブラリ: google-genai, python-dotenv, Pillow

【開発環境】
- macOS/Windows/Linux
- .env ファイルでの環境変数管理
```

## システム概要

### 🔄 動作フロー

1. **画像準備**: 変換したい画像ファイルを指定
2. **AI変換**: Gemini 2.0 Flash APIで6要素アメコミ風プロンプト適用
3. **画像生成**: 高品質アメコミ風画像の生成・保存
4. **結果確認**: 変換結果ファイルパスの返却

### 🎨 アメコミ風変換の6要素

```
1. BOLD OUTLINES (太い輪郭線)
   - キャラクターとオブジェクトに太い黒い輪郭線を追加

2. VIBRANT COLORS (鮮やかな色彩)
   - 高彩度の原色と強いコントラストを使用

3. ACTION LINES (効果線)
   - 動きや感情を表現する集中線・スピード線を追加

4. ONOMATOPOEIA (オノマトペ)
   - "POW!", "CHOMP!", "SLURP!" などの効果音文字

5. HALFTONE EXPRESSION (ハーフトーン)
   - 背景や影に小さなドット模様を適用

6. EXAGGERATED EMOTIONS (誇張表現)
   - 表情を大げさに表現、感情を強調
```

### 📡 システム構成

```
Python Script
    ↓
[1] convert_to_comic_style()
    ↓ 
Gemini 2.0 Flash API (画像編集)
    ↓
アメコミ風変換画像 (PNG保存)
    ↓
変換結果ファイルパス返却
```

## Python実装 (完全版)

### メインファイル: `simple_image_editor.py`

```python
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
    
    # コマンドライン引数をチェック
    if len(sys.argv) == 2:
        image_path = sys.argv[1]
        result = convert_to_comic_style(image_path)
        
        if result:
            print(f"\n🎉 変換完了: {result}")
        else:
            print("\n💥 変換失敗")
        return
    
    # インタラクティブモード
    try:
        while True:
            print("\n" + "=" * 50)
            print("アメコミ風変換を開始します")
            print("終了するには 'quit' と入力してください")
            print("=" * 50)
            
            # 画像パス入力
            image_path = input("🖼️ 変換する画像のパス: ").strip()
            
            if image_path.lower() in ['quit', 'exit', '終了']:
                print("👋 変換を終了します")
                break
            
            if not image_path:
                print("❌ 画像パスを入力してください")
                continue
            
            # アメコミ風変換実行
            result = convert_to_comic_style(image_path)
            
            if result:
                print(f"\n🎉 変換完了: {result}")
                
                # 続行確認
                continue_convert = input("\n他の画像も変換しますか？ (y/n): ").strip().lower()
                if continue_convert not in ['y', 'yes', 'はい']:
                    print("👋 変換を終了します")
                    break
            else:
                print("\n💥 変換失敗")
                
                retry = input("別の画像で再試行しますか？ (y/n): ").strip().lower()
                if retry not in ['y', 'yes', 'はい']:
                    print("👋 変換を終了します")
                    break
    
    except KeyboardInterrupt:
        print("\n👋 変換を終了します")
    except Exception as e:
        print(f"\n❌ 予期しないエラー: {e}")

if __name__ == "__main__":
    main()
```

### 環境設定ファイル: `.env`

```bash
# Gemini API 設定
GEMINI_API_KEY=your_gemini_api_key_here
```

### 依存関係ファイル: `requirements-dev.txt`

```
google-genai
python-dotenv
google-generativeai
pyserial
Pillow
line-bot-sdk
requests
supabase
```

## 🛠️ セットアップ手順

### Step 1: Gemini API の取得

1. **Google AI Studio にアクセス**
   - https://aistudio.google.com/
   
2. **APIキーを取得**
   - 「Get API key」から新しいAPIキーを作成
   
3. **環境変数に設定**
   ```bash
   # .env ファイルに追加
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### Step 2: Python環境の準備

1. **仮想環境セットアップ**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # macOS/Linux
   # .venv\Scripts\activate   # Windows
   ```

2. **依存関係インストール**
   ```bash
   pip install -r requirements-dev.txt
   ```

3. **環境変数設定**
   - `.env`ファイルに実際のAPIキーを設定

### Step 3: 動作テスト

```bash
# CLIで直接実行
python3 simple_image_editor.py your_photo.jpg

# インタラクティブモード
python3 simple_image_editor.py
```

期待される出力:
```
🦸 アメコミ風画像変換ツール
📱 Gemini 2.0 Flash でアメリカンコミック風に変換
==================================================
✅ Gemini API 初期化完了: gemini-2.0-flash-exp
🦸 アメコミ風変換開始: my_photo.jpg
📷 画像読み込み完了: my_photo.jpg
📊 ファイルサイズ: 234,567 bytes
🎨 画像編集中...
⏳ Gemini APIに送信中...
✨ レスポンス受信完了
💾 編集画像保存完了: edited_images/comic_my_photo_1760123456.png
✅ アメコミ風変換完了: edited_images/comic_my_photo_1760123456.png

🎉 変換完了: edited_images/comic_my_photo_1760123456.png
```

## 🎯 実装上の重要ポイント

### 1. シンプル関数設計

**✅ 利点:**
```python
# [1] メイン変換関数（他ファイルから呼び出し可能）
convert_to_comic_style(image_path)

# [2] クラスベースの内部実装
ImageEditor.edit_image(image_path, comic_prompt)

# [3] 静的メソッドでプロンプト取得
ImageEditor.get_comic_style_prompt()
```

### 2. 6要素詳細プロンプト

```python
# アメコミ風変換の核となる要素
comic_prompt = """
1. BOLD OUTLINES: 太い黒い輪郭線
2. VIBRANT COLORS: 鮮やかな色彩と強いコントラスト  
3. ACTION LINES: 集中線・スピード線
4. ONOMATOPOEIA: POW!,CHOMP!などの効果音
5. HALFTONE EXPRESSION: ドット模様テクスチャ
6. EXAGGERATED EMOTIONS: 誇張された表情
"""
```

### 3. エラーハンドリングと出力管理

```python
# ファイル存在確認
if not os.path.exists(image_path):
    print(f"❌ ファイルが見つかりません: {image_path}")
    return None

# 出力ファイル名の自動生成
output_filename = f"comic_{base_name}_{timestamp}.png"

# API応答の画像データ処理
for part in response.parts:
    if hasattr(part, 'inline_data') and part.inline_data:
        # Base64デコード→PIL→PNG保存
        image_data = base64.b64decode(part.inline_data.data)
        image = Image.open(BytesIO(image_data))
        image.save(output_path)
```

## 🔧 他ファイルからの呼び出し方法

### カメラキャプチャスクリプトとの連携

```python
# capture_and_convert.py
from simple_image_editor import convert_to_comic_style

def capture_and_convert():
    """撮影後にアメコミ風変換"""
    # Spresenseで撮影実行
    latest_image = capture_latest_image()  # 撮影関数
    
    if latest_image:
        # アメコミ風変換
        comic_result = convert_to_comic_style(latest_image)
        
        if comic_result:
            print(f"🦸 アメコミ風変換完了: {comic_result}")
            return comic_result
        else:
            print("❌ アメコミ風変換失敗")
            return None
```

### 一括変換スクリプト

```python
# batch_converter.py
import glob
from simple_image_editor import convert_to_comic_style

def batch_convert_images(image_directory):
    """指定ディレクトリ内の全画像を一括変換"""
    image_files = glob.glob(f"{image_directory}/*.jpg") + glob.glob(f"{image_directory}/*.png")
    
    results = []
    for image_file in image_files:
        print(f"🔄 変換中: {image_file}")
        result = convert_to_comic_style(image_file)
        
        if result:
            results.append(result)
            print(f"✅ 完了: {result}")
        else:
            print(f"❌ 失敗: {image_file}")
    
    print(f"\n🎉 一括変換完了: {len(results)}件成功")
    return results

# 使用例
batch_convert_images("captured_images")
```

### LINE Bot連携

```python
# comic_line_bot.py
from simple_image_editor import convert_to_comic_style
from line_bot_push import send_image_with_line_push

def convert_and_notify(original_image):
    """アメコミ風変換してLINE通知"""
    # アメコミ風変換
    comic_image = convert_to_comic_style(original_image)
    
    if comic_image:
        # LINE Botで送信（オリジナル・アメコミ風の両方）
        success = send_image_with_line_push(
            original_path=original_image,     # オリジナル画像
            preview_path=comic_image         # アメコミ風をプレビューに
        )
        
        if success:
            print("📱 アメコミ風画像をLINE送信完了")
        else:
            print("❌ LINE送信失敗")
    else:
        print("❌ アメコミ風変換失敗")
```

## 🌟 応用・拡張アイデア

### 1. 複数スタイル対応

```python
def convert_to_multiple_styles(image_path):
    """複数のアートスタイルで変換"""
    styles = {
        "comic": ImageEditor.get_comic_style_prompt(),
        "anime": "Convert to anime/manga style with clean lines",
        "watercolor": "Transform into watercolor painting style"
    }
    
    results = {}
    for style_name, prompt in styles.items():
        editor = ImageEditor()
        result = editor.edit_image(image_path, prompt)
        if result:
            results[style_name] = result
    
    return results
```

### 2. 品質設定対応

```python
def convert_with_quality_settings(image_path, quality="high"):
    """品質設定付き変換"""
    quality_settings = {
        "high": {"temperature": 0.3, "max_tokens": 4096},
        "medium": {"temperature": 0.7, "max_tokens": 2048}, 
        "fast": {"temperature": 1.0, "max_tokens": 1024}
    }
    
    settings = quality_settings.get(quality, quality_settings["medium"])
    
    editor = ImageEditor()
    # カスタム設定で変換実行
    return editor.edit_image_with_settings(image_path, settings)
```

### 3. 進捗表示機能

```python
def convert_with_progress(image_path):
    """進捗表示付き変換"""
    import time
    
    print("🔄 [1/4] 画像読み込み中...")
    time.sleep(0.5)
    
    print("🔄 [2/4] Gemini API接続中...")
    editor = ImageEditor()
    time.sleep(0.5)
    
    print("🔄 [3/4] アメコミ風変換処理中...")
    result = convert_to_comic_style(image_path)
    
    print("🔄 [4/4] 結果保存中...")
    time.sleep(0.5)
    
    print("✅ 変換完了!")
    return result
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

| 症状 | 原因 | 解決方法 |
|------|------|----------|
| `❌ ValueError: 環境変数 'GEMINI_API_KEY' が設定されていません` | API Key未設定 | `.env`ファイルに正しいAPIキーを設定 |
| `❌ ファイルが見つかりません` | 画像パス間違い | ファイルパスを確認、相対パス・絶対パス注意 |
| `⚠️ 編集画像が生成されませんでした` | API応答エラー | APIキー確認、画像サイズ・形式確認 |
| 変換に時間がかかる | 大きい画像サイズ | 画像サイズを事前にリサイズ |

### デバッグ用コマンド

```python
# 環境確認スクリプト
def check_environment():
    """環境設定確認"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # API Key確認
    api_key = os.getenv("GEMINI_API_KEY")
    print(f"GEMINI_API_KEY: {'✅ 設定済み' if api_key else '❌ 未設定'}")
    
    # ライブラリ確認
    try:
        from google import genai
        print("google-genai: ✅ インストール済み")
    except ImportError:
        print("google-genai: ❌ 未インストール")
    
    try:
        from PIL import Image
        print("Pillow: ✅ インストール済み")
    except ImportError:
        print("Pillow: ❌ 未インストール")

# ファイル確認スクリプト
def check_image_file(image_path):
    """画像ファイル確認"""
    import os
    from PIL import Image
    
    if os.path.exists(image_path):
        print(f"✅ ファイル存在: {image_path}")
        
        try:
            with Image.open(image_path) as img:
                print(f"📊 画像情報: {img.format} {img.size} {img.mode}")
        except Exception as e:
            print(f"❌ 画像読み込みエラー: {e}")
    else:
        print(f"❌ ファイル未発見: {image_path}")

# 使用例
check_environment()
check_image_file("my_photo.jpg")
```

## 📚 参考資料・関連リンク

### 公式ドキュメント
- 📖 [Google AI Studio](https://aistudio.google.com/)
- 🔧 [Gemini API ドキュメント](https://ai.google.dev/)
- 🐍 [Google GenAI Python SDK](https://github.com/google/generative-ai-python)

### 関連技術
- 🎨 [PIL/Pillow 画像処理ライブラリ](https://pillow.readthedocs.io/)
- 📝 [Python dotenv](https://github.com/theskumar/python-dotenv)

### アメコミ風表現技法
- 🦸 [American Comic Book Art Techniques](https://en.wikipedia.org/wiki/American_comic_book)
- 🎭 [Halftone in Comic Books](https://en.wikipedia.org/wiki/Halftone)

## 🎪 実際の活用例

**このシステムが活かせるプロジェクト：**
- 📷 **SNS投稿用アート加工** - 普通の写真をアーティスティックに変換
- 🎮 **ゲーム開発素材作成** - キャラクター画像のコミック風変換
- 📚 **教育コンテンツ制作** - 説明図をより親しみやすく変換
- 🎨 **デジタルアート制作** - AI支援によるアート作品制作
- 📱 **IoT画像処理** - Spresense撮影画像の自動アート化

## 🏷️ タグ
`#Gemini 2.0` `#AI画像生成` `#アメコミ風変換` `#Python` `#画像処理` `#Sony Spresense` `#コンピュータービジョン` `#アート生成` `#API連携`

---

この記事が、Sony Spresense画像をAIでアメコミ風に変換するシステム開発の参考になれば幸いです！質問やコメントがあれば、お気軽にお寄せください。

**🔄 更新履歴**
- 2024/10/12: 初回公開
- 2024/10/12: シンプル関数設計と6要素詳細プロンプトを実装
- 2024/10/12: 他ファイルからの呼び出し例とトラブルシューティングを追加