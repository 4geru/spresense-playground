'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const lineBotId = process.env.NEXT_PUBLIC_LINE_BOT_ID;
  const lineAddFriendUrl = lineBotId ? `https://line.me/R/ti/p/${lineBotId}` : '#';

  useEffect(() => {
    setMounted(true);
  }, []);

  // ページタイトル設定
  useEffect(() => {
    document.title = 'Boom!ヒーロー!! - ポーズを決めてヒーローになろう';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className={`text-6xl md:text-8xl font-black mb-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">
              Boom!ヒーロー!!
            </span>
          </h1>

          <p className={`text-2xl md:text-4xl font-bold mb-4 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            ポーズを決めろ!AIがキミをアメコミヒーローに変換
          </p>

          <p className={`text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Sony Spresenseカメラで撮影した写真を、AIが自動でアメコミ風に変換。<br />
            あなたがヒーローポーズを決めると、その瞬間がクールなコミックアートに生まれ変わります！
          </p>

          <div className={`flex flex-col gap-6 items-center transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* LINE Bot追加ボタン（最も目立つ位置） */}
            <a
              href={lineAddFriendUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-10 py-5 bg-[#06C755] hover:bg-[#05b34c] rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl hover:shadow-green-500/50 flex items-center gap-3"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              <span className="relative z-10">LINE Bot 友達追加</span>
            </a>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg hover:shadow-purple-500/50"
              >
                <span className="relative z-10">📺 スライドショーを見る</span>
              </Link>
              <Link
                href="/slides"
                className="group relative px-8 py-4 bg-gradient-to-r from-yellow-600 to-red-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg hover:shadow-yellow-500/50"
              >
                <span className="relative z-10">🖼️ ギャラリーを見る</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            主な機能
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon="📸"
              title="IoT写真撮影"
              description="Sony Spresenseボードがあなたのヒーローポーズを撮影します。"
            />
            <FeatureCard
              icon="🤖"
              title="AIによる自動変換"
              description="Google Geminiが写真から人物のポーズを認識し、自動でアメコミ風の画像に変換します。"
            />
            <FeatureCard
              icon="💬"
              title="LINE Bot連携"
              description="変換された画像とオリジナル画像が、あなたのLINEに直接届きます。"
            />
            <FeatureCard
              icon="🖼️"
              title="Webギャラリー"
              description="これまでに撮影された全ての画像をスライドショーやギャラリー形式で閲覧できます。"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-4 bg-black bg-opacity-30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-400">
            仕組み
          </h2>

          <div className="space-y-8">
            <ProcessStep
              number="1"
              title="撮影フェーズ"
              description="Spresenseカメラがヒーローポーズを撮影し、Pythonスクリプトに送信します。"
              color="from-purple-600 to-purple-400"
            />
            <ProcessStep
              number="2"
              title="AI分析・画像変換フェーズ"
              description="Google Gemini APIがポーズを判定。ポーズありの場合、アメコミ風に自動変換します。"
              color="from-pink-600 to-pink-400"
            />
            <ProcessStep
              number="3"
              title="保存・通知フェーズ"
              description="変換後の画像とオリジナル画像をSupabase Storageに保存し、LINE Botでプッシュ通知します。"
              color="from-yellow-600 to-yellow-400"
            />
            <ProcessStep
              number="4"
              title="Web表示フェーズ"
              description="Next.jsアプリで画像をスライドショーやギャラリー形式で表示。LIFFで友達に共有できます。"
              color="from-red-600 to-red-400"
            />
          </div>
        </div>
      </section>

      {/* LINE Bot Add Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6">
            <svg className="w-20 h-20 text-[#06C755]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
          </div>

          <h2 className="text-4xl md:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
            LINE Botで通知を受け取ろう！
          </h2>

          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            LINE Botを友達追加すると、撮影された写真がリアルタイムであなたのLINEに届きます。<br />
            アメコミ風に変換された画像とオリジナル画像の両方が自動で送信されます！
          </p>

          <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-2xl p-8 mb-8 max-w-2xl mx-auto border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-green-400">📲 LINE Botでできること</h3>
            <ul className="text-left space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>撮影された写真をリアルタイムで受信</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>アメコミ風変換画像とオリジナル画像の両方を確認</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>LIFFを使って友達に直接共有</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>いつでもどこでもスマホで確認可能</span>
              </li>
            </ul>
          </div>

          <a
            href={lineAddFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-12 py-6 bg-[#06C755] hover:bg-[#05b34c] rounded-full font-black text-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-green-500/50"
          >
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            友達追加する
          </a>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            技術スタック
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <TechStackCard
              category="ハードウェア"
              items={["Sony Spresense"]}
            />
            <TechStackCard
              category="IoT / バックエンド"
              items={["Python", "Arduino"]}
            />
            <TechStackCard
              category="AI"
              items={["Google Gemini"]}
            />
            <TechStackCard
              category="フロントエンド"
              items={["Next.js", "React", "TypeScript", "Tailwind CSS"]}
            />
            <TechStackCard
              category="クラウド"
              items={["Supabase (Storage, Edge Functions)", "GitHub Pages"]}
            />
            <TechStackCard
              category="メッセージング"
              items={["LINE Bot", "LIFF"]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-400">
            今すぐヒーローになろう！
          </h2>
          <p className="text-lg text-gray-300 mb-12">
            LINE Botを友達追加してリアルタイムで通知を受け取るか、<br />
            スライドショーやギャラリーで過去の作品を閲覧できます。
          </p>
          <div className="flex flex-col gap-6 items-center">
            <a
              href={lineAddFriendUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#06C755] hover:bg-[#05b34c] rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl hover:shadow-green-500/50"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              LINE Bot 友達追加
            </a>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg hover:shadow-purple-500/50"
              >
                <span className="relative z-10">📺 スライドショーを見る</span>
              </Link>
              <Link
                href="/slides"
                className="group relative px-8 py-4 bg-gradient-to-r from-yellow-600 to-red-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg hover:shadow-yellow-500/50"
              >
                <span className="relative z-10">🖼️ ギャラリーを見る</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          <p>Boom!ヒーロー!! - Powered by Sony Spresense & Google Gemini</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-xl p-6 hover:bg-opacity-70 transition-all hover:scale-105 border border-gray-700">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
}

function ProcessStep({ number, title, description, color }: { number: string; title: string; description: string; color: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-black text-xl`}>
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
}

function TechStackCard({ category, items }: { category: string; items: string[] }) {
  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-bold mb-3 text-purple-400">{category}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-gray-300 text-sm flex items-center gap-2">
            <span className="text-purple-500">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
