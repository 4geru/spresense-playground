'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchImages } from '@/lib/supabase';
import { generateHashId } from '@/lib/utils';
import { ImageWithHash } from '@/lib/types';
import LiffLogin from '@/components/LiffLogin';
import { useLiff } from '@/contexts/LiffContext';
import QRCodeShare from '@/components/QRCodeShare';

export default function SlideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.file_id as string;

  const { isLoggedIn, profile, isLiffReady, error: liffError, login, shareTargetPicker, isInClient } = useLiff();
  const [images, setImages] = useState<ImageWithHash[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageWithHash | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

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

  // クライアントサイドでのみデバッグ表示を有効化
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setShowDebug(true);
    }
  }, []);

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
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Loading...</div>
          {liffError && (
            <div className="text-red-400 text-sm max-w-md mx-auto p-4 bg-red-900/20 rounded">
              <p className="font-bold mb-2">LIFF Error:</p>
              <p>{liffError}</p>
            </div>
          )}
          {!loading && !isLiffReady && !liffError && (
            <div className="text-gray-400 text-sm mt-4">
              Initializing LIFF... Please wait.
            </div>
          )}
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

  const handleShare = async () => {
    if (!isLoggedIn) {
      alert('Please login first');
      return;
    }

    setIsSharing(true);
    try {
      const botId = process.env.NEXT_PUBLIC_LINE_BOT_ID || '@YOUR_BOT_ID';
      const addFriendUrl = `https://line.me/R/ti/p/${botId}`;
      const senderName = profile?.displayName || 'あなた';

      await shareTargetPicker([
        // 1. 画像メッセージ
        {
          type: 'image',
          originalContentUrl: currentImage.url,
          previewImageUrl: currentImage.url,
        },
        // 2. FlexMessage（アプリ説明 + 友達追加）
        {
          type: 'flex',
          altText: `${senderName}さんから画像を受け取りました - Boom!ヒーロー!!`,
          contents: {
            type: 'bubble',
            hero: {
              type: 'image',
              url: `${window.location.origin}/boom-hero-intro.jpg`,
              size: 'full',
              aspectMode: 'cover',
              aspectRatio: '5:2',
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                // 1. 画像を受け取りました
                {
                  type: 'text',
                  text: `${senderName}さんから画像を受け取りました`,
                  size: 'md',
                  color: '#06C755',
                  weight: 'bold',
                  wrap: true,
                },
                // 2. Bot の説明
                {
                  type: 'box',
                  layout: 'vertical',
                  margin: 'lg',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '📸 写真を送るだけで',
                      color: '#aaaaaa',
                      size: 'sm',
                      wrap: true,
                      margin: 'md',
                    },
                    {
                      type: 'text',
                      text: '🎨 AIがアメコミ風に変換',
                      color: '#aaaaaa',
                      size: 'sm',
                      wrap: true,
                    }
                  ],
                },
                // 3. セパレーター
                {
                  type: 'separator',
                  margin: 'lg',
                },
                // 4. Bot の追加ボタン
                {
                  type: 'button',
                  style: 'primary',
                  height: 'sm',
                  action: {
                    type: 'uri',
                    label: '友達追加して使ってみる',
                    uri: addFriendUrl,
                  },
                  color: '#06C755',
                  margin: 'lg',
                },
              ],
              backgroundColor: '#16213e',
              paddingAll: 'lg',
            },
            styles: {
              body: {
                backgroundColor: '#16213e',
              },
            },
          },
        },
      ]);
    } catch (err) {
      console.error('Share failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Share failed';
      alert(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* ヘッダー */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black bg-opacity-70 text-white p-4">
        <div className="flex justify-between items-center">
          <Link href="/slides" className="hover:text-gray-300 transition text-sm">
            ← Back
          </Link>
          <div className="text-sm">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex items-center gap-2">
            {/* QRコードボタン（デスクトップのみ） */}
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="hidden md:flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition"
              title="スマホで開く"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="hidden lg:inline">QR</span>
            </button>

            {isLoggedIn && profile ? (
              <>
                <span className="text-sm hidden sm:block">{profile.displayName}</span>
                {profile.pictureUrl && (
                  <img
                    src={profile.pictureUrl}
                    alt={profile.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </>
            ) : (
              <button
                onClick={login}
                className="bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded text-sm transition"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* メイン画像 */}
      <div className="w-full min-h-screen flex items-start justify-center pt-16 pb-24 overflow-y-auto">
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className="w-full h-auto"
          style={{ maxWidth: '100%' }}
        />
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
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{currentImage.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(currentImage.created_at).toLocaleString()} · {(currentImage.size / 1024).toFixed(2)} KB
            </div>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="bg-[#06C755] hover:bg-[#05b34c] disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          )}
        </div>
      </div>

      {/* キーボードヒント */}
      <div className="fixed bottom-24 right-4 text-gray-400 text-xs hidden md:block">
        ← → to navigate · ESC to close
      </div>

      {/* デバッグ情報 (開発環境のみ) */}
      {showDebug && (
        <div className="fixed top-20 right-4 bg-gray-900/90 text-white text-xs p-3 rounded max-w-xs z-50">
          <div className="font-bold mb-2">LIFF Debug</div>
          <div>isInClient: {isInClient ? '✅ Yes' : '❌ No'}</div>
          <div>isLoggedIn: {isLoggedIn ? '✅ Yes' : '❌ No'}</div>
          <div>isLiffReady: {isLiffReady ? '✅ Yes' : '❌ No'}</div>
          {liffError && <div className="text-red-400 mt-2">Error: {liffError}</div>}
        </div>
      )}

      {/* QRコードモーダル */}
      <QRCodeShare
        hashId={fileId}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </div>
  );
}
