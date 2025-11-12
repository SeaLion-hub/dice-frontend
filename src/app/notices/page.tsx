// src/app/notices/page.tsx
"use client";

import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import classNames from "classnames";
import { SlidersHorizontal } from "lucide-react";
import type { Notice } from "@/types/notices";
import { useAuthStore } from "@/stores/useAuthStore";
import NoticeCard from "@/components/notices/NoticeCard";
import { NoticeCardSkeleton } from "@/components/notices/NoticeCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import BottomNav from "@/components/nav/BottomNav";
import { useInfiniteNotices } from "@/hooks/useInfiniteNotices";
import { useScrollTopButton } from "@/hooks/useScrollTop";
import { KeywordFilterSelector } from "@/components/notices/KeywordFilterSelector";
import {
  useNoticePreferences,
  type NoticeSort,
  type NoticeFilters,
  type DateRange,
} from "@/hooks/useNoticePreferences";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// store 기반 인증 여부 사용

export default function NoticesPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);
  const token = useAuthStore((s) => s.token);
  const isAuthed = !!token;

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<NoticeFilters>({
    categories: [],
    sourceCollege: "",
    dateRange: "all",
  });
  const [draftSort, setDraftSort] = useState<NoticeSort>("recent");

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

  useEffect(() => {
    if (!filterDialogOpen) return;
    setDraftFilters({
      categories: filters?.categories ?? [],
      sourceCollege: filters?.sourceCollege ?? "",
      dateRange: (filters?.dateRange ?? "all") as DateRange,
    });
    setDraftSort(sort);
  }, [filterDialogOpen, filters, sort]);

  const query = useMemo(() => {
    return {
      q: searchQuery || undefined,
      sort: sort,
      // 로그인 상태에서만 my=true를 붙여 401 방지
      my: tab === "my" && isAuthed ? true : undefined,
      hashtags: filters?.categories && filters.categories.length > 0 ? filters.categories : undefined,
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

  const handleFilterDialogOpenChange = useCallback((open: boolean) => {
    setFilterDialogOpen(open);
  }, []);

  const handleFilterApply = useCallback(() => {
    setFilters({
      categories: Array.isArray(draftFilters.categories) ? draftFilters.categories : [],
      sourceCollege: draftFilters.sourceCollege ?? "",
      dateRange: (draftFilters.dateRange ?? "all") as DateRange,
    });
    setSort(draftSort);
    setFilterDialogOpen(false);
  }, [draftFilters, draftSort, setFilters, setSort]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({ categories: [], sourceCollege: "", dateRange: "all" });
    setDraftSort("recent");
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }, []);

  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (filters?.categories && filters.categories.length > 0) count++;
    if (filters?.sourceCollege) count++;
    if (filters?.dateRange && filters?.dateRange !== "all") count++;
    return count;
  }, [filters]);

  // 공지사항 클릭 핸들러 - 상세 페이지로 이동 (부드러운 전환)
  const handleNoticeClick = useCallback(
    (id: string) => {
      router.push(`/notices/${id}`, { scroll: false });
    },
    [router]
  );

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

  const sortLabel = sort === "recent" ? "최신순" : "과거순";

  return (
    <main className="mx-auto mb-20 max-w-screen-xl px-4 py-4">
      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-gray-100/80 backdrop-blur">
        <div className="px-4 py-3 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
              <button
                onClick={() => handleSetTab("my")}
                className={classNames(
                  "rounded-lg px-3 py-1.5 text-sm",
                  mounted && tab === "my" ? "bg-gray-100 font-medium" : "text-gray-600"
                )}
              >
                맞춤 공지
              </button>
              <button
                onClick={() => handleSetTab("all")}
                className={classNames(
                  "rounded-lg px-3 py-1.5 text-sm",
                  mounted && tab === "all" ? "bg-gray-100 font-medium" : "text-gray-600"
                )}
              >
                전체 공지
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <form
                onSubmit={handleSearchSubmit}
                className="flex w-full items-center overflow-hidden rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm sm:w-72"
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

              <Dialog open={filterDialogOpen} onOpenChange={handleFilterDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="text-sm">필터 · {sortLabel}</span>
                    {appliedFilterCount > 0 && (
                      <span className="flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-medium text-white">
                        {appliedFilterCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>필터 설정</DialogTitle>
                    <DialogDescription>
                      원하는 조건을 선택하고 적용을 눌러주세요. 적용 시 목록이 즉시 업데이트됩니다.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">정렬</p>
                      <select
                        value={draftSort}
                        onChange={(e) => setDraftSort(e.target.value as NoticeSort)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="recent">최신순</option>
                        <option value="oldest">과거순</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">카테고리</p>
                      <KeywordFilterSelector
                        value={draftFilters.categories ?? []}
                        onChange={(next) =>
                          setDraftFilters((prev) => ({ ...prev, categories: next }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">출처</p>
                      <select
                        value={draftFilters.sourceCollege ?? ""}
                        onChange={(e) =>
                          setDraftFilters((prev) => ({ ...prev, sourceCollege: e.target.value }))
                        }
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">전체</option>
                        {collegeOptions.map((c) => (
                          <option key={c.college_key} value={c.college_key}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">기간</p>
                      <select
                        value={draftFilters.dateRange ?? "all"}
                        onChange={(e) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            dateRange: (e.target.value || "all") as DateRange,
                          }))
                        }
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all">전체</option>
                        <option value="1d">최근 1일</option>
                        <option value="1w">최근 1주</option>
                        <option value="1m">최근 1달</option>
                      </select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={handleFilterReset} type="button">
                      초기화
                    </Button>
                    <Button onClick={handleFilterApply} type="button">
                      적용
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="hidden border-t border-gray-200 pt-2 text-[13px] text-gray-600 md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-6">제목</div>
            <div className="col-span-2">대분류</div>
            <div className="col-span-2">소분류</div>
            <div className="col-span-1">출처</div>
            <div className="col-span-1 text-center">자격</div>
          </div>
        </div>
      </div>

      {/* ====== 리스트 컨테이너 ====== */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* 헤더 */}
        <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-2 text-[13px] text-gray-600 md:grid md:grid-cols-12 md:gap-4">
          <div className="col-span-6">제목</div>
          <div className="col-span-2">대분류</div>
          <div className="col-span-2">소분류</div>
          <div className="col-span-1">출처</div>
          <div className="col-span-1 text-center">자격</div>
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
            <NoticeCard
              key={notice.id}
              item={notice}
              dense
              onClick={handleNoticeClick}
              recommended={tab === "my"}
            />
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
