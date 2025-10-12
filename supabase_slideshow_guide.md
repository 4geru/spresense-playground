# Supabase Edge Function + GitHub Pages 画像スライドショー構築ガイド

## はじめに

Sony Spresenseで撮影した画像を、Supabase Edge FunctionとGitHub Pagesを使用してスライドショー表示するシステムの構築方法を解説します。

この記事では、**Supabase Edge Function + GitHub Pages + 自動画像ローテーション**を実現する完全なシステムを構築します。

**こんな方におすすめ：**
- Spresenseで撮影した画像を自動でスライドショー表示したい
- Supabase Edge Functionを活用したい
- GitHub Pagesでホスティングを学びたい
- 画像ギャラリーシステムを作りたい

## TL;DR（結論）

**システム構成**: Supabase Storage → Edge Function → GitHub Pages → スライドショー  
**画像フィルタ**: `original_capture` を含むファイルのみ自動検出  
**表示方式**: 10-30秒間隔でランダム切り替え

```bash
# プロジェクトセットアップ
supabase init
supabase functions deploy get-original-images
git push origin main
```

## 環境・使用サービス

```
【クラウドサービス】
- Supabase (Storage + Edge Functions)
- GitHub Pages (ホスティング)

【ローカル開発環境】
- Supabase CLI
- Git/GitHub
- VS Code / エディタ

【対象画像】
- ファイル名に "original_capture" を含む画像
- 形式: JPG, PNG, GIF, WebP
```

## システム概要

### 🔄 動作フロー

1. **画像保存**: SpresenseからSupabase Storageに画像アップロード
2. **Edge Function**: `original_capture` を含む画像のURLリストを取得
3. **GitHub Pages**: スライドショーページでEdge Functionを呼び出し
4. **自動表示**: 10-30秒間隔でランダムに画像を切り替え

### 📡 システム構成

```
Supabase Storage (画像保管)
    ↓
Edge Function (画像リスト取得)
    ↓ HTTPS API
GitHub Pages (スライドショーページ)
    ↓ JavaScript
ブラウザ (フルスクリーン表示)
```

## Supabase Edge Function実装

### ディレクトリ構造

```
supabase/
├── config.toml
└── functions/
    └── get-original-images/
        └── index.ts
```

