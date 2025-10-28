"use client";

import { create } from "zustand";

export type NoticeTab = "custom" | "all";

export type NoticeSort = "recent" | "deadline" | "oldest";

export interface NoticeFilters {
  category: string; // hashtags_ai / category_ai 기반
  sourceCollege: string;
  dateRange: string; // e.g. "7d", "30d", "all"
}

interface NoticePreferencesState {
  tab: NoticeTab;
  searchQuery: string;
  sort: NoticeSort;
  filters: NoticeFilters;

  setTab: (tab: NoticeTab) => void;
  setSearchQuery: (q: string) => void;
  setSort: (s: NoticeSort) => void;
  setFilters: (f: Partial<NoticeFilters>) => void;
}

// localStorage sync helpers
const LS_KEY = "noticePrefs.v1";

function loadInitialState(): Partial<NoticePreferencesState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const useNoticePreferences = create<NoticePreferencesState>(
  (set, get) => {
    const init = loadInitialState();

    // defaults
    const defaultState: NoticePreferencesState = {
      tab: "custom",
      searchQuery: "",
      sort: "recent",
      filters: {
        category: "",
        sourceCollege: "",
        dateRange: "all",
      },
      setTab: (tab) => {
        set({ tab });
        persist();
      },
      setSearchQuery: (searchQuery) => {
        set({ searchQuery });
        persist();
      },
      setSort: (sort) => {
        set({ sort });
        persist();
      },
      setFilters: (partial) => {
        set({ filters: { ...get().filters, ...partial } });
        persist();
      },
    };

    function persist() {
      const { tab, searchQuery, sort, filters } = get();
      const data = JSON.stringify({ tab, searchQuery, sort, filters });
      try {
        window.localStorage.setItem(LS_KEY, data);
      } catch {
        // ignore
      }
    }

    return { ...defaultState, ...init };
  }
);
