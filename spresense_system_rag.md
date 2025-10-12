# Spresense AI画像処理システム - 完全技術仕様書（RAGファイル）

## システム概要

### 🎯 新要件の統合ワークフロー

```
[1] Spresenseカメラ撮影
    ↓
[2] シリアル通信でMacへ送信
    ↓
[3] Gemini分析（人・ポーズ判定）→ JSON応答
    ↓
[4] 判定結果でアメコミ風変換決定
    ↓
[5] 条件マッチ時: Gemini画像変換
    ↓
[6] オリジナル+変換画像をSupabaseアップロード
    ↓
[7] LINE Bot送信（original: アメコミ風, preview: オリジナル）
```

## 技術スタック・構成

### ハードウェア
- Sony Spresense メインボード + Camera Board (ISX012)
- シリアル通信: USB-UART (/dev/cu.SLAB_USBtoUART)
- 最大解像度: 2608x1960 (5MP)

### ソフトウェア
- **Arduino**: Spresenseカメラ制御
- **Python**: 画像処理・AI連携・クラウド送信
- **クラウドサービス**: Gemini 2.0 Flash API, Supabase Storage, LINE Bot API

### 通信プロトコル
- **Spresense↔Mac**: シリアル通信 (115200 bps)
- **Mac↔Gemini**: HTTPS API
- **Mac↔Supabase**: HTTPS API
- **Mac↔LINE**: HTTPS Webhook API

## 既存実装コード分析

### 1. Spresenseカメラコード

#### A. 連続撮影版: `spresense_camera.ino`
```cpp
#include <Camera.h>
#define BAUD_RATE 115200 
const char* START_MARKER = "START_JPEG";
const char* END_MARKER = "END_JPEG";

void setup() {
  theCamera.setStillPictureImageFormat(320, 240, CAM_IMAGE_PIX_FMT_JPG, 1);
}

void loop() {
  CamImage img = theCamera.takePicture(); 
  if (img.isAvailable()) { 
    const uint8_t* image_buffer = (const uint8_t*)img.getImgBuff();
    size_t actual_size = img.getImgSize();        
    Serial.print(START_MARKER);
    Serial.write(image_buffer, actual_size);
    Serial.println(END_MARKER);
  }
  delay(5000); 
}
```

#### B. コマンド制御版: `capture_spresense_camera.ino`
```cpp
void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\\n');
    if (command == "TAKE_PHOTO") {
      CamImage img = theCamera.takePicture(); 
      // 同じ送信ロジック
    }
  }
  delay(100);
}
```

**重要技術ポイント:**
- 高解像度撮影: `jpgbufsize_divisor` パラメータ調整が必要
- API更新: `getImgBuff()`, `getImgSize()` メソッド使用
- バイナリデータ送信: `Serial.write()` でバイト配列送信

### 2. Python画像受信コード

#### A. 連続受信版: `jpeg_saver.py`
```python
SERIAL_PORT = '/dev/cu.SLAB_USBtoUART' 
BAUD_RATE = 115200
START_MARKER = b'START_JPEG'
END_MARKER = b'END_JPEG' 

def save_jpeg_from_spresense():
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1.0)
    line = ser.read_until(START_MARKER)
    if line.endswith(START_MARKER):
        jpeg_data = b''
        while True:
            chunk = ser.read(1024)
            if END_MARKER in chunk:
                jpeg_data += chunk.split(END_MARKER)[0]
                break
            else:
                jpeg_data += chunk
        # ファイル保存処理
```

#### B. コマンド送信版: `capture_command.py`
```python
def test_command_and_save():
    ser.write(b'TAKE_PHOTO\\n')  # コマンド送信
    # 同じ受信ロジック
```

**重要技術ポイント:**
- タイムアウト管理: 高解像度画像用に30秒延長
- バイナリデータ処理: `read_until()` と `split()` の組み合わせ
- エラーハンドリング: マーカー検出失敗時の対処

### 3. Gemini AI分析コード

#### `gemini_analyzer_v2.py`
```python
def analyze_image_with_gemini(jpeg_data: bytes):
    prompt = (
        "この画像について分析してください。\\n"
        "1. 人の顔は映っていますか？ (Yes/No)\\n"
        "2. 映っている場合、その人はカメラに向かって何かポーズ（ピースサイン、グッドサイン、ガッツポーズ）をしていますか？ (Yes/No)\\n"
        "結果を以下のJSON形式でのみ出力してください: "
        "{'face_detected': 'Yes/No', 'is_pose': 'Yes/No'}"
    )
    
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": jpeg_data}])
    return json.loads(response.text)
```

**重要技術ポイント:**
- JSON構造化応答: 判定ロジック用の定型フォーマット
- バイナリ画像処理: JPEGバイトデータ直接送信
- エラーハンドリング: JSONDecodeError対応

### 4. アメコミ風変換コード

