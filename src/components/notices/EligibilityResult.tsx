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

  // data가 있어도 eligibility가 비어있을 수 있으므로 방어
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

  const status = data.eligibility;
  const ui = status ? ELIGIBILITY_MAP[status] : ELIGIBILITY_MAP.ELIGIBLE;

  const reasons =
    (Array.isArray(data.reasons_human) && data.reasons_human.length > 0
      ? data.reasons_human
      : Array.isArray(data.reasons)
      ? data.reasons
      : []) as string[];

  const criteria = data.criteria_results ?? {};
  const passList = Array.isArray(criteria.pass) ? criteria.pass : [];
  const failList = Array.isArray(criteria.fail) ? criteria.fail : [];
  const verifyList = Array.isArray(criteria.verify) ? criteria.verify : [];

  const missingInfo = Array.isArray(data.missing_info) ? data.missing_info : [];

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

        <div className="mt-4 space-y-4">
          {((failList.length > 0 || verifyList.length > 0 || passList.length > 0) || reasons.length > 0) && (
            <div>
              <div className="mb-2 text-sm font-semibold text-gray-700">분석 코멘트</div>
              <div className="space-y-3">
                {(failList.length > 0 || verifyList.length > 0 || passList.length > 0) && (
                  <div className="grid gap-3">
                    {failList.length > 0 && (
                      <SummaryList
                        title="미충족"
                        tone="fail"
                        items={failList}
                        ariaLabel="미충족 요건 목록"
                      />
                    )}
                    {verifyList.length > 0 && (
                      <SummaryList
                        title="확인 필요"
                        tone="verify"
                        items={verifyList}
                        ariaLabel="추가 확인이 필요한 요건 목록"
                      />
                    )}
                    {passList.length > 0 && (
                      <SummaryList
                        title="충족"
                        tone="pass"
                        items={passList}
                        ariaLabel="충족된 요건 목록"
                      />
                    )}
                  </div>
                )}
                {reasons.length > 0 && (
                  <ul className="list-inside list-disc space-y-1 rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-800">
                    {reasons.map((reasonText, i) => (
                      <li key={i}>{reasonText}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {missingInfo.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <div className="font-semibold">추가 입력이 필요해요</div>
              <p className="mt-1">
                아래 정보가 프로필에 없어 정확한 판정이 어렵습니다:
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {missingInfo.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryList({
  title,
  items,
  tone,
  ariaLabel,
}: {
  title: string;
  items: string[];
  tone: "pass" | "fail" | "verify";
  ariaLabel: string;
}) {
  const toneClass =
    tone === "pass"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "fail"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${toneClass}`} aria-label={ariaLabel}>
      <div className="mb-1 font-semibold">{title}</div>
      <ul className="list-inside list-disc space-y-1">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
