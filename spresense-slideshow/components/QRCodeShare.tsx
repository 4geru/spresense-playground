'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeShareProps {
  hashId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeShare({ hashId, isOpen, onClose }: QRCodeShareProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // デスクトップ判定
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // マウント前、モバイル、または閉じている場合は表示しない
  if (!mounted || !isDesktop || !isOpen) {
    return null;
  }

  const botId = process.env.NEXT_PUBLIC_LINE_BOT_ID || '@YOUR_BOT_ID';
  // oaMessage形式: 直接メッセージを送信する
  const message = `Codename:${hashId}`;
  const encodedMessage = encodeURIComponent(message);
  const qrUrl = `https://line.me/R/oaMessage/${botId}/?${encodedMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">スマホで開く</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QRコード */}
        <div className="bg-white p-6 rounded-lg mb-6 flex justify-center">
          <QRCodeSVG
            value={qrUrl}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* 説明 */}
        <div className="text-center space-y-4">
          <div className="text-gray-300 space-y-2">
            <p className="font-semibold">スマホでQRコードを読み取ると</p>
            <ol className="text-sm text-gray-400 space-y-1 text-left pl-6">
              <li>1. LINEアプリが開きます</li>
              <li>2. Botに自動的にメッセージが送信されます</li>
              <li>3. 画像とスライドショーリンクが届きます</li>
              <li>4. リンクをタップして大画面で表示</li>
            </ol>
          </div>

          {/* LINE Bot情報 */}
          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              「Boom!ヒーロー!!」Bot
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {botId}
            </p>
          </div>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
