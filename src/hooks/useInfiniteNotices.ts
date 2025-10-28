"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { PagedResponse, NoticeItem } from "@/types/notices";

type UseInfiniteNoticesParams = {
  tab: "custom" | "all";
  limit?: number;
};

export function useInfiniteNotices(params: UseInfiniteNoticesParams) {
  const limit = params.limit ?? 20;
  const my = params.tab === "custom";

  return useInfiniteQuery<PagedResponse<NoticeItem>>({
    queryKey: ["notices", { tab: params.tab, limit }],
    queryFn: async ({ pageParam = 0 }) => {
      const qs = new URLSearchParams({
        sort: "recent",
        limit: String(limit),
        offset: String(pageParam),
        my: String(my),
      });

      const res = await fetch(`/api/notices?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to load notices");

      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage?.next_offset == null) return undefined;
      return lastPage.next_offset;
    },
    staleTime: 60_000,
  });
}
