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

/**
 * オリジナルとアメコミ風の両方の画像をアップロード
 *
 * @param supabase - Supabaseクライアント
 * @param bucketName - バケット名
 * @param originalData - オリジナル画像データ（base64）
 * @param comicData - アメコミ風画像データ（base64）
 * @param mimeType - MIMEタイプ
 * @returns {originalUrl, comicUrl} のオブジェクト
 */
export async function uploadBothImages(
  supabase: SupabaseClient,
  bucketName: string,
  originalData: string,
  comicData: string,
  mimeType: string
): Promise<{ originalUrl: string; comicUrl: string } | null> {
  try {
    console.log("📦 画像を2枚アップロード中...");

    // オリジナル画像をアップロード
    const originalUrl = await uploadImage(
      supabase,
      bucketName,
      originalData,
      mimeType,
      "original"
    );

    if (!originalUrl) {
      console.error("❌ オリジナル画像のアップロードに失敗");
      return null;
    }

    // アメコミ風画像をアップロード（PNGとして保存）
    const comicUrl = await uploadImage(
      supabase,
      bucketName,
      comicData,
      "image/png", // アメコミ風変換後はPNG
      "comic"
    );

    if (!comicUrl) {
      console.error("❌ アメコミ風画像のアップロードに失敗");
      return null;
    }

    console.log("🎉 両方の画像のアップロード完了！");

    return {
      originalUrl,
      comicUrl,
    };
  } catch (error) {
    console.error("❌ 画像アップロード処理エラー:", error);
    return null;
  }
}

/**
 * オリジナル画像のみをアップロード（条件不一致時）
 *
 * @param supabase - Supabaseクライアント
 * @param bucketName - バケット名
 * @param originalData - オリジナル画像データ（base64）
 * @param mimeType - MIMEタイプ
 * @returns 公開URL
 */
export async function uploadOriginalOnly(
  supabase: SupabaseClient,
  bucketName: string,
  originalData: string,
  mimeType: string
): Promise<string | null> {
  console.log("📦 オリジナル画像のみアップロード中...");

  return await uploadImage(
    supabase,
    bucketName,
    originalData,
    mimeType,
    "original"
  );
}