### Edge Function: `supabase/functions/get-original-images/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with Service Role Key (RLS回避)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const bucketName = 'line-images'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // List files from storage bucket
    const { data: files, error } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        offset: 0,
      })

    if (error) {
      console.error('Storage list error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch files', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Total files in bucket: ${files?.length || 0}`)
    files?.forEach((file, index) => {
      console.log(`File ${index + 1}: ${file.name}`)
    })

    // Filter files containing "original_capture" and are image files
    const originalImages = files
      ?.filter(file => {
        const hasOriginalCapture = file.name.includes('original');
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
        console.log(`File: ${file.name}, hasOriginalCapture: ${hasOriginalCapture}, isImage: ${isImage}`);
        return hasOriginalCapture && isImage;
      })
      .map(file => {
        // Get public URL for each image
        const { data: urlData } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(file.name)
        
        return {
          name: file.name,
          url: urlData.publicUrl,
          created_at: file.created_at,
          updated_at: file.updated_at,
          size: file.metadata?.size
        }
      }) || []

    console.log(`Found ${originalImages.length} original comic capture images`)
    
    // Sort by creation date (newest first)
    originalImages.sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )

    // Return all files for debugging if no filtered images found
    const debugInfo = originalImages.length === 0 ? {
      totalFiles: files?.length || 0,
      allFiles: files?.map(f => f.name) || []
    } : {};

    return new Response(
      JSON.stringify({
        success: true,
        count: originalImages.length,
        images: originalImages,
        debug: debugInfo
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
```

### Supabase設定: `supabase/config.toml`

```toml
project_id = "spresense-project"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "http://localhost:54321"

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true

[edge_functions]
enabled = true
```

## GitHub Pages スライドショー実装

### HTML: `slideshow.html`

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spresense Gallery</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #000;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        
        .slideshow-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .slide {
            display: none;
            width: 100%;
            height: 100%;
        }
        
        .slide.active {
            display: block;
        }
        
        .slide img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: center;
        }
        
        .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 24px;
            z-index: 1000;
        }
        
        .error {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff6b6b;
            font-size: 20px;
            text-align: center;
            z-index: 1000;
        }
        
        .fade {
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        
        .fade.show {
            opacity: 1;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">Loading images...</div>
    <div class="error" id="error" style="display: none;">
        <p>Failed to load images from Supabase</p>
        <p>Please check your connection and configuration</p>
    </div>
    
    <div class="slideshow-container" id="slideshow" style="display: none;">
        <!-- Images will be dynamically inserted here -->
    </div>

    <script>
        // Supabase configuration embedded directly
        const SUPABASE_CONFIG = {
            url: 'https://fyxftmwypdfuierggfqw.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eGZ0bXd5cGRmdWllcmdnZnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDg3MDksImV4cCI6MjA3NTc4NDcwOX0.ntddVBznlCvmX2HebGFDkI8VpPzHHxKCmOzLXhKVZnI',
            bucketName: 'line-images'
        };

        class SupabaseSlideshow {
            constructor() {
                this.images = [];
                this.currentIndex = 0;
                this.slideInterval = null;
                this.supabaseUrl = SUPABASE_CONFIG.url;
                this.supabaseKey = SUPABASE_CONFIG.anonKey;
                this.bucketName = SUPABASE_CONFIG.bucketName;
                
                this.init();
            }
            
            async init() {
                try {
                    // Check configuration
                    if (!this.supabaseUrl || !this.supabaseKey || !this.bucketName) {
                        console.error('Missing Supabase configuration:', {
                            url: !!this.supabaseUrl,
                            key: !!this.supabaseKey,
                            bucket: !!this.bucketName
                        });
                        this.showError('Supabase configuration missing. Please update config.js with your credentials.');
                        return;
                    }
                    
                    console.log('Loading images from Edge Function');
                    await this.loadImages();
                    
                    if (this.images.length > 0) {
                        console.log(`Found ${this.images.length} images`);
                        this.createSlides();
                        this.startSlideshow();
                        this.hideLoading();
                    } else {
                        this.showError('No images found with "original_capture" in filename');
                    }
                } catch (error) {
                    console.error('Initialization error:', error);
                    this.showError(`Failed to initialize slideshow: ${error.message}`);
                }
            }
            
            async loadImages() {
                try {
                    console.log('Fetching from Edge Function: get-original-images');
                    
                    const response = await fetch(`${this.supabaseUrl}/functions/v1/get-original-images`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${this.supabaseKey}`,
                            'apikey': this.supabaseKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Edge Function Error Response:', errorText);
                        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                    }
                    
                    const result = await response.json();
                    console.log('Edge Function response:', result);
                    
                    if (result.success && result.images) {
                        this.images = result.images.map(image => ({
                            name: image.name,
                            url: image.url
                        }));
                        
                        console.log(`Found ${this.images.length} original capture images`);
                        this.images.forEach((image, index) => {
                            console.log(`${index + 1}. ${image.name} - ${image.url}`);
                        });
                    } else {
                        throw new Error(result.error || 'No images returned from Edge Function');
                    }
                } catch (error) {
                    console.error('Error loading images:', error);
                    throw error;
                }
            }
            
            createSlides() {
                const slideshow = document.getElementById('slideshow');
                slideshow.innerHTML = '';
                
                this.images.forEach((image, index) => {
                    const slide = document.createElement('div');
                    slide.className = 'slide fade';
                    if (index === 0) slide.classList.add('active', 'show');
                    
                    const img = document.createElement('img');
                    img.src = image.url;
                    img.alt = image.name;
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${image.name}`);
                        slide.style.display = 'none';
                    };
                    
                    slide.appendChild(img);
                    slideshow.appendChild(slide);
                });
            }
            
            nextSlide() {
                if (this.images.length === 0) return;
                
                const slides = document.querySelectorAll('.slide');
                const currentSlide = slides[this.currentIndex];
                
                // Fade out current slide
                currentSlide.classList.remove('show');
                
                setTimeout(() => {
                    currentSlide.classList.remove('active');
                    
                    // Move to next slide (random selection)
                    let nextIndex;
                    if (this.images.length > 1) {
                        do {
                            nextIndex = Math.floor(Math.random() * this.images.length);
                        } while (nextIndex === this.currentIndex);
                    } else {
                        nextIndex = 0;
                    }
                    
                    this.currentIndex = nextIndex;
                    const nextSlide = slides[this.currentIndex];
                    
                    nextSlide.classList.add('active');
                    
                    // Fade in next slide
                    setTimeout(() => {
                        nextSlide.classList.add('show');
                    }, 50);
                    
                }, 250);
            }
            
            startSlideshow() {
                if (this.images.length <= 1) return;
                
                const getRandomInterval = () => {
                    return Math.floor(Math.random() * 20000) + 10000; // 10-30 seconds
                };
                
                const scheduleNext = () => {
                    const interval = getRandomInterval();
                    console.log(`Next slide in ${interval/1000} seconds`);
                    
                    this.slideInterval = setTimeout(() => {
                        this.nextSlide();
                        scheduleNext();
                    }, interval);
                };
                
                scheduleNext();
            }
            
            hideLoading() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('slideshow').style.display = 'block';
            }
            
            showError(message) {
                document.getElementById('loading').style.display = 'none';
                const errorDiv = document.getElementById('error');
                errorDiv.innerHTML = `<p>${message}</p>`;
                errorDiv.style.display = 'block';
            }
        }
        
        // Initialize slideshow when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new SupabaseSlideshow();
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden, pausing slideshow');
            } else {
                console.log('Page visible, resuming slideshow');
            }
        });
    </script>
