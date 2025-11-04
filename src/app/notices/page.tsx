"use client";

import { useMemo, useRef, useEffect, useCallback } from "react";
import classNames from "classnames";
import Link from "next/link";

interface NoticeItem {
  id: string;
  title: string;
  // Add other notice properties as needed
}

import RecommendedRow from "@/components/reco/RecommendedRow";
import { NoticeCard } from "@/components/notices/NoticeCard";
import { NoticeCardSkeleton } from "@/components/notices/NoticeCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import BottomNav from "@/components/nav/BottomNav";
import { useInfiniteNotices } from "@/hooks/useInfiniteNotices";
import { useScrollTopButton } from "@/hooks/useScrollTop";

import {
  useNoticePreferences,
  NoticeSort,
} from "@/hooks/useNoticePreferences";

function hasToken() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

export default function NoticesPage() {
  const {
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    filters,
    setFilters,
  } = useNoticePreferences();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteNotices({
    tab,
    limit: 20,
    q: searchQuery,
    sort,
    category_ai: filters.category,
    source_college: filters.sourceCollege,
    date_range: filters.dateRange,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(() => {
    if (!data) return [];
    // react-query useInfiniteQuery 구조 대응
    // data.pages[i]가 { items: NoticeItem[] } 형태라고 가정
    // 아니라면 백엔드 응답에 맞춰 아래 map 부분만 수정
    // @ts-ignore
    if (Array.isArray(data.pages)) {
      // @ts-ignore
      return data.pages.flatMap((p) => p?.items ?? []);
    }
    // fallback
    // @ts-ignore
    return data?.items ?? [];
  }, [data]);

  const handleFilterChange = useCallback(
    (key: "category" | "sourceCollege" | "dateRange", value: string) => {
      setFilters({ [key]: value });
    },
    [setFilters]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(e.target.value as NoticeSort);
    },
    [setSort]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    },
    []
  );

  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.sourceCollege) count++;
    if (filters.dateRange && filters.dateRange !== "all") count++;
    return count;
  }, [filters]);

  const { show: showScrollTop, scrollToTop } = useScrollTopButton();

  const renderEmptyState = () => (
    <EmptyState message="조건에 맞는 공지가 없어요. 필터를 초기화하고 다시 확인해보세요. 🤔" />
  );

  const renderBottomLoader = () => {
    if (!isFetchingNextPage) return null;
    return (
      <div className="mt-4 flex flex-col items-center justify-center gap-2 text-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        <p className="text-xs text-gray-500">불러오는 중…</p>
      </div>
    );
  };

  return (
    <main className="mx-auto mb-20 max-w-screen-xl px-4 py-4">
      <div className="sticky top-0 z-10 -mx-4 mb-3 bg-gray-100/80 px-4 py-2 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full items-center overflow-hidden rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm md:w-64"
            >
              <span className="mr-2 text-gray-400">🔍</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-none p-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                placeholder="키워드 검색"
              />
              <button
                type="submit"
                className="ml-2 whitespace-nowrap rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
              >
                검색
              </button>
            </form>

            <select
              value={sort}
              onChange={handleSortChange}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="recent">최신순</option>
              <option value="deadline">마감 임박순</option>
              <option value="oldest">오래된 순</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="">전체 카테고리</option>
              <option value="장학">장학</option>
              <option value="채용">채용</option>
              <option value="행사">행사/설명회</option>
              <option value="대외활동">대외활동</option>
            </select>

            <select
              value={filters.sourceCollege}
              onChange={(e) =>
                handleFilterChange("sourceCollege", e.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="">전체 소스</option>
              <option value="컴공학부">컴공학부</option>
              <option value="경영대학">경영대학</option>
              <option value="취업지원팀">취업지원팀</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="all">전체 기간</option>
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
            </select>

            {appliedFilterCount > 0 && (
              <span className="text-xs text-gray-500">
                필터 적용 {appliedFilterCount}개
              </span>
            )}
          </div>
        </div>
      </div>

      {tab === "custom" && hasToken() && <RecommendedRow />}

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <NoticeCardSkeleton key={i} />
          ))}

        {isError && (
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            목록을 불러오지 못했어요.{" "}
            <button className="underline" onClick={() => refetch()}>
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && renderEmptyState()}

        {items.map((notice: NoticeItem) => (
          <NoticeCard key={notice.id} item={notice} />
        ))}
      </section>

      <div ref={sentinelRef} className="h-12" />
      {renderBottomLoader()}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
          aria-label="맨 위로"
        >
          ↑
        </button>
      )}
      <BottomNav />
    </main>
  );
}
