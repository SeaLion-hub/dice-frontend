// frontend/src/hooks/useNoticePreferences.ts

"use client";

import { create } from "zustand";

export type NoticeTab = "custom" | "all";
export type NoticeSort = "recent" | "deadline" | "oldest";

export interface NoticeFilters {
  // hashtags_ai / category_ai 기반
  category: string;
  sourceCollege: string;
  // e.g. "7d", "30d", "all"
  dateRange: string;
}

interface NoticePreferencesState {
  // state
  tab: NoticeTab;
  searchQuery: string;
  sort: NoticeSort;
  filters: NoticeFilters;

  // actions
  setTab: (tab: NoticeTab) => void;
  setSearchQuery: (q: string) => void;
  setSort: (s: NoticeSort) => void;
  setFilters: (f: Partial<NoticeFilters>) => void;
  reset: () => void;
}

const LS_KEY = "notice_prefs_v1";

const defaultState: Pick<NoticePreferencesState, "tab" | "searchQuery" | "sort" | "filters"> = {
  tab: "custom",
  searchQuery: "",
  sort: "recent",
  filters: {
    category: "all",
    sourceCollege: "all",
    dateRange: "30d",
  },
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type PersistShape = {
  tab: NoticeTab;
  searchQuery: string;
  sort: NoticeSort;
  filters: NoticeFilters;
};

export const useNoticePreferences = create<NoticePreferencesState>((set, get) => {
  // 1) 초기화: LocalStorage에서 가져오기 (클라이언트에서만)
  let initFromStorage: Partial<PersistShape> = {};
  if (typeof window !== "undefined") {
    const parsed = safeParse<PersistShape>(window.localStorage.getItem(LS_KEY));
    if (parsed) {
      initFromStorage = parsed;
    }
  }

  // 2) 내부 persist 함수
  function persist() {
    if (typeof window === "undefined") return;
    const { tab, searchQuery, sort, filters } = get();
    try {
      window.localStorage.setItem(
        LS_KEY,
        JSON.stringify({ tab, searchQuery, sort, filters })
      );
    } catch {
      // ignore storage errors
    }
  }

  // 3) 액션 구현
  const actions = {
    setTab: (tab: NoticeTab) => set(() => {
      const next = { tab };
      // 바로 저장
      const merged = { ...get(), ...next };
      // set 이후 저장을 위해 set 콜백 바깥에서 persist 호출
      // 하지만 여기선 set 동기적 적용 후 persist 호출
      queueMicrotask(persist);
      return next;
    }),

    setSearchQuery: (q: string) => set(() => {
      const next = { searchQuery: q };
      queueMicrotask(persist);
      return next;
    }),

    setSort: (s: NoticeSort) => set(() => {
      const next = { sort: s };
      queueMicrotask(persist);
      return next;
    }),

    setFilters: (f: Partial<NoticeFilters>) => set((state) => {
      const nextFilters = { ...state.filters, ...f };
      queueMicrotask(persist);
      return { filters: nextFilters };
    }),

    reset: () => set(() => {
      queueMicrotask(persist);
      return { ...defaultState };
    }),
  } satisfies Omit<NoticePreferencesState, "tab" | "searchQuery" | "sort" | "filters">;

  // 4) 초기 상태 + 액션 반환
  const initial: NoticePreferencesState = {
    ...defaultState,
    ...initFromStorage,
    ...actions,
  };

  return initial;
});
