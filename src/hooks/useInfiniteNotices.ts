// src/hooks/useInfiniteNotices.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Notice, Paginated } from '@/types/notices';

interface UseInfiniteNoticesOptions {
  pageSize?: number;
  query?: Record<string, string | number | boolean | undefined>;
}

const fetchNoticesPage = async ({
  pageParam,
  pageSize,
  query,
}: {
  pageParam: number;
  pageSize: number;
  query?: UseInfiniteNoticesOptions['query'];
}) => {
  const q = new URLSearchParams();
  q.set('page', String(pageParam));
  q.set('size', String(pageSize));
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.set(k, String(v));
    });
  }

  const res = await axios.get<Paginated<Notice>>(`/api/notices?${q.toString()}`);
  return res.data;
};

export function useInfiniteNotices(options: UseInfiniteNoticesOptions = {}) {
  const { pageSize = 20, query } = options;

  return useInfiniteQuery({
    queryKey: ['notices', query, pageSize],
    queryFn: ({ pageParam = 1 }) =>
      fetchNoticesPage({ pageParam, pageSize, query }),
    getNextPageParam: (lastPage) => {
      const { page, size, total } = lastPage;
      const maxPage = Math.ceil(total / size);
      return page < maxPage ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}
