/**
 * ファイル名から安定したハッシュIDを生成
 * 同じファイル名なら常に同じハッシュIDが生成される
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
 * ハッシュIDから対応する画像を検索
 */
export function findImageByHashId(images: { name: string; [key: string]: any }[], hashId: string) {
  return images.find(img => generateHashId(img.name) === hashId);
}

/**
 * Supabaseの画像URLをサムネイル用に変換
 * 画像変換APIを使用してサムネイルを取得
 */
export function getThumbnailUrl(originalUrl: string, width: number = 400, height: number = 400): string {
  // まず元のURLをそのまま返す（画像変換APIが使えない場合）
  // TODO: Supabase画像変換APIが有効な場合は以下のコードを使用
  /*
  const url = originalUrl.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  return `${url}?width=${width}&height=${height}&resize=cover&quality=80`;
  */

  // 一時的に元のURLを返す
  return originalUrl;
}
