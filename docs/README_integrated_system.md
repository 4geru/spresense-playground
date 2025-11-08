# Spresense AI画像処理統合システム

## 🎯 システム概要

Sony Spresenseカメラで撮影した画像を、AI分析に基づいて自動的にアメコミ風変換し、LINE Botで送信する完全自動化システムです。

### 🔄 処理フロー

```
[1] Spresenseカメラで撮影
    ↓
[2] シリアル通信でMac送信  
    ↓
[3] Gemini AI分析（人・ポーズ判定）→ JSON応答
    ↓
[4] 判定結果: 人がいて、ポーズをしている？
    ↓
[5] YES → アメコミ風変換 / NO → スキップ
    ↓
[6] オリジナル+変換画像をSupabaseアップロード
    ↓
[7] LINE Bot送信（メイン: アメコミ風, プレビュー: オリジナル）
```

## 📁 ファイル構成

### 新規統合システム
- **`integrated_photo_system.py`** - メインシステム（全機能統合）
- **`spresense_system_rag.md`** - 完全技術仕様書（RAGファイル）

### 既存コンポーネント（統合済み）
- **`capture_spresense_camera.ino`** - Spresenseカメラ制御（コマンド版）
- **`simple_image_editor.py`** - アメコミ風変換機能
- **`line_bot_push.py`** - LINE Bot送信機能
- **`gemini_analyzer_v2.py`** - AI画像分析機能

## 🚀 クイックスタート

### 1. 環境準備

```bash
# 仮想環境作成・有効化
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux

# 依存関係インストール
pip install -r requirements-dev.txt
```

### 2. 環境変数設定

`.env`ファイルを作成:
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

### 3. Spresense準備

1. `capture_spresense_camera.ino`をSpresenseにアップロード
2. シリアルポート接続確認: `/dev/cu.SLAB_USBtoUART`

### 4. システム実行

```bash
# 統合システム実行
python3 integrated_photo_system.py
```

## 🎛️ 使用方法

### 自動処理モード

```bash
# 1回の撮影・処理を実行
python3 integrated_photo_system.py
```

**期待される動作:**
1. Spresenseに`TAKE_PHOTO`コマンド送信
2. 画像受信・保存（`captured_images/capture_xxx.jpg`）
3. AI分析実行（人・ポーズ判定）
4. 条件マッチ時: アメコミ風変換実行
5. 画像アップロード・LINE送信

### 個別機能テスト

```bash
# カメラ撮影のみ
python3 capture_command.py

# アメコミ風変換のみ  
python3 simple_image_editor.py your_image.jpg

# LINE送信のみ
python3 line_bot_push.py
```

## 🤖 AI判定ロジック

### 分析内容
```
質問1: 人の顔は映っていますか？ (Yes/No)
質問2: その人はポーズをしていますか？ (Yes/No)
```

### 判定結果とアクション
| 人の顔 | ポーズ | アクション |
|--------|--------|------------|
| Yes | Yes | ✅ アメコミ風変換実行 |
| Yes | No | ❌ 変換スキップ |
| No | - | ❌ 変換スキップ |

### 応答例
```json
{"face_detected": "Yes", "is_pose": "Yes"}
```

## 🎨 アメコミ風変換仕様

### 6要素変換技法
1. **BOLD OUTLINES** - 太い黒い輪郭線
2. **VIBRANT COLORS** - 鮮やかな色彩と強いコントラスト
3. **ACTION LINES** - 集中線・スピード線  
4. **ONOMATOPOEIA** - "POW!", "CHOMP!"等の効果音
5. **HALFTONE EXPRESSION** - ドット模様テクスチャ
6. **EXAGGERATED EMOTIONS** - 誇張された表情

### 出力設定
- **フォーマット**: PNG
- **命名**: `comic_{original_name}_{timestamp}.png`
- **保存先**: `edited_images/`

## 📱 LINE Bot送信仕様

### 画像メッセージ構造
```json
{
  "type": "image",
  "originalContentUrl": "https://supabase.co/.../comic_image.png",
  "previewImageUrl": "https://supabase.co/.../original_image.jpg"
}
```

### 送信パターン

#### パターン1: アメコミ風変換実行時
- **メイン画像**: アメコミ風変換画像（高解像度）
- **プレビュー**: Spresenseオリジナル画像

#### パターン2: 変換スキップ時  
- **メイン画像**: Spresenseオリジナル画像
- **プレビュー**: Spresenseオリジナル画像

## 🔧 トラブルシューティング

### よくある問題

#### 1. シリアル通信エラー
```
❌ シリアル通信エラー: [Errno 2] No such file or directory
```
**解決方法:**
- Spresenseの接続確認
- ポート名確認: `ls /dev/cu.*`
- `integrated_photo_system.py`のSERIAL_PORT更新

#### 2. AI分析エラー
```
❌ エラー: 環境変数 GEMINI_API_KEY が設定されていません
```
**解決方法:**
- `.env`ファイルにGEMINI_API_KEY設定
- API Key有効性確認

#### 3. LINE送信エラー
```  
❌ ValueError: LINE_CHANNEL_ACCESS_TOKEN environment variable is required
```
**解決方法:**
- LINE Botチャネル設定確認
- アクセストークン有効性確認

#### 4. アメコミ風変換失敗
```
⚠️ 編集画像が生成されませんでした
```
**解決方法:**
- 画像サイズ確認（大きすぎる場合は縮小）
- Gemini APIレート制限確認
- ネットワーク接続確認

### デバッグモード

```bash
# 詳細ログ出力で実行
python3 integrated_photo_system.py --verbose
```

### 環境確認スクリプト

```python
# debug.py
import os
from dotenv import load_dotenv

load_dotenv()

required_vars = [
    'GEMINI_API_KEY',
    'LINE_CHANNEL_ACCESS_TOKEN', 
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_BUCKET_NAME'
]

for var in required_vars:
    value = os.getenv(var)
    print(f"{var}: {'✅ 設定済み' if value else '❌ 未設定'}")
```

## ⚡ パフォーマンス

### 処理時間（目安）
- **撮影・転送**: 3-10秒
- **AI分析**: 5-15秒  
- **アメコミ風変換**: 10-30秒
- **アップロード・送信**: 2-5秒
- **合計**: 20-60秒/枚

### 最適化のポイント
- 高解像度時: `jpgbufsize_divisor=1`設定
- ネットワーク: 安定したWi-Fi環境推奨
- メモリ: 大画像処理時は十分なRAM確保

## 🔒 セキュリティ

### API Key管理
- `.env`ファイル: `.gitignore`に追加済み
- 本番環境: 環境変数で注入

### 画像データ
- ローカル: 一時保存のみ
- クラウド: Supabase暗号化ストレージ
- LINE: 一時的公開URL（期限付き）

## 📚 詳細仕様

完全な技術仕様は `spresense_system_rag.md` を参照してください。

## 🤝 開発・拡張

### 新機能追加の流れ
1. `spresense_system_rag.md` で仕様確認
2. 個別コンポーネントで機能実装
3. `integrated_photo_system.py` に統合
4. テスト・動作確認

### アーキテクチャの特徴
- **モジュラー設計**: 各機能が独立
- **エラーハンドリング**: 段階的復旧機能
- **ログ出力**: 詳細な処理状況表示

---

## 📄 ライセンス

MIT License

## 🏷️ タグ

`#Spresense` `#AI` `#Gemini` `#LINE Bot` `#画像処理` `#IoT` `#Python` `#Arduino` `#自動化`