'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchImages } from '@/lib/supabase';
import { generateHashId } from '@/lib/utils';
import { ImageWithHash } from '@/lib/types';
import { useLiff } from '@/contexts/LiffContext';
import { QRCodeSVG } from 'qrcode.react';
import { LINE_COLORS, API_ENDPOINTS, UI_CONSTANTS, FLEX_MESSAGE, MESSAGE_TEMPLATES } from '@/lib/constants';
import Toast from '@/components/Toast';

export default function SlideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params ? (params.file_id as string) : '';

  const { isLoggedIn, profile, isLiffReady, error: liffError, login, shareTargetPicker, isSharetargetPickerAvailable } = useLiff();
  const [images, setImages] = useState<ImageWithHash[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageWithHash | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      setError('File ID not found in URL.');
      return;
    }

    async function loadImages() {
      try {
        const data = await fetchImages();
        const imagesWithHash = data.map(img => ({
          ...img,
          hashId: generateHashId(img.name)
        }));

        setImages(imagesWithHash);

        const index = imagesWithHash.findIndex(img => img.hashId === fileId);
        if (index === -1) {
          setError('Image not found');
        } else {
          setCurrentImage(imagesWithHash[index]);
          setCurrentIndex(index);
        }
      } catch (err) {
        console.error('Error loading images:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
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

  // Keyboard navigation
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
  }, [currentIndex, images, goToNext, goToPrevious, router]);

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
      setToast({ message: 'Please login first', type: 'error' });
      return;
    }

    setIsSharing(true);
    try {
      const senderName = profile?.displayName || 'あなた';

      // LIFF URL を生成
      const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/${fileId}`;

      // LINE共有URL を生成
      const shareText = `🦸 ${senderName}さんから、ヒーロー写真が届いたよ！

カッコよく変身した姿を見てみよう💥

${liffUrl}
${MESSAGE_TEMPLATES.SHARE_CALL_TO_ACTION}
${MESSAGE_TEMPLATES.SAFETY_NOTICE}`;
      const shareUrl = `${API_ENDPOINTS.LINE_SHARE}?text=${encodeURIComponent(shareText)}`;

      await shareTargetPicker([
        // 1. 画像メッセージ
        {
          type: 'image',
          originalContentUrl: currentImage.url,
          previewImageUrl: currentImage.url,
        },
        // 2. FlexMessage（画像共有 + スライドショーリンク + 友達追加）
        {
          type: 'flex',
          altText: `${senderName}さんから画像を受け取りました - ${MESSAGE_TEMPLATES.BRAND_NAME}`,
          contents: {
            type: 'bubble',
            hero: {
              type: 'image',
              url: currentImage.url,
              size: FLEX_MESSAGE.IMAGE_SIZE,
              aspectMode: FLEX_MESSAGE.ASPECT_MODE,
              aspectRatio: FLEX_MESSAGE.ASPECT_RATIO,
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: FLEX_MESSAGE.HERO_TITLE,
                  size: FLEX_MESSAGE.TITLE_SIZE,
                  color: LINE_COLORS.GREEN_600,
                  weight: 'bold',
                  wrap: true,
                },
                {
                  type: "separator",
                  margin: "md",
                },
                {
                  type: 'text',
                  text: `${senderName}さんから画像を受け取りました`,
                  size: FLEX_MESSAGE.TEXT_SIZE_SM,
                  color: LINE_COLORS.GRAY_400,
                  margin: 'md',
                  wrap: true,
                },
              ],
              backgroundColor: LINE_COLORS.DARK_BG,
              paddingAll: 'lg',
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              spacing: 'sm',
              contents: [
                {
                  type: 'button',
                  style: 'primary',
                  action: {
                    type: 'uri',
                    label: FLEX_MESSAGE.BUTTON_PRIMARY_LABEL,
                    uri: liffUrl,
                  },
                  color: LINE_COLORS.GREEN_600,
                },
                {
                  type: 'button',
                  style: 'secondary',
                  action: {
                    type: 'uri',
                    label: FLEX_MESSAGE.BUTTON_SHARE_LABEL,
                    uri: shareUrl,
                  },
                },
              ],
              backgroundColor: LINE_COLORS.DARK_BG,
            },
            styles: {
              body: {
                backgroundColor: LINE_COLORS.DARK_BG,
              },
              footer: {
                backgroundColor: LINE_COLORS.DARK_BG,
              },
            },
          },
        },
      ]);
    } catch (err) {
      console.error('Share failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Share failed';
      setToast({ message: errorMessage, type: 'error' });
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
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{currentImage.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(currentImage.created_at).toLocaleString()} · {(currentImage.size / 1024).toFixed(2)} KB
            </div>
          </div>
          {isLoggedIn && isSharetargetPickerAvailable && (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="bg-[#06C755] hover:bg-[#05b34c] disabled:bg-gray-600 disabled:hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition flex items-center gap-2 whitespace-nowrap"
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

      {/* QRコード常時表示（デスクトップのみ） */}
      <div className="hidden md:block fixed top-20 right-4 z-40">
        <div className="bg-white p-3 rounded-lg shadow-2xl border-2 border-gray-700">
          <QRCodeSVG
            value={`${API_ENDPOINTS.LINE_OA_MESSAGE}/${process.env.NEXT_PUBLIC_LINE_BOT_ID || '@YOUR_BOT_ID'}/?${encodeURIComponent(`Codename:${fileId}`)}`}
            size={UI_CONSTANTS.QR_CODE_SIZE_SMALL}
            level={UI_CONSTANTS.QR_CODE_ERROR_CORRECTION_LEVEL}
            includeMargin={false}
          />
          <p className="text-xs text-center text-gray-600 mt-2">{MESSAGE_TEMPLATES.QR_SCAN_INSTRUCTION}</p>
        </div>
      </div>

      {/* Toast通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