</body>
</html>
```

### GitHub Actions ワークフロー: `.github/workflows/pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Pages
        uses: actions/configure-pages@v3
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 🛠️ セットアップ手順

### Step 1: Supabase プロジェクト準備

1. **Supabaseアカウント・プロジェクト作成**
   - https://supabase.com/

2. **ストレージバケット作成**
   ```sql
   -- Storage > Create bucket
   Bucket name: line-images
   Public bucket: true
   ```

3. **RLS (Row Level Security) 対策**
   - Edge FunctionではService Role Keyを使用
   - ブラウザからはAnon Keyを使用

### Step 2: Supabase CLI セットアップ

1. **Supabase CLI インストール**
   ```bash
   npm install -g supabase
   ```

2. **ログイン**
   ```bash
   # Personal Access Tokenを取得
   # https://supabase.com/dashboard/account/tokens
   export SUPABASE_ACCESS_TOKEN=your_access_token_here
   supabase login
   ```

3. **プロジェクトにリンク**
   ```bash
   supabase link --project-ref your_project_id
   ```

### Step 3: Edge Function デプロイ

1. **Edge Function デプロイ**
   ```bash
   supabase functions deploy get-original-images
   ```

2. **動作確認**
   ```bash
   curl "https://your-project.supabase.co/functions/v1/get-original-images" \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

### Step 4: GitHub Pages セットアップ

1. **GitHub リポジトリ作成・プッシュ**
   ```bash
   git add slideshow.html .github/
   git commit -m "Add Supabase slideshow with GitHub Pages"
   git push origin main
   ```

2. **GitHub Pages 有効化**
   - Repository Settings > Pages
   - Source: "GitHub Actions" を選択

3. **アクセス確認**
   - `https://username.github.io/repository-name/slideshow.html`

## 🎯 重要なポイント

### 1. RLS (Row Level Security) 対策

**問題**: ブラウザからSupabase StorageのAPIを直接呼び出すとRLSで弾かれる

**解決**: Edge FunctionでService Role Keyを使用

