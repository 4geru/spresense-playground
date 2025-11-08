'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchImages } from '@/lib/supabase';
import { generateHashId } from '@/lib/utils';
import { ImageWithHash } from '@/lib/types';
import LiffLogin from '@/components/LiffLogin';
import { useLiff } from '@/hooks/useLiff';

export default function SlideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.file_id as string;

  const { isLoggedIn, profile, isLiffReady } = useLiff();
  const [images, setImages] = useState<ImageWithHash[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageWithHash | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadImages() {
      try {
        const data = await fetchImages();
        const imagesWithHash = data.map(img => ({
          ...img,
          hashId: generateHashId(img.name)
        }));

        setImages(imagesWithHash);

        // 現在の画像を検索
        const index = imagesWithHash.findIndex(img => img.hashId === fileId);
        if (index === -1) {
          setError('Image not found');
          setLoading(false);
          return;
        }

        setCurrentImage(imagesWithHash[index]);
        setCurrentIndex(index);
        setLoading(false);
      } catch (err) {
        console.error('Error loading images:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images');
        setLoading(false);
      }
    }

    loadImages();
  }, [fileId]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevImage = images[currentIndex - 1];
      router.push(`/slides/${prevImage.hashId}`);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      const nextImage = images[currentIndex + 1];
      router.push(`/slides/${nextImage.hashId}`);
    }
  };

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        router.push('/slides');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images]);

  if (loading || !isLiffReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // LIFF login required
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="max-w-md w-full">
          <LiffLogin showProfile={false} />
        </div>
      </div>
    );
  }

  if (error || !currentImage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-red-400 text-xl text-center">
          <p>{error || 'Image not found'}</p>
          <Link href="/slides" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
            ← Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* ヘッダー */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black bg-opacity-70 text-white p-4">
        <div className="flex justify-between items-center">
          <Link href="/slides" className="hover:text-gray-300 transition">
            ← Back to Gallery
          </Link>
          <div className="text-sm">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-2">
                {profile.pictureUrl && (
                  <img
                    src={profile.pictureUrl}
                    alt={profile.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm hidden md:block">{profile.displayName}</span>
              </div>
            )}
            <Link href="/" className="hover:text-gray-300 transition">
              Slideshow
            </Link>
          </div>
        </div>
      </div>

      {/* メイン画像 */}
      <div className="w-full h-full flex items-center justify-center pt-16 pb-24">
        <div className="relative w-full h-full">
          <Image
            src={currentImage.url}
            alt={currentImage.name}
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* ナビゲーションボタン */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="fixed left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition"
          aria-label="Previous image"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={goToNext}
          className="fixed right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition"
          aria-label="Next image"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* フッター */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-black bg-opacity-70 text-white p-4">
        <div className="text-sm truncate">{currentImage.name}</div>
        <div className="text-xs text-gray-400 mt-1">
          {new Date(currentImage.created_at).toLocaleString()} · {(currentImage.size / 1024).toFixed(2)} KB
        </div>
      </div>

      {/* キーボードヒント */}
      <div className="fixed bottom-20 right-4 text-gray-400 text-xs">
        ← → to navigate · ESC to close
      </div>
    </div>
  );
}
