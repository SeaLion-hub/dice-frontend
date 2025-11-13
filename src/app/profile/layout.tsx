// src/app/profile/layout.tsx
"use client";

import { Suspense } from "react";
import { NoticeCardSkeleton } from "@/components/notices/NoticeCardSkeleton";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<NoticeCardSkeleton />}>
      {children}
    </Suspense>
  );
}
