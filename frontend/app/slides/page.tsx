'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchImages } from '@/lib/supabase';
import { generateHashId, getThumbnailUrl } from '@/lib/utils';
import { ImageWithHash } from '@/lib/types';
import { useLiff } from '@/contexts/LiffContext';

// スケルトンローダーコンポーネント
function ImageSkeleton() {
  return (
    <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden animate-pulse">
      <div className="w-full h-full bg-gray-800"></div>
    </div>
  );
}

export default function SlidesPage() {
  const { isLoggedIn, profile, isLiffReady, login } = useLiff();
  const [images, setImages] = useState<ImageWithHash[]>([]);
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

        // 新しい順にソート
        imagesWithHash.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setImages(imagesWithHash);
        setLoading(false);
      } catch (err) {
        console.error('Error loading images:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images');
        setLoading(false);
      }
    }

    loadImages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="sticky top-0 z-10 bg-black bg-opacity-90 backdrop-blur border-b border-gray-800">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Gallery</h1>
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition hidden md:block"
              >
                Slideshow
              </Link>
              {isLiffReady && (
                <>
                  {isLoggedIn && profile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm hidden sm:block">{profile.displayName}</span>
                      {profile.pictureUrl && (
                        <img
                          src={profile.pictureUrl}
                          alt={profile.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={login}
                      className="bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded text-sm transition"
                    >
                      Login
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <ImageSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="sticky top-0 z-10 bg-black bg-opacity-90 backdrop-blur border-b border-gray-800">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Gallery</h1>
              <p className="text-sm text-gray-400">Error</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition hidden md:block"
              >
                Slideshow
              </Link>
              {isLiffReady && (
                <>
                  {isLoggedIn && profile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm hidden sm:block">{profile.displayName}</span>
                      {profile.pictureUrl && (
                        <img
                          src={profile.pictureUrl}
                          alt={profile.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={login}
                      className="bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded text-sm transition"
                    >
                      Login
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-red-400 text-xl text-center">
            <p>Failed to load images</p>
            <p className="mt-4 text-sm">{error}</p>
            <Link href="/" className="mt-6 inline-block text-blue-400 hover:text-blue-300">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-black bg-opacity-90 backdrop-blur border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gallery</h1>
            <p className="text-sm text-gray-400">{images.length} images</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition hidden md:block"
            >
              Slideshow
            </Link>
            {isLiffReady && (
              <>
                {isLoggedIn && profile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm hidden sm:block">{profile.displayName}</span>
                    {profile.pictureUrl && (
                      <img
                        src={profile.pictureUrl}
                        alt={profile.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                  </div>
                ) : (
                  <button
                    onClick={login}
                    className="bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded text-sm transition"
                  >
                    Login
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* 画像グリッド */}
      <main className="container mx-auto px-4 py-8">
        {images.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p className="text-xl">No images found</p>
            <p className="mt-2">Upload some images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image, index) => {
              const isPriority = index < 8;

              return (
                <Link
                  key={image.hashId}
                  href={`/slides/${image.hashId}`}
                  className="group block bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                >
                  <div className="relative" style={{ aspectRatio: '1 / 1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.name}
                      loading={isPriority ? 'eager' : 'lazy'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      className="group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* オーバーレイ */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium truncate">{image.name}</p>
                        <p className="text-gray-300 text-xs mt-1">
                          {new Date(image.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
