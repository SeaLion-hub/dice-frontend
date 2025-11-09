// src/hooks/useInfiniteNotices.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Notice } from "@/types/notices";

type QueryInput = {
  q?: string;
  sort?: string;
  my?: boolean;
  category?: string;
  sourceCollege?: string;
  dateRange?: string;
};

type UseInfiniteNoticesParams = {
  pageSize?: number;
  query: QueryInput;
};

type IPagedResponse<T> = {
  items: T[];
  total?: number;
  nextOffset?: number;
  hasNextPage?: boolean;
};

function toUrlSearchParams(params: Record<string, unknown>): URLSearchParams {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    if (typeof v === "boolean") {
      // boolean true만 파라미터로 포함 (false는 생략)
      if (v) sp.set(k, "true");
      return;
    }
    sp.set(k, String(v));
  });
  return sp;
}

export function useInfiniteNotices({ pageSize = 20, query }: UseInfiniteNoticesParams) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE ?? "";

  const queryKey = useMemo(() => {
    // query 객체를 안정적으로 키에 반영
    return ["notices", { pageSize, ...query }];
  }, [pageSize, query]);

  // ✨ v5 규약에 맞춰 pageParam: unknown 처리
  const fetchPage = async (
    { pageParam }: { pageParam: unknown }
  ): Promise<IPagedResponse<Notice>> => {
    const offset = Number(pageParam) || 0;

    const params = toUrlSearchParams({
      limit: pageSize,
      offset,
      q: query.q,
      sort: query.sort,
      my: query.my,
      category: query.category,
      sourceCollege: query.sourceCollege,
      dateRange: query.dateRange,
    });

    const url = `${baseUrl}/notices?${params.toString()}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(`Failed to load notices: ${res.status}`);
    }

    // 백엔드 응답 예시 가정:
    // { items: Notice[], total: number, nextOffset?: number, hasNextPage?: boolean }
    const data = (await res.json()) as IPagedResponse<Notice>;

    // nextOffset/hasNextPage 중 하나만 오는 경우 대비해 보강
    const computedHasNext =
      typeof data.hasNextPage === "boolean"
        ? data.hasNextPage
        : typeof data.nextOffset === "number";

    return {
      items: data.items ?? [],
      total: data.total,
      nextOffset:
        typeof data.nextOffset === "number"
          ? data.nextOffset
          : (offset + (data.items?.length ?? 0)) || undefined,
      hasNextPage: computedHasNext,
    };
  };

  return useInfiniteQuery({
    queryKey,
    queryFn: fetchPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage?.hasNextPage && typeof lastPage.nextOffset === "number") {
        return lastPage.nextOffset;
      }
      // items가 pageSize만큼 왔으면 다음 페이지가 있을 가능성
      if ((lastPage?.items?.length ?? 0) >= pageSize) {
        return (lastPage?.nextOffset ?? 0) + pageSize;
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
  });
}
