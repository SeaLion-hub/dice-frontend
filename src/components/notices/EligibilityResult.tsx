import * as React from "react";
import type { NoticeEligibilityResult } from "@/types/notices";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

/**
 * 자격 분석 결과 카드
 * props:
 *  - data: NoticeEligibilityResult | undefined
 *  - isLoading: boolean
 *
 * 변경점:
 *  - data가 존재하지만 data.eligibility가 비어있는 엣지케이스도 안전하게 처리하도록 방어 로직 추가
 */
const ELIGIBILITY_MAP: Record<
  NonNullable<NoticeEligibilityResult["eligibility"]>,
  { icon: string; title: string; color: string; badge: string }
> = {
  ELIGIBLE:   { icon: "✅", title: "신청 가능", color: "text-green-600",  badge: "bg-green-100 text-green-700" },
  BORDERLINE: { icon: "⚠️", title: "정보 부족", color: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
  INELIGIBLE: { icon: "❌", title: "신청 불가", color: "text-red-600",   badge: "bg-red-100 text-red-700" },
};

export function EligibilityResult({
  data,
  isLoading,
}: {
  data: NoticeEligibilityResult | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card aria-busy="true" aria-live="polite">
        <CardHeader>
          <CardTitle>AI 자격 분석 결과</CardTitle>
          <CardDescription>자격 요건 분석 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ data가 있어도 eligibility가 비어있을 수 있으므로 방어
  if (!data || !data.eligibility) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI 자격 분석 결과</CardTitle>
          <CardDescription>
            {isLoading ? "분석 중..." : "AI 자격 분석 데이터가 없습니다."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 여기까지 왔다면 data와 data.eligibility가 모두 존재
  const status = data.eligibility;
  const ui = ELIGIBILITY_MAP[status];

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI 자격 분석 결과</CardTitle>
        {data.checkedAt ? (
          <CardDescription>
            분석 시각: {new Date(data.checkedAt).toLocaleString()}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent>
        {/* 상태 아이콘 + 타이틀 */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {ui.icon}
          </span>
          <span className={`text-lg font-semibold ${ui.color}`}>{ui.title}</span>
          <span
            className={`ml-1 rounded px-2 py-0.5 text-xs ${ui.badge}`}
            aria-label={`분류: ${status}`}
          >
            {status}
          </span>
        </div>

        {/* 사유 영역 */}
        <div className="mt-3">
          <div className="mb-1 text-sm font-medium text-gray-700">분석 사유</div>
          <p className="whitespace-pre-wrap rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-800">
            {data.reason || "사유 정보가 제공되지 않았습니다."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
