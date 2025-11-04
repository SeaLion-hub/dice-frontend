import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

type NoticeItem = {
  id: string;
  title: string;
  source_college: string;
  created_at: string;
  hashtags_ai: string[];
  view_count: number;
  deadline: string | null;
  summary_raw?: string;
  category_ai?: string;
  read?: boolean;
};

type UseInfiniteNoticesProps = {
  tab: string;
  limit?: number;
  q?: string;
  sort?: string;
  category_ai?: string;
  source_college?: string;
  date_range?: string;
};

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
