// src/app/notices/page.tsx
"use client";

import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import classNames from "classnames";
import type { Notice } from "@/types/notices";
import RecommendedRow from "@/components/reco/RecommendedRow";
import NoticeCard from "@/components/notices/NoticeCard";
import { NoticeCardSkeleton } from "@/components/notices/NoticeCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import BottomNav from "@/components/nav/BottomNav";
import { useInfiniteNotices } from "@/hooks/useInfiniteNotices";
import { useScrollTopButton } from "@/hooks/useScrollTop";
import {
  useNoticePreferences,
  type NoticeSort, // ✅ 타입으로 명시
} from "@/hooks/useNoticePreferences";

function hasToken() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

export default function NoticesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  const query = useMemo(() => {
    return {
      q: searchQuery || undefined,
      sort: sort,
      my: tab === "my" ? true : undefined,
      category: filters?.category,
      sourceCollege: filters?.sourceCollege,
      dateRange: filters?.dateRange === "all" ? undefined : filters?.dateRange,
    };
  }, [searchQuery, sort, tab, filters]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteNotices({
    query,
    pageSize: 20,
  });

  const handleSetTab = (nextTab: "my" | "all") => setTab(nextTab);

  // infinite scroll
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
    if (!data) return [] as Notice[];
    return data.pages.flatMap((page) => page?.items ?? []) as Notice[];
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

  const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }, []);

  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (filters?.category) count++;
    if (filters?.sourceCollege) count++;
    if (filters?.dateRange && filters?.dateRange !== "all") count++;
    return count;
  }, [filters]);

  const { show: showScrollTop, scrollToTop } = useScrollTopButton();

  const [collegeOptions, setCollegeOptions] = useState<
    { college_key: string; name: string }[]
  >([]);

  useEffect(() => {
    async function fetchColleges() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/colleges`);
        const data = await res.json();
        setCollegeOptions(data.items || []);
      } catch (e) {
        console.error("Failed to load colleges", e);
      }
    }
    fetchColleges();
  }, []);

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
      {/* 상단: 탭/검색/필터 */}
      <div className="sticky top-0 z-10 -mx-4 mb-3 bg-gray-100/80 px-4 py-2 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              onClick={() => handleSetTab("my")}
              className={classNames(
                "rounded-lg px-3 py-1.5 text-sm",
                tab === "my" ? "bg-gray-100 font-medium" : "text-gray-600"
              )}
            >
              맞춤 공지
            </button>
            <button
              onClick={() => handleSetTab("all")}
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
              className="flex w/full items-center overflow-hidden rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm md:w-64"
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
              value={sort || ""} // ✨ 안전 처리
              onChange={handleSortChange}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="recent">최신순</option>
              <option value="popular">인기순</option>
            </select>

            <select
              value={filters?.category || ""} // ✨ 안전 처리
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
              value={filters?.sourceCollege || ""} // ✨ 안전 처리
              onChange={(e) =>
                handleFilterChange("sourceCollege", e.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="">전체 소스</option>
              {collegeOptions.map((c) => (
                <option key={c.college_key} value={c.college_key}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filters?.dateRange || ""} // ✨ 안전 처리
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="">전체 기간</option>
              <option value="1d">최근 1일</option>
              <option value="1w">최근 1주</option>
              <option value="1m">최근 1달</option>
            </select>

            <span className="text-[11px] text-gray-500">
              필터 {appliedFilterCount}개 적용
            </span>
          </div>
        </div>
      </div>

      {tab === "my" && hasToken() && <RecommendedRow />}

      {/* ====== 리스트 컨테이너 ====== */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* 헤더 */}
        <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-2 text-[13px] text-gray-600 md:grid md:grid-cols-12 md:gap-4">
          <div className="col-span-5">제목</div>
          <div className="col-span-2">대분류</div>
          <div className="col-span-2">소분류</div>
          <div className="col-span-1">출처</div>
          <div className="col-span-1 text-right">등록일</div>
          <div className="col-span-1 text-center">관리</div>
        </div>

        {/* 바디 */}
        <section className="divide-y divide-gray-200">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <NoticeCardSkeleton key={i} />
            ))}

          {isError && (
            <div className="p-4 text-sm text-red-800">
              목록을 불러오지 못했어요.{" "}
              <button className="underline" onClick={() => refetch()}>
                다시 시도
              </button>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="p-6">
              <EmptyState message="조건에 맞는 공지가 없어요. 필터를 초기화하고 다시 확인해보세요. 🤔" />
            </div>
          )}

          {items.map((notice: Notice) => (
            <NoticeCard key={notice.id} item={notice} dense />
          ))}
        </section>
      </div>

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
