import { ImageData } from './types';

const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabaseから全画像を取得
 */
export async function fetchImages(): Promise<ImageData[]> {
  const supabaseUrl = projectId ? `https://${projectId}.supabase.co/functions/v1/get-original-images` : null;
  console.log('Supabase URL:', supabaseUrl);
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
