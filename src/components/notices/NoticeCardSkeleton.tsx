// components/notices/NoticeCardSkeleton.tsx
export function NoticeCardSkeleton() {
  return (
    // 💡 개선: NoticeCard(dense)와 동일한 패딩/레이아웃
    <div className="grid animate-pulse grid-cols-12 items-center gap-4 px-4 py-3">
      {/* 1. 제목 (col-span-5) */}
      <div className="col-span-5 h-4 rounded bg-gray-300"></div>
      {/* 2. 대분류 (col-span-2) */}
      <div className="col-span-2 h-4 rounded bg-gray-200"></div>
      {/* 3. 소분류 (col-span-2) */}
      <div className="col-span-2 h-4 rounded bg-gray-200"></div>
      {/* 4. 출처 (col-span-1) */}
      <div className="col-span-1 h-4 rounded bg-gray-200"></div>
      {/* 5. 등록일 (col-span-1) */}
      <div className="col-span-1 h-4 rounded bg-gray-200"></div>
      {/* 6. 관리 (col-span-1) */}
      <div className="col-span-1 flex justify-center">
        <div className="h-4 w-4 rounded-full bg-gray-200"></div>
      </div>
    </div>
  );
}