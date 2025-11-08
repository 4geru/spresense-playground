'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface ImageData {
  name: string;
  url: string;
  created_at: string;
  size: number;
}

export default function SlideshowPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [lastImageCount, setLastImageCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 画像を読み込む
  const loadImages = useCallback(async () => {
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/get-original-images`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success && result.images) {
        const imageList = result.images.map((image: any) => ({
          name: image.name,
          url: image.url,
          created_at: image.created_at,
          size: image.size
        }));

        setImages(imageList);
        setLastImageCount(imageList.length);

        if (imageList.length > 0) {
          setCurrentIndex(Math.floor(Math.random() * imageList.length));
          setLoading(false);
        } else {
          throw new Error('No images found with "original_capture" in filename');
        }
      } else {
        throw new Error(result.error || 'No images returned from Edge Function');
      }
    } catch (err) {
      console.error('Error loading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
      setLoading(false);
    }
  }, [supabaseUrl, supabaseKey]);

  // 新しい画像をチェック
  const checkForNewImages = useCallback(async () => {
    try {
      if (!supabaseUrl || !supabaseKey) return;

      const response = await fetch(`${supabaseUrl}/functions/v1/get-original-images`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return;

      const result = await response.json();

      if (result.success && result.images) {
        const newImageCount = result.images.length;

        if (newImageCount > lastImageCount) {
          console.log(`🆕 New images detected! ${lastImageCount} → ${newImageCount}`);

          const imageList = result.images.map((image: any) => ({
            name: image.name,
            url: image.url,
            created_at: image.created_at,
            size: image.size
          }));

          setImages(imageList);
          setLastImageCount(newImageCount);
          setCurrentIndex(Math.floor(Math.random() * imageList.length));

          setNotification(`🆕 ${newImageCount - lastImageCount} new image${newImageCount - lastImageCount > 1 ? 's' : ''} detected!`);
          setTimeout(() => setNotification(null), 3000);
        }
      }
    } catch (err) {
      console.error('Error checking for new images:', err);
    }
  }, [supabaseUrl, supabaseKey, lastImageCount]);

  // 次の画像に移動
  const nextImage = useCallback(() => {
    if (images.length === 0) return;

    let nextIndex;
    if (images.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * images.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = 0;
    }

    setCurrentIndex(nextIndex);
  }, [images.length, currentIndex]);

  // 初期読み込み
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // スライドショー
  useEffect(() => {
    if (images.length <= 1) return;

    const getRandomInterval = () => Math.floor(Math.random() * 1000) + 2000; // 2-3秒

    const scheduleNext = () => {
      const interval = getRandomInterval();
      const timer = setTimeout(() => {
        nextImage();
      }, interval);
      return timer;
    };

    const timer = scheduleNext();
    return () => clearTimeout(timer);
  }, [images.length, nextImage, currentIndex]);

  // 自動リフレッシュ（30秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewImages();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkForNewImages]);

  // 時刻更新
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white text-2xl">Loading images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-red-400 text-xl text-center">
          <p>Failed to load images from Supabase</p>
          <p className="mt-2">Please check your connection and configuration</p>
          <p className="mt-4 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* 通知 */}
      {notification && (
        <div className="fixed top-5 right-5 bg-green-500 bg-opacity-90 text-white px-5 py-4 rounded-lg text-base z-[2000] shadow-lg animate-slide-in">
          {notification}
        </div>
      )}

      {/* ステータスインジケーター */}
      <div className="fixed top-5 left-5 bg-black bg-opacity-70 text-white px-4 py-2 rounded-md text-sm z-[2000]">
        📸 Images: {images.length} | 🕒 {currentTime}
      </div>

      {/* スライドショー */}
      {images.length > 0 && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full">
            <Image
              src={images[currentIndex].url}
              alt={images[currentIndex].name}
              fill
              className="object-contain"
              priority
              unoptimized // Supabaseの画像なので最適化をスキップ
            />
          </div>
        </div>
      )}
    </div>
  );
}
