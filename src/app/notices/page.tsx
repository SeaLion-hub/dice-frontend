"use client";

import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { LS_KEYS, API_BASE } from "@/lib/constants";
import { useRouter } from "next/navigation";
import classNames from "classnames";
import { SlidersHorizontal, LayoutGrid, List, Search as SearchIcon } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// store 기반 인증 여부 사용

export default function NoticesPage() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const router = useRouter();
  useEffect(() => setMounted(true), []);
  const token = useAuthStore((s) => s.token);
  const isAuthed = !!token;

  // 뷰 모드 저장 (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEYS.NOTICES_VIEW_MODE);
    if (saved === "card" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.NOTICES_VIEW_MODE, viewMode);
  }, [viewMode]);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
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

  // 로그인 후 첫 화면은 맞춤공지 탭으로 설정 (저장된 값이 없을 때만)
  useEffect(() => {
    if (isAuthed) {
      const savedPrefs = localStorage.getItem(LS_KEYS.NOTICE_PREFS);
      if (!savedPrefs) {
        // 저장된 값이 없으면 맞춤공지 탭으로 설정
        setTab("my");
      }
    }
  }, [isAuthed, setTab]);

  useEffect(() => {
    if (!filterSheetOpen) return;
    setDraftFilters({
      categories: filters?.categories ?? [],
      sourceCollege: filters?.sourceCollege ?? "",
      dateRange: (filters?.dateRange ?? "all") as DateRange,
    });
    setDraftSort(sort);
  }, [filterSheetOpen, filters, sort]);

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
    const allItems = data.pages.flatMap((page) => page?.items ?? []) as Notice[];
    // 중복 제거: 같은 ID를 가진 항목 중 첫 번째만 유지 (강화된 버전)
    const seen = new Map<string | number, Notice>();
    const uniqueItems: Notice[] = [];
    
    for (const notice of allItems) {
      const noticeId = notice.id;
      if (!noticeId) {
        // ID가 없는 항목은 건너뛰기 (데이터 무결성 보장)
        console.warn("Notice without ID found:", notice);
        continue;
      }
      
      if (!seen.has(noticeId)) {
        seen.set(noticeId, notice);
        uniqueItems.push(notice);
      } else {
        // 중복 발견 시 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Duplicate notice ID detected: ${noticeId}`, {
            existing: seen.get(noticeId),
            duplicate: notice,
          });
        }
      }
    }
    
    return uniqueItems;
  }, [data]);

  const handleFilterSheetOpenChange = useCallback((open: boolean) => {
    setFilterSheetOpen(open);
  }, []);

  const handleFilterApply = useCallback(() => {
    setFilters({
      categories: Array.isArray(draftFilters.categories) ? draftFilters.categories : [],
      sourceCollege: draftFilters.sourceCollege ?? "",
      dateRange: (draftFilters.dateRange ?? "all") as DateRange,
    });
    setSort(draftSort);
    setFilterSheetOpen(false);
  }, [draftFilters, draftSort, setFilters, setSort]);

  const handleRemoveCategoryFilter = useCallback((category: string) => {
    setFilters({
      ...filters,
      categories: (filters?.categories ?? []).filter((c) => c !== category),
    });
  }, [filters, setFilters]);

  const handleRemoveSourceCollegeFilter = useCallback(() => {
    setFilters({
      ...filters,
      sourceCollege: "",
    });
  }, [filters, setFilters]);

  const handleRemoveDateRangeFilter = useCallback(() => {
    setFilters({
      ...filters,
      dateRange: "all",
    });
  }, [filters, setFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({ categories: [], sourceCollege: "", dateRange: "all" });
    setDraftSort("recent");
  }, []);

  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [corrections, setCorrections] = useState<Array<{keyword: string; score: number}>>([]);
  const [relatedSearches, setRelatedSearches] = useState<Array<{keyword: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 최근 검색어 로드
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEYS.RECENT_SEARCHES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5));
        }
      } catch (e) {
        // 무시
      }
    }
  }, []);

  // 검색어 저장
  const saveSearchQuery = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q !== query);
      const updated = [query, ...filtered].slice(0, 5);
      localStorage.setItem(LS_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
      return updated;
    });
    
    // 검색 로그 기록 (비동기)
    const apiBase = API_BASE;
    fetch(`${apiBase}/search/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query: query.trim() }),
    }).catch(() => {
      // 로그 기록 실패는 무시
    });
  }, [token]);

  // 검색어 하이라이트 함수
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/15 text-foreground rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveSearchQuery(searchQuery.trim());
      setShowSuggestions(false);
      
      // 검색 로그 기록 (비동기, 실패해도 무시)
      const apiBase = API_BASE;
      fetch(`${apiBase}/search/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          query: searchQuery.trim(),
          results_count: items.length // 검색 결과 개수 (나중에 업데이트 가능)
        }),
      }).catch(() => {
        // 로그 기록 실패는 무시
      });
    }
  }, [searchQuery, saveSearchQuery, token, items.length]);

  // 검색어 제안 API 호출 (디바운싱)
  useEffect(() => {
    // 이전 타이머 취소
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (!searchQuery.trim() || searchQuery.length < 1) {
      setSearchSuggestions([]);
      setCorrections([]);
      setRelatedSearches([]);
      return;
    }

    // 디바운싱: 300ms 후에 API 호출
    suggestionTimeoutRef.current = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const apiBase = API_BASE;
        const response = await fetch(
          `${apiBase}/search/suggest?q=${encodeURIComponent(searchQuery.trim())}&limit=5`
        );
        
        if (response.ok) {
          const data = await response.json();
          setCorrections(data.corrections || []);
          setRelatedSearches(data.related || []);
          
          // 최근 검색어에서 매칭되는 것도 추가
          const matching = recentSearches.filter((q) =>
            q.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSearchSuggestions(matching.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch search suggestions:', error);
        // 오류 발생 시 최근 검색어만 표시
        const matching = recentSearches.filter((q) =>
          q.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchSuggestions(matching.slice(0, 3));
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [searchQuery, recentSearches]);

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
        const res = await fetch(`${API_BASE}/colleges`);
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
            <div className="flex items-center gap-2">
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
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={classNames(
                    "rounded px-2 py-1.5",
                    viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-600"
                  )}
                  aria-label="리스트 뷰"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={classNames(
                    "rounded px-2 py-1.5",
                    viewMode === "card" ? "bg-gray-100 text-gray-900" : "text-gray-600"
                  )}
                  aria-label="카드 뷰"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:w-72">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex w-full items-center overflow-hidden rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm"
                >
                  <SearchIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (searchQuery || recentSearches.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // 약간의 지연을 두어 클릭 이벤트가 먼저 발생하도록
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    className="w-full border-none p-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                    placeholder="키워드 검색"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                        searchInputRef.current?.focus();
                      }}
                      className="mr-1 text-gray-400 hover:text-gray-600"
                      aria-label="검색어 지우기"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="ml-2 whitespace-nowrap rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
                  >
                    검색
                  </button>
                </form>

                {/* 검색 제안 드롭다운 */}
                {showSuggestions && (
                  <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-96 overflow-y-auto">
                    {/* 오타 교정 제안 */}
                    {corrections.length > 0 && (
                      <div className="p-2 border-b border-gray-100">
                        <div className="mb-1 text-xs font-semibold text-gray-500">
                          오타 교정 제안
                        </div>
                        {corrections.map((correction, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSearchQuery(correction.keyword);
                              saveSearchQuery(correction.keyword);
                              setShowSuggestions(false);
                              searchInputRef.current?.focus();
                            }}
                            className="w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center justify-between"
                          >
                            <span className="font-medium">{correction.keyword}</span>
                            <span className="text-xs text-gray-400">
                              {Math.round(correction.score * 100)}% 일치
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 연관 검색어 */}
                    {relatedSearches.length > 0 && (
                      <div className="p-2 border-b border-gray-100">
                        <div className="mb-1 text-xs font-semibold text-gray-500">
                          연관 검색어
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {relatedSearches.map((related, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setSearchQuery(related.keyword);
                                saveSearchQuery(related.keyword);
                                setShowSuggestions(false);
                                searchInputRef.current?.focus();
                              }}
                              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              {related.keyword}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 최근 검색어 매칭 */}
                    {searchSuggestions.length > 0 && (
                      <div className="p-2 border-b border-gray-100">
                        <div className="mb-1 text-xs font-semibold text-gray-500">검색 제안</div>
                        {searchSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSearchQuery(suggestion);
                              saveSearchQuery(suggestion);
                              setShowSuggestions(false);
                              searchInputRef.current?.focus();
                            }}
                            className="w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {highlightText(suggestion, searchQuery)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 최근 검색어 (검색어가 없을 때만) */}
                    {!searchQuery && recentSearches.length > 0 && (
                      <div className="p-2">
                        <div className="mb-1 text-xs font-semibold text-gray-500">최근 검색</div>
                        {recentSearches.map((search, i) => (
                          <div
                            key={i}
                            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 group"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(search);
                                setShowSuggestions(false);
                                searchInputRef.current?.focus();
                              }}
                              className="flex-1 text-left min-w-0 truncate"
                            >
                              {search}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRecentSearches((prev) => {
                                  const updated = prev.filter((q) => q !== search);
                                  localStorage.setItem(LS_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
                                  return updated;
                                });
                              }}
                              className="shrink-0 ml-2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                              aria-label={`${search} 검색어 삭제`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 로딩 상태 */}
                    {isLoadingSuggestions && searchQuery && (
                      <div className="p-2 text-center text-xs text-gray-400">
                        검색어 제안 불러오는 중...
                      </div>
                    )}

                    {/* 제안이 없을 때 */}
                    {!isLoadingSuggestions && 
                     corrections.length === 0 && 
                     relatedSearches.length === 0 && 
                     searchSuggestions.length === 0 && 
                     searchQuery && (
                      <div className="p-2 text-center text-xs text-gray-400">
                        검색어 제안이 없습니다
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Sheet open={filterSheetOpen} onOpenChange={handleFilterSheetOpenChange}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="text-sm">필터 · {sortLabel}</span>
                    {appliedFilterCount > 0 && (
                      <span className="flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-medium text-white">
                        {appliedFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>필터 설정</SheetTitle>
                  <SheetDescription>
                    조건을 선택한 뒤 적용하면 목록이 바로 갱신됩니다.
                  </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
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

                  <SheetFooter className="mt-6">
                    <Button variant="outline" onClick={handleFilterReset} type="button" className="w-full sm:w-auto">
                      초기화
                    </Button>
                    <Button onClick={handleFilterApply} type="button" className="w-full sm:w-auto">
                      적용
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* 적용된 필터 칩 표시 */}
          {appliedFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {filters?.categories && filters.categories.length > 0 && filters.categories.map((category) => (
                <Badge
                  key={category}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                >
                  {category}
                  <button
                    onClick={() => handleRemoveCategoryFilter(category)}
                    className="ml-1.5 rounded-full hover:bg-blue-300 p-0.5"
                    aria-label={`${category} 필터 제거`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters?.sourceCollege && (
                <Badge
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                >
                  출처: {collegeOptions.find((c) => c.college_key === filters.sourceCollege)?.name || filters.sourceCollege}
                  <button
                    onClick={handleRemoveSourceCollegeFilter}
                    className="ml-1.5 rounded-full hover:bg-blue-300 p-0.5"
                    aria-label="출처 필터 제거"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters?.dateRange && filters.dateRange !== "all" && (
                <Badge
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                >
                  기간: {filters.dateRange === "1d" ? "최근 1일" : filters.dateRange === "1w" ? "최근 1주" : "최근 1달"}
                  <button
                    onClick={handleRemoveDateRangeFilter}
                    className="ml-1.5 rounded-full hover:bg-blue-300 p-0.5"
                    aria-label="기간 필터 제거"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          <div className="hidden border-t border-gray-200 pt-2 text-[13px] text-gray-600 md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-6">제목</div>
            <div className="col-span-2">대분류</div>
            <div className="col-span-2">소분류</div>
            <div className="col-span-1">출처</div>
            <div className="col-span-1 text-center">자격</div>
          </div>
        </div>
      </div>

      {/* ====== 리스트/카드 컨테이너 ====== */}
      {viewMode === "list" ? (
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
                <EmptyState message="조건에 맞는 공지가 없어요. 필터를 바꿔보세요." />
              </div>
            )}

            {items.map((notice: Notice) => (
              <NoticeCard
                key={notice.id}
                item={notice}
                dense
                onClick={handleNoticeClick}
                recommended={tab === "my"}
                highlightQuery={searchQuery || undefined}
              />
            ))}
          </section>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl border border-gray-200 bg-white" />
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
            <div className="col-span-full p-6">
              <EmptyState message="조건에 맞는 공지가 없어요. 필터를 바꿔보세요." />
            </div>
          )}

          {items.map((notice: Notice) => (
            <NoticeCard
              key={notice.id}
              item={notice}
              dense={false}
              onClick={handleNoticeClick}
              recommended={tab === "my"}
              highlightQuery={searchQuery || undefined}
            />
          ))}
        </section>
      )}

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
