"use client";

import { useMemo, useRef, useEffect, useCallback } from "react";
import classNames from "classnames";
import Link from "next/link";

import RecommendedRow from "@/components/reco/RecommendedRow";
import { NoticeCard } from "@/components/notices/NoticeCard";
import BottomNav from "@/components/nav/BottomNav";
import { useInfiniteNotices } from "@/hooks/useInfiniteNotices";

import {
  useNoticePreferences,
  NoticeTab,
  NoticeSort,
} from "@/hooks/useNoticePreferences";

export default function NoticesPage() {
  /**
   * GLOBAL PREFERENCES (zustand)
   */
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

  /**
   * DATA FETCH
   * - 지금은 기존 훅 시그니처 유지 (tab, limit)
   * - 추후 훅을 확장해서 sort / q / filters를 백엔드 파라미터로 보내면 됨
   */
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
    // TODO: 백엔드 연결 시 여기에
    // q: searchQuery,
    // sort,
    // category_ai: filters.category,
    // source_college: filters.sourceCollege,
    // date_range: filters.dateRange,
  });

  /**
   * INFINITE SCROLL OBSERVER
   */
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

  /**
   * FLATTEN PAGES
   */
  const items = useMemo(() => {
    return data?.pages.flatMap((p) => p.items) ?? [];
  }, [data]);

  /**
   * FILTER HANDLERS
   * (단순 상태 변경만 하고, 실제 fetch 파라미터 연결은 위 useInfiniteNotices TODO 참고)
   */
  const handleFilterChange = useCallback(
    (key: "category" | "sourceCollege" | "dateRange", value: string) => {
      setFilters({ [key]: value });
      // 추후: refetch(); or reset pagination & refetch
    },
    [setFilters]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(e.target.value as NoticeSort);
      // 추후: refetch with new sort
    },
    [setSort]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // 추후: refetch with searchQuery
      // 현재는 상태만 유지해도 OK
    },
    []
  );

  /**
   * UI HELPERS
   */
  const renderEmptyState = () => {
    if (tab === "custom") {
      return (
        <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
          <div className="font-medium text-gray-900">
            아직 맞춤 공지가 없어요.
          </div>
          <div className="mt-2 text-gray-600">
            프로필 정보를 더 채우면
            더 정확한 맞춤 공지를 받을 수 있어요. ✔️
          </div>
          <Link
            href="/profile"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            프로필 업데이트하기
          </Link>
        </div>
      );
    }

    // tab === "all"
    return (
      <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
        <div className="font-medium text-gray-900">
          조건에 맞는 공지가 없어요.
        </div>
        <div className="mt-2 text-gray-600">
          필터를 초기화하고 다시 확인해보세요. 🤔
        </div>

        <button
          onClick={() => {
            setFilters({
              category: "",
              sourceCollege: "",
              dateRange: "all",
            });
            setSearchQuery("");
            setSort("recent");
            // 추후: refetch with cleared params
          }}
          className="mt-4 inline-block rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          필터 초기화
        </button>
      </div>
    );
  };

  const renderBottomLoader = () => {
    if (!isFetchingNextPage) return null;

    return (
      <div className="mt-4 flex flex-col items-center justify-center gap-2 text-center">
        {/* 스피너 */}
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        <p className="text-xs text-gray-500">불러오는 중…</p>
      </div>
    );
  };

  return (
    <main className="mx-auto mb-20 max-w-screen-xl px-4 py-4">
      {/* === Sticky Header: 탭 + 검색/필터/정렬 바 === */}
      <div className="sticky top-0 z-10 -mx-4 mb-3 bg-gray-100/80 px-4 py-2 backdrop-blur">
        {/* 탭 전환 */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              onClick={() => setTab("custom")}
              className={classNames(
                "rounded-lg px-3 py-1.5 text-sm",
                tab === "custom"
                  ? "bg-gray-100 font-medium"
                  : "text-gray-600"
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

          {/* 검색 / 정렬 / 필터 영역 */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            {/* 검색 */}
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
                aria-label="공지 검색"
              />
              <button
                type="submit"
                className="ml-2 whitespace-nowrap rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
              >
                검색
              </button>
            </form>

            {/* 정렬 */}
            <select
              value={sort}
              onChange={handleSortChange}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
              aria-label="정렬 기준 선택"
            >
              <option value="recent">최신순</option>
              <option value="deadline">마감 임박순</option>
              <option value="oldest">오래된 순</option>
            </select>

            {/* category_ai 필터 */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
              aria-label="카테고리 필터"
            >
              <option value="">전체 카테고리</option>
              <option value="장학">장학</option>
              <option value="채용">채용</option>
              <option value="행사">행사/설명회</option>
              <option value="대외활동">대외활동</option>
              {/* 실제로는 hashtags_ai / category_ai 값으로 채우면 됨 */}
            </select>

            {/* source_college 필터 */}
            <select
              value={filters.sourceCollege}
              onChange={(e) =>
                handleFilterChange("sourceCollege", e.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
              aria-label="소속 단과대/부서 필터"
            >
              <option value="">전체 소스</option>
              <option value="컴공학부">컴공학부</option>
              <option value="경영대학">경영대학</option>
              <option value="취업지원팀">취업지원팀</option>
              {/* 백엔드 source_college 값 세트로 치환 예정 */}
            </select>

            {/* 게시일 범위 필터 */}
            <select
              value={filters.dateRange}
              onChange={(e) =>
                handleFilterChange("dateRange", e.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none"
              aria-label="게시일 범위 필터"
            >
              <option value="all">전체 기간</option>
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
            </select>
          </div>
        </div>
      </div>

      {/* 맞춤 공지 탭 상단 추천 캐러셀 */}
      {tab === "custom" && <RecommendedRow />}

      {/* 공지 카드 리스트 */}
      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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

        {!isLoading && !isError && items.length === 0 && renderEmptyState()}

        {items.map((notice) => (
          <NoticeCard key={notice.id} item={notice} />
        ))}
      </section>

      {/* 무한스크롤 트리거 */}
      <div ref={sentinelRef} className="h-12" />

      {/* 하단 로딩 인디케이터 */}
      {renderBottomLoader()}

      <BottomNav />
    </main>
  );
}
