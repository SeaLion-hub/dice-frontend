import { useInfiniteQuery } from "@tanstack/react-query";
import { NoticeItem } from "@/types/notices";

interface FetchNoticesOptions {
  tab: "custom" | "all";
  limit: number;
  searchQuery?: string;
  sort?: string;
  filters?: {
    sourceCollege?: string;
    category?: string;
    dateRange?: string;
  };
}

export function useInfiniteNotices({
  tab,
  limit,
  searchQuery,
  sort = "recent",
  filters = {},
}: FetchNoticesOptions) {
  const fetchNotices = async ({ pageParam = 0 }) => {
    const params = new URLSearchParams();
    params.set("offset", pageParam.toString());
    params.set("limit", limit.toString());
    params.set("sort", sort);

    if (searchQuery) params.set("q", searchQuery);
    if (filters.sourceCollege) params.set("college", filters.sourceCollege);

    if (filters.dateRange) {
      const toISO = (date: Date) => date.toISOString().slice(0, 10);
      const now = Date.now();

      if (filters.dateRange === "7d") {
        const from = new Date(now - 7 * 24 * 60 * 60 * 1000);
        params.set("date_from", toISO(from));
      } else if (filters.dateRange === "30d") {
        const from = new Date(now - 30 * 24 * 60 * 60 * 1000);
        params.set("date_from", toISO(from));
      } else if (filters.dateRange === "90d") {
        const from = new Date(now - 90 * 24 * 60 * 60 * 1000);
        params.set("date_from", toISO(from));
      }
    }

    const res = await fetch(`/api/notices?${params.toString()}`);
    if (!res.ok) {
      throw new Error("공지 불러오기 실패");
    }

    const data = await res.json();
    return data;
  };

  return useInfiniteQuery({
    queryKey: ["notices", tab, searchQuery, sort, filters],
    queryFn: fetchNotices,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) => {
      const returned = lastPage?.meta?.returned ?? 0;
      const offset = lastPageParam ?? 0;
      return returned === limit ? offset + limit : undefined;
    },
  });
}
