// src/hooks/useInfiniteNotices.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
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

async function fetchNotices({
  pageParam = 1,
  query,
  pageSize = 20,
  token,
}: {
  pageParam?: number;
  query: QueryInput;
  pageSize: number;
  token?: string | null;
}) {
  const params = new URLSearchParams();

  // 백엔드 API는 offset/limit 형식을 사용
  const offset = (Number(pageParam) - 1) * pageSize;
  params.set("offset", String(offset));
  params.set("limit", String(pageSize));

  const { q, sort, my, category, sourceCollege, dateRange } = query;

  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  if (my) params.set("my", "true");
  if (sourceCollege) params.set("college", sourceCollege);

  // dateRange를 date_from/date_to로 변환
  if (dateRange && dateRange !== "all") {
    const now = new Date();
    let dateFrom: Date;
    
    switch (dateRange) {
      case "1d":
        dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "1w":
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1m":
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    params.set("date_from", dateFrom.toISOString().split("T")[0]);
  }

  // Next.js API 라우트를 통해 호출
  const url = `/api/notices?${params.toString()}`;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // 인증 토큰이 있으면 추가
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch notices: ${res.status}`);
  }
  const json = await res.json();

  // 백엔드 응답 형식: { meta: { limit, offset, returned, total_count? }, items: [] }
  const rawItems = json.items ?? [];
  const items = rawItems.map((item: any) => ({
    ...item,
    posted_at:
      item?.posted_at ??
      item?.postedAt ??
      item?.published_at ??
      item?.publishedAt ??
      item?.created_at ??
      item?.createdAt ??
      null,
    qualification_ai: item?.qualification_ai ?? item?.qualificationAi ?? null,
  }));
  const meta = json.meta ?? {};
  const totalCount = meta.total_count;
  const returned = meta.returned ?? items.length;
  const currentOffset = meta.offset ?? offset;
  const currentLimit = meta.limit ?? pageSize;

  // 다음 페이지가 있는지 확인
  const hasNext = totalCount != null 
    ? currentOffset + returned < totalCount
    : returned === currentLimit; // 반환된 아이템 수가 limit와 같으면 다음 페이지가 있을 가능성

  const nextPage = hasNext ? (Number.isFinite(pageParam) ? Number(pageParam) + 1 : undefined) : undefined;

  return {
    items,
    hasNext,
    nextPage,
  };
}

export function useInfiniteNotices({ query, pageSize = 20 }: UseInfiniteNoticesArgs) {
  const token = useAuthStore((state) => state.token);

  return useInfiniteQuery({
    queryKey: ["notices", query, pageSize, token],
    queryFn: ({ pageParam }) => fetchNotices({ pageParam, query, pageSize, token }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage?.hasNext ? lastPage.nextPage : undefined),
  });
}
