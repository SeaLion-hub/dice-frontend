import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "./providers"; // ✅ 우리가 방금 만든 전역 Provider 임포트
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// 폰트 설정 (네 기존 코드 유지)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// DICE 브랜딩에 맞춰서 메타데이터 살짝 커스터마이즈
export const metadata: Metadata = {
  title: "DICE",
  description: "연세대 공지/일정·자격요건까지 한 번에. DICE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-900`}
      >
        {/* 
          Providers 안에서 children이 렌더링되므로
          모든 페이지/컴포넌트에서 React Query를 바로 쓸 수 있게 됨
        */}
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
