// src/hooks/useNoticeQueries.ts

import { useMemo, useCallback } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

// 1. 필요한 모듈을 모두 import 합니다.
import { useQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import type { Notice } from "@/types/notices"; // page.tsx에서 필요
import { EligibilityResult } from "@/components/notices/EligibilityResult"; // page.tsx에서 필요

// 2. API_BASE 환경 변수를 정의합니다.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// 3. EligibilityResult 컴포넌트의 'data' prop 타입을 정확하게 추론합니다.
//    이것이 Eligibility 훅이 반환해야 할 데이터의 타입입니다.
type EligibilityDataType = ComponentProps<typeof EligibilityResult>["data"];

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

// --- 4. 기존 useNoticeQueries 훅 (API_BASE 경로 수정) ---
export function useNoticeQueries() {
  const token = useAuthStore((s) => s.token);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const fetchWithAuth: FetchLike = useCallback(
    (input, init) => {
      const baseHeaders: HeadersInit = {
        ...(init?.headers || {}),
        ...(authHeaders as Record<string, string>),
      };

      const inputStr = input.toString();
      
      // /api/로 시작하는 경로는 Next.js API 라우트이므로 상대 경로로 사용
      // http로 시작하는 경로는 절대 URL로 사용
      // 그 외의 경우는 API_BASE를 붙임
      const url =
        inputStr.startsWith("http") || inputStr.startsWith("/api/")
          ? input
          : `${API_BASE}${input}`;

      return fetch(url, { ...init, headers: baseHeaders });
    },
    [authHeaders]
  );

  return { token, fetchWithAuth, authHeaders };
}

// --- 5. [추가] useNoticeDetail 훅 ---
// page.tsx에서 import합니다.
export function useNoticeDetail(id: string | null) {
  const { fetchWithAuth } = useNoticeQueries();

  return useQuery<Notice>({
    queryKey: ["notice", "detail", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      // 백엔드 엔드포인트 (예: /api/notices/123)
      const res = await fetchWithAuth(`/api/notices/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch notice detail");
      }
      return res.json();
    },
    enabled: !!id, // id가 있을 때만 쿼리 실행
  });
}

// --- 6. [추가] useNoticeEligibility 훅 ---
// page.tsx에서 import합니다.
// POST /api/notices/[id]/verify 엔드포인트를 통해 백엔드의 POST /notices/{notice_id}/verify-eligibility 호출
export function useNoticeEligibility(id: string | null, enabled: boolean = true) {
  const { fetchWithAuth } = useNoticeQueries();

  // 위에서 추론한 EligibilityDataType을 반환 타입으로 사용합니다.
  return useQuery<EligibilityDataType>({
    queryKey: ["notice", "eligibility", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      // POST /api/notices/{id}/verify 엔드포인트 호출
      const res = await fetchWithAuth(`/api/notices/${id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch notice eligibility");
      }
      return res.json();
    },
    enabled: !!id && enabled, // id가 있고 enabled가 true일 때만 쿼리 실행
  });
}