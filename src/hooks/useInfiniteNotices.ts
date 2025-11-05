// src/hooks/useInfiniteNotices.ts

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { PagedResponse, NoticeItem } from "@/types/notices";

type Params = {
  tab: "custom" | "all";
  searchQuery: string;
  sort: string;
  filters: {
    category: string;
    sourceCollege: string;
    dateRange: string;
  };
  limit?: number;
};

export function useInfiniteNotices({
  tab,
  searchQuery,
  sort,
  filters,
  limit = 20,
}: Params) {
  const tokenExists =
    typeof document !== "undefined" &&
    document.cookie.includes("DICE_TOKEN");

  const fetchNotices = useCallback(
    async ({ pageParam = 0 }): Promise<PagedResponse<NoticeItem>> => {
      const queryParams = new URLSearchParams();

      queryParams.set("limit", limit.toString());
      queryParams.set("offset", pageParam.toString());
      queryParams.set("sort", sort);

      if (searchQuery) {
        queryParams.set("q", searchQuery);
      }

      if (filters.category && filters.category !== "all") {
        queryParams.set("category", filters.category);
      }

      if (filters.sourceCollege) {
        queryParams.set("sourceCollege", filters.sourceCollege);
      }

      if (filters.dateRange && filters.dateRange !== "all") {
        queryParams.set("dateRange", filters.dateRange);
      }

      // ✅ 인증 토큰이 있을 때만 my=true 전달
      if (tab === "custom" && tokenExists) {
        queryParams.set("my", "true");
      }

      const res = await fetch(`/api/notices?${queryParams.toString()}`, {
        credentials: "include", // ✅ 쿠키를 포함해야 인증 작동
      });

      if (!res.ok) {
        throw new Error(`API 요청 실패: ${res.status}`);
      }

      return res.json();
    },
    [tab, limit, searchQuery, sort, filters, tokenExists]
  );

  return useInfiniteQuery({
    queryKey: ["notices", { tab, searchQuery, sort, filters }],
    queryFn: fetchNotices,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextOffset = allPages.length * limit;
      return lastPage.items.length === 0 ? undefined : nextOffset;
    },
    staleTime: 1000 * 60, // 1분 캐시
    retry: false,
  });
}
