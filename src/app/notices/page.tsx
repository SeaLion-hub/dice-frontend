"use client";

import { useMemo, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import classNames from "classnames";

import RecommendedRow from "@/components/reco/RecommendedRow";
import { NoticeCard } from "@/components/notices/NoticeCard";
import BottomNav from "@/components/nav/BottomNav";
import { useInfiniteNotices } from "@/hooks/useInfiniteNotices";

export default function NoticesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "all" ? "all" : "custom";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteNotices({ tab, limit: 20 });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(() => {
    return data?.pages.flatMap((p) => p.items) ?? [];
  }, [data]);

  function setTab(nextTab: "custom" | "all") {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", nextTab);
    router.replace(`/notices?${next.toString()}`);
  }

  return (
    <main className="mx-auto mb-20 max-w-screen-md px-4 py-4">
      <div className="sticky top-0 z-10 -mx-4 mb-3 bg-gray-100/80 px-4 py-2 backdrop-blur">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setTab("custom")}
            className={classNames(
              "rounded-lg px-3 py-1.5 text-sm",
              tab === "custom" ? "bg-gray-100 font-medium" : "text-gray-600"
            )}
          >
            맞춤 공지
          </button>
          <button
            onClick={() => setTab("all")}
            className={classNames(
              "rounded-lg px-3 py-1.5 text-sm",
              tab === "all" ? "bg-gray-100 font-medium" : "text-gray-600"
            )}
          >
            전체 공지
          </button>
        </div>
      </div>

      {tab === "custom" && <RecommendedRow />}

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white"
            />
          ))}

        {isError && (
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            목록을 불러오지 못했어요.{" "}
            <button className="underline" onClick={() => refetch()}>
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            아직 표시할 공지가 없어요.
          </div>
        )}

        {items.map((notice) => (
          <NoticeCard key={notice.id} item={notice} />
        ))}
      </section>

      <div ref={sentinelRef} className="h-12" />
      {isFetchingNextPage && (
        <p className="mt-2 text-center text-sm text-gray-500">
          불러오는 중…
        </p>
      )}

      <BottomNav />
    </main>
  );
}
