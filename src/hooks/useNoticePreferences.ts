import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LS_KEYS } from "@/lib/constants";

export type NoticeSort = "recent" | "oldest";
export type DateRange = "" | "1d" | "1w" | "1m" | "all";

export type NoticeFilters = {
  categories?: string[];    // 예: ["#장학", "#수강신청"]
  sourceCollege?: string;   // e.g. "eng", "biz" ...
  dateRange?: DateRange;    // "" | "1d" | "1w" | "1m" | "all"
};

type Tab = "my" | "all";

export type NoticePreferencesState = {
  tab: Tab;
  searchQuery: string;
  sort: NoticeSort;
  filters: NoticeFilters;
};

type NoticePreferencesActions = {
  setTab: (tab: Tab) => void;
  setSearchQuery: (q: string) => void;
  setSort: (s: NoticeSort) => void;
  /**
   * 부분 업데이트를 안전하게 병합합니다.
   * 예) setFilters({ categories: ["#장학", "#취업"] })
   */
  setFilters: (partial: Partial<NoticeFilters> | ((prev: NoticeFilters) => Partial<NoticeFilters>)) => void;
};

const LS_KEY = LS_KEYS.NOTICE_PREFS;

const defaultState: NoticePreferencesState = {
  tab: "all",
  searchQuery: "",
  sort: "recent",
  filters: {
    categories: [],
    sourceCollege: "",
    dateRange: "all",
  },
};

/** localStorage -> 객체 파싱(실패 시 안전한 fallback) */
function readFromStorage(): Partial<NoticePreferencesState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return null;
  }
}

/** 저장 (필수 필드만 저장하도록 정리) */
function writeToStorage(next: NoticePreferencesState) {
  if (typeof window === "undefined") return;
  const toSave: NoticePreferencesState = {
    tab: next.tab,
    searchQuery: next.searchQuery,
    sort: next.sort,
    filters: {
      categories: Array.isArray(next.filters?.categories) ? next.filters.categories : [],
      sourceCollege: next.filters?.sourceCollege ?? "",
      dateRange: (next.filters?.dateRange ?? "all") as DateRange,
    },
  };
  localStorage.setItem(LS_KEY, JSON.stringify(toSave));
}

/**
 * 🔐 안전 초기화:
 * - 얕은 전개로 filters가 빈 객체 `{}`에 의해 덮어씌워지지 않도록,
 *   filters만 별도로 깊게 병합(deep merge)합니다.
 */
export function useNoticePreferences(): NoticePreferencesState & NoticePreferencesActions {
  const initRef = useRef<NoticePreferencesState | null>(null);

  if (initRef.current == null) {
    const initFromStorage = readFromStorage() ?? {};

    // ① 베이스
    let initial: NoticePreferencesState = {
      ...defaultState,
      ...initFromStorage,
      // ② filters만 별도 병합 (핵심 수정 포인트)
      filters: {
        ...defaultState.filters,
        ...(initFromStorage.filters || {}),
      },
    };

    // 레거시 category(string) → categories(string[]) 마이그레이션
    const legacyCategory = (initFromStorage as any)?.filters?.category;
    if (legacyCategory && !initial.filters.categories?.length) {
      if (Array.isArray(legacyCategory)) {
        initial.filters.categories = legacyCategory.filter(Boolean);
      } else if (typeof legacyCategory === "string" && legacyCategory.trim()) {
        initial.filters.categories = [legacyCategory.trim()];
      }
    }

    if (!Array.isArray(initial.filters.categories)) {
      initial.filters.categories = [];
    }

    initRef.current = initial;
  }

  const [state, setState] = useState<NoticePreferencesState>(initRef.current!);

  // 변경 추적하여 저장
  useEffect(() => {
    writeToStorage(state);
  }, [state]);

  const setTab = useCallback<NoticePreferencesActions["setTab"]>((tab) => {
    setState((s) => ({ ...s, tab }));
  }, []);

  const setSearchQuery = useCallback<NoticePreferencesActions["setSearchQuery"]>((q) => {
    setState((s) => ({ ...s, searchQuery: q }));
  }, []);

  const setSort = useCallback<NoticePreferencesActions["setSort"]>((sort) => {
    setState((s) => ({ ...s, sort }));
  }, []);

  const setFilters = useCallback<NoticePreferencesActions["setFilters"]>((partial) => {
    setState((s) => {
      const patch = typeof partial === "function" ? partial(s.filters) : partial;
      return {
        ...s,
        filters: {
          ...s.filters,
          ...patch,
        },
      };
    });
  }, []);

  return useMemo(
    () => ({
      ...state,
      setTab,
      setSearchQuery,
      setSort,
      setFilters,
    }),
    [state, setTab, setSearchQuery, setSort, setFilters]
  );
}