```typescript
// Edge Function内でService Role Key使用
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

### 2. CORS 対応

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### 3. 画像フィルタリング

```typescript
// "original" を含む画像ファイルのみ
const hasOriginalCapture = file.name.includes('original');
const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
```

### 4. ランダム表示

```javascript
// 10-30秒間隔でランダム切り替え
const getRandomInterval = () => {
    return Math.floor(Math.random() * 20000) + 10000; // 10-30 seconds
};
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

| 症状 | 原因 | 解決方法 |
|------|------|----------|
| `Edge Function Error: 400` | RLS有効でファイルリスト取得失敗 | Service Role Key使用 |
| `count: 0, images: []` | フィルタリング条件が厳しい | フィルタ条件を緩和 |
| `Failed to initialize slideshow` | Supabase設定不足 | 設定値を再確認 |
| GitHub Pagesで404 | ワークフロー失敗 | Actions タブで確認 |

### デバッグコマンド

```bash
# Edge Function ログ確認
supabase functions logs get-original-images

# Edge Function テスト
curl "https://your-project.supabase.co/functions/v1/get-original-images" \
  -H "Authorization: Bearer YOUR_ANON_KEY" | jq

# GitHub Actions 状況確認
gh run list --repo username/repository-name
```

## 🌟 応用・拡張アイデア

### 1. フィルタリング条件カスタマイズ

```typescript
// 複数条件での画像フィルタリング
const originalImages = files
  ?.filter(file => {
    const hasOriginal = file.name.includes('original_capture');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
    const isRecent = new Date(file.created_at) > new Date('2024-01-01');
    return hasOriginal && isImage && isRecent;
  })
```

### 2. 画像メタデータ表示

```javascript
// 画像情報のオーバーレイ表示
const overlay = document.createElement('div');
overlay.innerHTML = `
    <div class="image-info">
        <p>📸 ${image.name}</p>
        <p>📅 ${new Date(image.created_at).toLocaleString()}</p>
        <p>📏 ${(image.size / 1024).toFixed(1)} KB</p>
    </div>
`;
```

### 3. 複数バケット対応

```typescript
// 複数バケットから画像取得
const buckets = ['line-images', 'backup-images', 'archive'];
const allImages = [];

for (const bucket of buckets) {
    const { data: files } = await supabase.storage.from(bucket).list('');
    allImages.push(...files);
}
```

### 4. リアルタイム更新

```javascript
// Supabase Realtime で新規画像を自動検出
const subscription = supabase
    .channel('storage-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'storage' }, (payload) => {
        console.log('New image uploaded:', payload);
        this.loadImages(); // 画像リストを再読み込み
    })
    .subscribe();
```

## 📚 参考資料・関連リンク

### 公式ドキュメント
- 📖 [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- 🔧 [Supabase Storage](https://supabase.com/docs/guides/storage)
- 🚀 [GitHub Pages](https://docs.github.com/pages)

### 関連技術
- 📡 [Deno Runtime](https://deno.land/)
- 🖼️ [JavaScript Fetch API](https://developer.mozilla.org/docs/Web/API/Fetch_API)
- ⚙️ [GitHub Actions](https://github.com/features/actions)

## 🎪 実際の活用例

**このシステムが活かせるプロジェクト：**
- 🏠 **IoT画像モニタリング** - センサー画像の自動表示
- 🌱 **植物成長記録** - タイムラプス風自動更新
- 🔬 **研究データ可視化** - 実験画像の連続表示
- 📷 **ペット見守りギャラリー** - リアルタイム画像表示
- 🏭 **製造業監視システム** - 品質管理画像の循環表示

## 🏷️ タグ
`#Supabase` `#Edge Functions` `#GitHub Pages` `#画像スライドショー` `#JavaScript` `#TypeScript` `#Deno` `#自動化` `#IoT`

---

この記事が、Supabase Edge FunctionとGitHub Pagesを使った画像スライドショーシステム開発の参考になれば幸いです！質問やコメントがあれば、お気軽にお寄せください。

**🔄 更新履歴**
- 2024/10/12: 初回公開
- 2024/10/12: RLS対策とService Role Key使用方法を詳細化
- 2024/10/12: GitHub Actions ワークフローとトラブルシューティングを追加