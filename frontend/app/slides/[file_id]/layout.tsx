import { fetchImages } from '@/lib/supabase';
import { generateHashId } from '@/lib/utils';

export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const images = await fetchImages();
    return images.map((image) => ({
      file_id: generateHashId(image.name),
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

export default function SlideDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
