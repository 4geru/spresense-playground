/**
 * Supabase Storage処理モジュール
 *
 * 機能:
 * - 画像のアップロード
 * - 公開URLの取得
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