#### `simple_image_editor.py`
```python
class ImageEditor:
    def __init__(self, model_name='gemini-2.0-flash-exp'):
        self.client = genai.Client(api_key=api_key)
    
    @staticmethod
    def get_comic_style_prompt():
        return """Transform this image into American comic book style with:
        1. BOLD OUTLINES: 太い黒い輪郭線
        2. VIBRANT COLORS: 鮮やかな色彩と強いコントラスト  
        3. ACTION LINES: 集中線・スピード線
        4. ONOMATOPOEIA: POW!,CHOMP!などの効果音
        5. HALFTONE EXPRESSION: ドット模様テクスチャ
        6. EXAGGERATED EMOTIONS: 誇張された表情"""
    
    def edit_image(self, image_path, edit_prompt):
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[{"text": f"Edit this image: {edit_prompt}"},
                     {"inline_data": {"mime_type": mime_type, "data": encoded_image}}],
            config=types.GenerateContentConfig(
                response_modalities=["Text", "Image"],
                temperature=0.7, max_output_tokens=2048)
        )

def convert_to_comic_style(image_path):
    editor = ImageEditor()
    return editor.edit_image(image_path, ImageEditor.get_comic_style_prompt())
```

**重要技術ポイント:**
- Gemini 2.0 Flash: 画像生成・編集対応モデル
- 6要素詳細プロンプト: アメコミ風変換の専門仕様
- Base64エンコーディング: 画像データ処理
- レスポンス処理: `response_modalities=["Text", "Image"]`

### 5. LINE Bot送信コード

#### `line_bot_push.py`
```python
def upload_images_to_supabase(original_path: str, preview_path: str):
    supabase, bucket_name = _get_supabase_client()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 2つの画像をアップロード
    original_file_name = f"{timestamp}_original_{os.path.basename(original_path)}"
    preview_file_name = f"{timestamp}_preview_{os.path.basename(preview_path)}"
    
    # 公開URLを取得
    original_url = supabase.storage.from_(bucket_name).get_public_url(original_file_name)
    preview_url = supabase.storage.from_(bucket_name).get_public_url(preview_file_name)
    return (original_url, preview_url)

def send_image_with_line_push(original_path: str, preview_path: str, user_id: Optional[str] = None):
    image_urls = upload_images_to_supabase(original_path, preview_path)
    original_url, preview_url = image_urls
    
    messages = [{
        "type": "image",
        "originalContentUrl": original_url,      # タップ時の高解像度
        "previewImageUrl": preview_url           # 一覧表示用
    }]
    
    return send_line_message(messages, user_id)
```

**重要技術ポイント:**
- Supabase Storage: クラウド画像保存
- LINE画像メッセージ: original/preview URL分離
- タイムスタンプファイル名: 重複防止
- エラーハンドリング: アップロード失敗時の対処

## 新要件への対応設計

### 統合フロー詳細

#### [1-2] 撮影・受信フェーズ
- **使用コード**: `capture_spresense_camera.ino` + `capture_command.py`
- **変更点**: 高解像度設定 (`jpgbufsize_divisor=1`)
```cpp
theCamera.setStillPictureImageFormat(1920, 1080, CAM_IMAGE_PIX_FMT_JPG, 1);
```

#### [3] 人・ポーズ判定フェーズ
- **使用コード**: `gemini_analyzer_v2.py` の `analyze_image_with_gemini()`
- **応答例**:
```json
{"face_detected": "Yes", "is_pose": "Yes"}
```

#### [4] 条件分岐ロジック
```python
if result.get('face_detected') == 'Yes' and result.get('is_pose') == 'Yes':
    # アメコミ風変換を実行
    comic_image_path = convert_to_comic_style(original_image_path)
else:
    # 変換をスキップ
    comic_image_path = None
```

#### [5] アメコミ風変換フェーズ
- **使用コード**: `simple_image_editor.py` の `convert_to_comic_style()`
- **条件**: `face_detected=Yes` AND `is_pose=Yes`

#### [6-7] アップロード・LINE送信フェーズ
- **使用コード**: `line_bot_push.py` の `send_image_with_line_push()`
- **仕様変更**: 
  - original: アメコミ風画像（高解像度）
  - preview: Spresense画像（オリジナル）

### 統合システム設計

#### 新規メインスクリプト: `integrated_photo_system.py`
```python
def integrated_photo_workflow():
    # [1-2] 撮影・受信
    image_data, original_path = capture_from_spresense()
    
    # [3] AI分析
    analysis_result = analyze_image_with_gemini(image_data)
    
    # [4] 条件判定
    if should_convert_to_comic(analysis_result):
        # [5] アメコミ風変換
        comic_path = convert_to_comic_style(original_path)
        
        # [6-7] 両画像をアップロード・送信
        success = send_image_with_line_push(
            original_path=comic_path,    # アメコミ風をメイン画像に
            preview_path=original_path   # オリジナルをプレビューに
        )
    else:
        # 変換しない場合は元画像のみ
        success = send_image_with_line_push(
            original_path=original_path,
            preview_path=original_path
        )
    
    return success

def should_convert_to_comic(analysis_result):
    return (analysis_result.get('face_detected') == 'Yes' and 
            analysis_result.get('is_pose') == 'Yes')
```

