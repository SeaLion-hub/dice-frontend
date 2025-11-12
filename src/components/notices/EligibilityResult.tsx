import * as React from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Info } from "lucide-react";
import type { NoticeEligibilityResult } from "@/types/notices";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * 자격 분석 결과 카드
 * props:
 *  - data: NoticeEligibilityResult | undefined
 *  - isLoading: boolean
 */
const ELIGIBILITY_MAP: Record<
  NonNullable<NoticeEligibilityResult["eligibility"]>,
  { icon: React.ReactNode; title: string; color: string; badge: string; bgColor: string; borderColor: string }
> = {
  ELIGIBLE: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "신청 가능",
    color: "text-green-700",
    badge: "bg-green-100 text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  BORDERLINE: {
    icon: <AlertCircle className="h-6 w-6" />,
    title: "정보 부족",
    color: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  INELIGIBLE: {
    icon: <XCircle className="h-6 w-6" />,
    title: "신청 불가",
    color: "text-red-700",
    badge: "bg-red-100 text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

// missing_info 필드를 프로필 필드 ID로 매핑
const MISSING_INFO_FIELD_MAP: Record<string, string> = {
  gpa: "gpa",
  grade: "grade",
  major: "major",
  income: "income_bracket",
  income_bracket: "income_bracket",
  military: "military_service",
  military_service: "military_service",
  gender: "gender",
  language: "languageScores",
  language_scores: "languageScores",
};

// 필드명을 한글로 변환
const FIELD_LABELS: Record<string, string> = {
  gpa: "학점",
  grade: "학년",
  major: "전공",
  income_bracket: "소득 분위",
  military_service: "병역",
  gender: "성별",
  languageScores: "어학 점수",
};

export function EligibilityResult({
  data,
  isLoading,
}: {
  data: NoticeEligibilityResult | undefined;
  isLoading: boolean;
}) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleExpand = (item: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card aria-busy="true" aria-live="polite" className="animate-in fade-in duration-300">
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
      <Card className="animate-in fade-in duration-300">
        <CardHeader>
          <CardTitle>AI 자격 분석 결과</CardTitle>
          <CardDescription>
            {isLoading ? "분석 중..." : "AI 자격 분석 데이터가 없습니다."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 정보성 공지인 경우 결과를 표시하지 않음
  const reasonCodes = Array.isArray(data.reason_codes) ? data.reason_codes : [];
  if (reasonCodes.includes("INFO_NOTICE")) {
    return null;
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

  // verifyList와 missingInfo 중복 제거 (verifyList에 있는 항목은 missingInfo에서 제외)
  const filteredMissingInfo = missingInfo.filter((item) => {
    const lowerItem = item.toLowerCase();
    return !verifyList.some((verifyItem) => verifyItem.toLowerCase().includes(lowerItem) || lowerItem.includes(verifyItem.toLowerCase()));
  });

  // 전체 요건 수 계산
  const totalCriteria = passList.length + failList.length + verifyList.length;
  const passPercentage = totalCriteria > 0 ? Math.round((passList.length / totalCriteria) * 100) : 0;

  // missing_info에서 필드 ID 추출
  const getFieldId = (missingItem: string): string | null => {
    const lower = missingItem.toLowerCase();
    for (const [key, fieldId] of Object.entries(MISSING_INFO_FIELD_MAP)) {
      if (lower.includes(key)) {
        return fieldId;
      }
    }
    return null;
  };

  const getFieldLabel = (fieldId: string | null): string => {
    if (!fieldId) return "프로필 정보";
    return FIELD_LABELS[fieldId] || fieldId;
  };

  return (
    <Card className={`animate-in fade-in duration-300 ${ui.bgColor} ${ui.borderColor} border-2`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className={ui.color}>{ui.icon}</span>
              AI 자격 분석 결과
            </CardTitle>
            {data.checkedAt ? (
              <CardDescription className="mt-1">
                분석 시각: {new Date(data.checkedAt).toLocaleString("ko-KR")}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 상태 아이콘 + 타이틀 */}
        <div className={`mb-6 flex items-center gap-3 rounded-lg ${ui.bgColor} p-4 border ${ui.borderColor}`}>
          <div className={ui.color}>{ui.icon}</div>
          <div className="flex-1">
            <div className={`text-xl font-bold ${ui.color}`}>{ui.title}</div>
            <div className="mt-1 text-sm text-gray-600">
              {status === "ELIGIBLE" && "모든 자격 요건을 충족합니다."}
              {status === "BORDERLINE" && "일부 정보가 부족하여 추가 확인이 필요합니다."}
              {status === "INELIGIBLE" && "일부 필수 자격 요건을 충족하지 못합니다."}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${ui.badge}`}
            aria-label={`분류: ${status}`}
          >
            {status}
          </span>
        </div>

        {/* 프로그레스 바 - 전체 요건 충족률 */}
        {totalCriteria > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">요건 충족률</span>
              <span className={`text-lg font-bold ${ui.color}`}>{passPercentage}%</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner">
              <div
                className={`h-full transition-all duration-700 ease-out ${
                  status === "ELIGIBLE"
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : status === "BORDERLINE"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                }`}
                style={{ width: `${passPercentage}%` }}
                aria-label={`${passPercentage}% 충족`}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                충족: {passList.length}개
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-600" />
                미충족: {failList.length}개
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                확인 필요: {verifyList.length}개
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {((failList.length > 0 || verifyList.length > 0 || passList.length > 0) || reasons.length > 0) && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-600" />
                <h3 className="text-base font-semibold text-gray-900">상세 분석 결과</h3>
              </div>
              <div className="space-y-3">
                {(failList.length > 0 || verifyList.length > 0 || passList.length > 0) && (
                  <div className="grid gap-3">
                    {failList.length > 0 && (
                      <DetailedSummaryList
                        title="미충족 요건"
                        tone="fail"
                        items={failList}
                        ariaLabel="미충족 요건 목록"
                        expandedItems={expandedItems}
                        onToggleExpand={toggleExpand}
                      />
                    )}
                    {verifyList.length > 0 && (
                      <DetailedSummaryList
                        title="확인 필요"
                        tone="verify"
                        items={verifyList}
                        ariaLabel="추가 확인이 필요한 요건 목록"
                        expandedItems={expandedItems}
                        onToggleExpand={toggleExpand}
                      />
                    )}
                    {passList.length > 0 && (
                      <DetailedSummaryList
                        title="충족된 요건"
                        tone="pass"
                        items={passList}
                        ariaLabel="충족된 요건 목록"
                        expandedItems={expandedItems}
                        onToggleExpand={toggleExpand}
                      />
                    )}
                  </div>
                )}
                {reasons.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-900">종합 의견</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-800">
                      {reasons.map((reasonText, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                          <span>{reasonText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {filteredMissingInfo.length > 0 && (
            <div className="rounded-lg border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-700" />
                  <div className="font-semibold text-amber-900">추가 입력이 필요해요</div>
                </div>
              </div>
              <p className="mb-3 text-sm text-amber-800">
                아래 정보가 프로필에 없어 정확한 판정이 어렵습니다. 프로필을 업데이트하면 더 정확한 분석을 받을 수 있어요.
              </p>
              <div className="space-y-2">
                {filteredMissingInfo.map((item, idx) => {
                  const fieldId = getFieldId(item);
                  const fieldLabel = getFieldLabel(fieldId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-amber-200 bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-sm font-medium text-amber-900">{fieldLabel}</span>
                        <span className="text-xs text-amber-700">({item})</span>
                      </div>
                      {fieldId && (
                        <Link href={`/profile#${fieldId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-amber-300 text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-900"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            추가하기
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailedSummaryList({
  title,
  items,
  tone,
  ariaLabel,
  expandedItems,
  onToggleExpand,
}: {
  title: string;
  items: string[];
  tone: "pass" | "fail" | "verify";
  ariaLabel: string;
  expandedItems: Set<string>;
  onToggleExpand: (item: string) => void;
}) {
  const toneConfig =
    tone === "pass"
      ? {
          border: "border-emerald-200",
          bg: "bg-emerald-50",
          text: "text-emerald-800",
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          iconBg: "bg-emerald-100",
        }
      : tone === "fail"
      ? {
          border: "border-red-200",
          bg: "bg-red-50",
          text: "text-red-800",
          icon: <XCircle className="h-4 w-4 text-red-600" />,
          iconBg: "bg-red-100",
        }
      : {
          border: "border-amber-200",
          bg: "bg-amber-50",
          text: "text-amber-800",
          icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
          iconBg: "bg-amber-100",
        };

  return (
    <div
      className={`rounded-lg border-2 ${toneConfig.border} ${toneConfig.bg} shadow-sm`}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-full p-1.5 ${toneConfig.iconBg}`}>{toneConfig.icon}</div>
          <div>
            <div className={`font-semibold ${toneConfig.text}`}>{title}</div>
            <div className="text-xs text-gray-600">{items.length}개 항목</div>
          </div>
        </div>
      </div>
      <div className={`border-t ${toneConfig.border} px-4 py-2`}>
        <div className="space-y-2">
          {items.map((item, idx) => {
            const itemKey = `${title}-${idx}`;
            const isExpanded = expandedItems.has(itemKey);
            const hasDetails = item.length > 50 || item.includes("(") || item.includes("요구") || item.includes("보유");

            return (
              <div
                key={idx}
                className={`rounded-md border ${toneConfig.border} bg-white/60 transition-all ${
                  isExpanded ? "shadow-sm" : ""
                }`}
              >
                <button
                  onClick={() => hasDetails && onToggleExpand(itemKey)}
                  className={`w-full px-3 py-2.5 text-left text-sm ${toneConfig.text} ${
                    hasDetails ? "cursor-pointer hover:bg-white/80" : ""
                  }`}
                  disabled={!hasDetails}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        <span className="flex-1 font-medium">{item}</span>
                      </div>
                      {isExpanded && hasDetails && (
                        <div className="mt-2 ml-4 rounded-md bg-gray-50 p-2.5 text-xs text-gray-700">
                          <div className="mb-1 font-semibold text-gray-900">상세 설명</div>
                          <div className="space-y-1">
                            {item.includes("학점") && (
                              <p>• 학점 요건은 4.5점 만점 기준으로 비교됩니다.</p>
                            )}
                            {item.includes("어학") && (
                              <p>• 어학 점수는 시험 종류별로 정규화하여 비교됩니다.</p>
                            )}
                            {item.includes("전공") && (
                              <p>• 전공 요건은 단과대학 및 계열 정보를 포함하여 비교됩니다.</p>
                            )}
                            {item.includes("학년") && (
                              <p>• 학년/학기 요건은 현재 학기 기준으로 판단됩니다.</p>
                            )}
                            {item.includes("소득") && (
                              <p>• 소득분위는 0~10분위 기준으로 비교됩니다.</p>
                            )}
                            {item.includes("확인 필요") && (
                              <p>• 공지 원문을 직접 확인하여 정확한 요건을 파악해주세요.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {hasDetails && (
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
