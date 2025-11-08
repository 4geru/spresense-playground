/**
 * Supabase Storage処理モジュール
 *
 * 機能:
 * - 画像のアップロード
 * - 公開URLの取得
 * - hashIdによる画像検索
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Base64データをUint8Arrayに変換
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * MIMEタイプから拡張子を取得
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: { [key: string]: string } = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };

  return mimeMap[mimeType] || "jpg";
}

/**
 * ファイル名から安定したハッシュIDを生成（フロントエンドと同じロジック）
 */
export function generateHashId(fileName: string): string {
  let hash = 0;
  for (let i = 0; i < fileName.length; i++) {
    const char = fileName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // 絶対値を取って16進数に変換（9文字）
  return Math.abs(hash).toString(16).padStart(9, '0').substring(0, 9);
}

/**
 * hashIdから画像を検索
 *
 * @param supabase - Supabaseクライアント
 * @param bucketName - バケット名
 * @param hashId - 検索するハッシュID
 * @returns 画像情報（名前、URL、hashId）または null
 */
export async function findImageByHashId(
  supabase: SupabaseClient,
  bucketName: string,
  hashId: string
): Promise<{ name: string; url: string; hashId: string } | null> {
  try {
    console.log(`🔍 hashIdで画像を検索中: ${hashId}`);

    // バケット内の全ファイルを取得
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list();

    if (error) {
      console.error("❌ ファイルリスト取得エラー:", error);
      return null;
    }

    // _original_ を含むファイルのみをフィルタリング
    const originalFiles = files.filter(f => f.name.includes('_original'));

    console.log(`📁 検索対象ファイル数: ${originalFiles.length}`);

    // hashIdが一致するファイルを検索
    for (const file of originalFiles) {
      const fileHashId = generateHashId(file.name);

      if (fileHashId === hashId) {
        // 公開URLを取得
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(file.name);

        console.log(`✅ 画像が見つかりました: ${file.name}`);

        return {
          name: file.name,
          url: urlData.publicUrl,
          hashId: fileHashId
        };
      }
    }

    console.log(`❌ hashId ${hashId} に一致する画像が見つかりませんでした`);
    return null;
  } catch (error) {
    console.error("❌ 画像検索エラー:", error);
    return null;
  }
}

/**
 * 画像をSupabase Storageにアップロード
 *
 * @param supabase - Supabaseクライアント
 * @param bucketName - バケット名
 * @param imageData - 画像データ（base64）
 * @param mimeType - MIMEタイプ
 * @param prefix - ファイル名プレフィックス（"original" or "comic"）
 * @returns アップロードされた画像の公開URL
 */
export async function uploadImage(
  supabase: SupabaseClient,
  bucketName: string,
  imageData: string,
  mimeType: string,
  prefix: string
): Promise<string | null> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = getExtensionFromMimeType(mimeType);
    const fileName = `${timestamp}_${prefix}.${extension}`;

    console.log(`📤 Supabase Storageにアップロード中... (${fileName})`);

    // Base64をUint8Arrayに変換
    const uint8Array = base64ToUint8Array(imageData);

    // Storageにアップロード
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error(`❌ アップロードエラー (${prefix}):`, error);
      return null;
    }

    console.log(`✅ アップロード成功: ${data.path}`);

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log(`🔗 公開URL: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error(`❌ アップロード処理エラー (${prefix}):`, error);
    return null;
  }
}