## 環境変数・設定

### .env ファイル構成
```bash
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here
LINE_USER_ID=your_line_user_id_here

# Supabase
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_BUCKET_NAME=your_bucket_name_here
```

### requirements-dev.txt
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

## API仕様・エラーハンドリング

### Gemini API仕様

#### 人・ポーズ判定API
- **モデル**: `gemini-2.5-flash`
- **入力**: JPEG画像バイナリ + 判定プロンプト
- **出力**: JSON `{"face_detected": "Yes/No", "is_pose": "Yes/No"}`
- **タイムアウト**: 30秒
- **エラー**: JSONDecodeError時のフォールバック

#### 画像変換API
- **モデル**: `gemini-2.0-flash-exp`
- **入力**: JPEG画像 + 6要素アメコミプロンプト
- **出力**: `response_modalities=["Text", "Image"]`
- **設定**: `temperature=0.7, max_output_tokens=2048`

### LINE Bot API仕様

#### 画像メッセージ構造
```json
{
  "type": "image",
  "originalContentUrl": "https://supabase.co/.../comic_image.png",
  "previewImageUrl": "https://supabase.co/.../original_image.jpg"
}
```

### エラーハンドリング戦略

#### レベル1: 通信エラー
- シリアル通信タイムアウト → 再試行
- API接続失敗 → ログ出力・継続

#### レベル2: データエラー  
- 画像データ破損 → スキップ・次回処理
- JSON解析失敗 → デフォルト値設定

#### レベル3: システムエラー
- 致命的エラー → 安全停止・状態保存

## パフォーマンス・制約

### 処理時間
- 撮影・転送: 3-10秒（解像度依存）
- AI分析: 5-15秒
- 画像変換: 10-30秒
- アップロード・送信: 2-5秒
- **合計**: 20-60秒/枚

### メモリ・ストレージ
- Spresense: 1.5MB SRAM制約
- Python: 画像バッファリング最適化
- Supabase: 無制限ストレージ

### レート制限
- Gemini API: 15 RPM
- LINE Bot API: 制限なし（実質）
- Supabase: 1GB/月転送量

## デバッグ・モニタリング

### ログ出力例
```
✅ [12:34:56] Spresense画像受信完了: 1.2MB
🔍 [12:35:01] Gemini分析開始...
✅ [12:35:08] 判定結果: face=Yes, pose=Yes
🎨 [12:35:10] アメコミ風変換開始...
✅ [12:35:35] 変換完了: comic_image_12345.png
📤 [12:35:40] Supabaseアップロード完了
📱 [12:35:42] LINE Bot送信完了
```

### テスト・検証方法

#### 単体テスト
```python
# 1. 画像受信テスト
test_spresense_communication()

# 2. AI分析テスト  
test_gemini_analysis("test_images/person_pose.jpg")

# 3. 変換テスト
test_comic_conversion("test_images/sample.jpg")

# 4. 送信テスト
test_line_bot_push("test_images/comic.png", "test_images/original.jpg")
```

#### 統合テスト
```python
# エンドツーエンドテスト
test_full_workflow()

# 異常系テスト
test_no_face_detected()
test_network_failure()
test_file_corruption()
```

## セキュリティ・プライバシー

### API キー管理
- .env ファイル: gitignore設定
- 環境変数: 本番環境での注入

### 画像データ保護
- 一時的ローカル保存: 処理後削除
- Supabase暗号化: HTTPS通信
- LINE送信: 一時的URL（期限付き）

### アクセス制御
- LINE Bot: 特定ユーザー限定
- Supabase: 匿名アクセス（読み取り専用）

## トラブルシューティング

### よくある問題

| 症状 | 原因 | 解決方法 |
|------|------|----------|
| 画像受信失敗 | シリアル通信エラー | ポート確認・再接続 |
| AI分析タイムアウト | ネットワーク遅延 | API Key確認・再試行 |
| 変換画像が生成されない | Gemini API制限 | レート制限確認・待機 |
| LINE送信失敗 | トークン無効 | 認証情報確認 |

### 復旧手順
1. エラーログ確認
2. 環境変数検証  
3. ネットワーク接続確認
4. API制限状況確認
5. 段階的機能テスト

---

この技術仕様書は、Spresense AI画像処理システムの完全な実装ガイドとして、Claude等のAIアシスタントが効率的にシステム理解・実装支援を行うためのRAG（Retrieval-Augmented Generation）ファイルです。