// components/notices/NoticeCardSkeleton.tsx
export function NoticeCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="h-3 w-20 rounded bg-gray-200" />
      <div className="h-4 w-3/4 rounded bg-gray-300" />
      <div className="h-3 w-5/6 rounded bg-gray-200" />
    </div>
  );
}
