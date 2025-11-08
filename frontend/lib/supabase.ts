import { ImageData } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabaseから全画像を取得
 */
export async function fetchImages(): Promise<ImageData[]> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/get-original-images`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    cache: 'no-store', // 常に最新データを取得
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.success && result.images) {
    return result.images.map((image: any) => ({
      name: image.name,
      url: image.url,
      created_at: image.created_at,
      size: image.size
    }));
  }

  throw new Error(result.error || 'No images returned from Edge Function');
}
