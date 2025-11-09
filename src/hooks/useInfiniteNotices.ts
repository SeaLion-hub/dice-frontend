// src/hooks/useInfiniteNotices.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Notice, Paginated } from '@/types/notices';
import { useNoticePreferences } from '@/hooks/useNoticePreferences';

export interface UseInfiniteNoticesOptions {
  pageSize?: number;
  query?: Record<string, string | number | boolean | undefined>;
}

const fetchNoticesPage = async ({
  pageParam,
  pageSize,
  query,
  token,
}: {
  pageParam: number;
  pageSize: number;
  query?: UseInfiniteNoticesOptions['query'];
  token: string | null;
}) => {
  const q = new URLSearchParams();
  q.set('page', String(pageParam));
  q.set('size', String(pageSize));

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) {
        q.set(k, String(v));
      }
    });
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await axios.get<Paginated<Notice>>(`/api/notices?${q.toString()}`, {
    headers,
  });
  return res.data;
};

export function useInfiniteNotices(options: UseInfiniteNoticesOptions = {}) {
  const { pageSize = 20, query } = options;
  const { token } = useNoticePreferences(); // 토큰 가져오기

  return useInfiniteQuery({
    queryKey: ['notices', query, pageSize, token], // 토큰 포함
    queryFn: ({ pageParam = 1 }) =>
      fetchNoticesPage({ pageParam, pageSize, query, token }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, size, total } = lastPage ?? { page: 1, size: pageSize, total: 0 };
      const loaded = page * size;
      return loaded < total ? page + 1 : undefined;
    },
  });
}
