// src/components/notices/NoticeCardSkeleton.tsx
import React from "react";

/**
 * 공지사항 카드 스켈레톤 UI
 * 실제 NoticeCard 레이아웃과 일치하도록 설계
 */
export function NoticeCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      {/* 제목 스켈레톤 */}
      <div className="mb-3 h-6 w-3/4 animate-pulse rounded bg-muted" />
      
      {/* 해시태그 스켈레톤 */}
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
      </div>
      
      {/* 날짜 및 출처 스켈레톤 */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
      
      {/* 본문 요약 스켈레톤 */}
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

/**
 * 여러 개의 스켈레톤 카드를 렌더링하는 컴포넌트
 */
export function NoticeCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <NoticeCardSkeleton key={index} />
      ))}
    </div>
  );
}
