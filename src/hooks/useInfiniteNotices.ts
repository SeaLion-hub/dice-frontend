// src/hooks/useInfiniteNotices.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import type { NoticeSort, DateRange } from "./useNoticePreferences";

type QueryInput = {
  q?: string;
  sort?: NoticeSort;
  my?: boolean;
  category?: string;
  sourceCollege?: string;
  dateRange?: DateRange | undefined; // "all"은 서버 미전송
};

type UseInfiniteNoticesArgs = {
  query: QueryInput;
  pageSize?: number;
};

export type NoticeItem = {
  id: string | number;
  // ...필요한 필드들
};

type ApiResponse = {
  items?: NoticeItem[];
  // 다양한 백엔드 케이스 지원
  nextCursor?: string | number | null;
  hasNextPage?: boolean;
  pagination?: {
    nextPage?: number;
    hasNext?: boolean;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function fetchNotices({
  pageParam = 1,
  query,
  pageSize = 20,
}: {
  pageParam?: number;
  query: QueryInput;
  pageSize: number;
}) {
  const params = new URLSearchParams();

  params.set("page", String(pageParam));
  params.set("pageSize", String(pageSize));

  const { q, sort, my, category, sourceCollege, dateRange } = query;

  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  if (my) params.set("my", "true");
  if (sourceCollege) params.set("college", sourceCollege);

  // ✅ 누락되었던 카테고리 파라미터 추가
  if (category) params.set("category", category);

  // "all"은 필터 없이 조회하도록 미전송하는 컨벤션
  if (dateRange && dateRange !== "all") params.set("dateRange", dateRange);

  const url = `${API_BASE}/notices?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch notices: ${res.status}`);
  }
  const json: ApiResponse = await res.json();

  const items = json.items ?? [];
  const hasNext =
    json.hasNextPage ??
    json.pagination?.hasNext ??
    // nextCursor가 있거나, 아이템 개수가 pageSize와 같으면 다음 페이지가 있을 가능성이 높음
    (typeof json.nextCursor !== "undefined"
      ? Boolean(json.nextCursor)
      : items.length === pageSize);

  const nextPage =
    json.pagination?.nextPage ??
    (hasNext ? (Number.isFinite(pageParam) ? Number(pageParam) + 1 : undefined) : undefined);

  return {
    items,
    hasNext,
    nextPage,
  };
}

export function useInfiniteNotices({ query, pageSize = 20 }: UseInfiniteNoticesArgs) {
  return useInfiniteQuery({
    queryKey: ["notices", query, pageSize],
    queryFn: ({ pageParam }) => fetchNotices({ pageParam, query, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage?.hasNext ? lastPage.nextPage : undefined),
  });
}
