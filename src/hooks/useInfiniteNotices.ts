import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { NoticeItem } from "@/types/notices"; // 1. 전역 NoticeItem 타입을 임포트

// 2. 로컬 NoticeItem 타입 정의 제거
// type NoticeItem = { ... };

type UseInfiniteNoticesProps = {
  tab: string;
  limit?: number;
  q?: string;
  sort?: string;
  category_ai?: string;
  source_college?: string;
  date_range?: string;
};

// 3. BackendResponse가 임포트한 NoticeItem을 사용
type BackendResponse = {
  items: NoticeItem[];
  total_count: number;
};

export const useInfiniteNotices = ({
  tab,
  limit = 20,
  q,
  sort,
  category_ai,
  source_college,
  date_range,
}: UseInfiniteNoticesProps) => {
  return useInfiniteQuery<
    // 4. useInfiniteQuery의 제네릭 타입이 임포트한 NoticeItem을 사용
    { items: NoticeItem[]; offset: number; totalCount: number },
    Error,
    { items: NoticeItem[]; offset: number; totalCount: number },
    (string | undefined)[],
    number
  >({
    queryKey: ["notices", tab, q, sort, category_ai, source_college, date_range],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        tab,
        limit,
        offset: pageParam,
        ...(q && { q }),
        ...(sort && { sort }),
        ...(category_ai && { category_ai }),
        ...(source_college && { source_college }),
        ...(date_range && { date_range }),
      };

      const { data } = await axios.get<BackendResponse>("/api/notices", {
        params,
      });
      return {
        items: data.items,
        offset: pageParam,
        totalCount: data.total_count,
      };
    },
    getNextPageParam: (lastPage, _allPages) => {
      const nextOffset = lastPage.offset + limit;
      return nextOffset < lastPage.totalCount ? nextOffset : undefined;
    },
  });
};