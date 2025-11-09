// src/hooks/useNoticePreferences.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
type NoticeTab = 'all' | 'my';
type NoticeSort = 'recent' | 'oldest';
type NoticeFilters = Record<string, unknown>;

import type { Notice } from '@/types/notices';

function parseCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSec = 60 * 60 * 24 * 7) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

export function useNoticePreferences() {
  // ===== 토큰 상태 =====
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fromLS = window.localStorage.getItem('authToken');
    if (fromLS) {
      setTokenState(fromLS);
      return;
    }
    const fromCookie = parseCookie('auth_token');
    if (fromCookie) {
      setTokenState(fromCookie);
    }
  }, []);

  const setToken = useCallback((next: string | null) => {
    if (typeof window === 'undefined') return;
    if (next) {
      window.localStorage.setItem('authToken', next);
      writeCookie('auth_token', next);
      setTokenState(next);
    } else {
      window.localStorage.removeItem('authToken');
      writeCookie('auth_token', '', -1);
      setTokenState(null);
    }
  }, []);

  const hasToken = useMemo(() => !!token, [token]);

  // ===== 공지 목록 페이지 상태 =====
  const [tab, setTab] = useState<NoticeTab>('all');            // 'all' | 'my'
  const [searchQuery, setSearchQuery] = useState<string>('');   // 검색어

  // [변경] 기본 정렬: 'recent'
  const [sort, setSort] = useState<NoticeSort>('recent');       // 'recent' | 'oldest'

  // 필터 상태 (머지 가능한 setter 제공)
  const [filtersState, setFiltersState] = useState<NoticeFilters>({});
  const setFilters = useCallback(
    (patch: Partial<NoticeFilters>) => {
      setFiltersState((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  return {
    // 토큰
    token,
    setToken,
    hasToken,

    // 공지 페이지 상태
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    filters: filtersState,
    setFilters,
  };
}
