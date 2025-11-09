import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LiffProvider } from "@/contexts/LiffContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boom!ヒーロー!! - AIがキミをアメコミヒーローに変換",
  description: "Sony Spresenseカメラで撮影した写真を、AIが自動でアメコミ風に変換。ポーズを決めるだけで、誰でも簡単にヒーローになれる新しいエンターテイメント体験。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LiffProvider>{children}</LiffProvider>
      </body>
    </html>
  );
}
