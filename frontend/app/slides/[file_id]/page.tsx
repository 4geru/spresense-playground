import { fetchImages } from '@/lib/supabase';
import { generateHashId } from '@/lib/utils';
import SlideDetailClientPage from './client';
import { ImageWithHash } from '@/lib/types';

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

async function getImages(): Promise<ImageWithHash[]> {
    const data = await fetchImages();
    const imagesWithHash = data.map(img => ({
      ...img,
      hashId: generateHashId(img.name)
    }));
    return imagesWithHash;
}


export default async function SlideDetailPage({ params }: { params: { file_id: string } }) {
  const { file_id } = params;
  const allImages = await getImages();

  return <SlideDetailClientPage allImages={allImages} fileId={file_id} />;
}
