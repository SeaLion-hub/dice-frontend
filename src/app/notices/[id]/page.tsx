"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import type { Notice } from "@/types/notices";
import { useNoticeDetail, useNoticeEligibility } from "@/hooks/useNoticeQueries";
import { EligibilityResult } from "@/components/notices/EligibilityResult";
import { CalendarButton } from "@/components/notices/CalendarButton";

export default function NoticeDetailPage() {
  // 1) URL 파라미터에서 id 추출
  const params = useParams<{ id: string }>();
  const id = params?.id?.toString() ?? null;

  // 2) 데이터 훅 호출
  const {
    data: noticeData,
    isLoading: isDetailLoading,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useNoticeDetail(id);

  const {
    data: eligibilityData,
    isLoading: isEligibilityLoading,
    isError: isEligibilityError,
    refetch: refetchEligibility,
  } = useNoticeEligibility(id);

  // 3) 캘린더 추가 콜백
  const handleCalendarAdd = (eventDate: Date) => {
    console.log("캘린더에 추가할 날짜:", eventDate);
    alert(`임시: 캘린더에 ${eventDate.toLocaleDateString()} 일정을 추가합니다.`);
  };

  return (
    <main className="mx-auto mb-20 max-w-3xl px-4 py-6">
      {/* 상단: 제목 + 캘린더 버튼 */}
      <header className="mb-6">
        {isDetailLoading ? (
          <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {noticeData?.title ?? "제목 없음"}
            </h1>

            {/* 캘린더 버튼 (유효한 날짜가 있을 때만 노출) */}
            <CalendarButton
              notice={noticeData as Notice | undefined}
              onAddEvent={handleCalendarAdd}
            />
          </div>
        )}
      </header>

      {/* 본문 */}
      <section className="mb-10">
        {isDetailLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-gray-200" />
          </div>
        ) : isDetailError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            상세 정보를 불러오는 중 오류가 발생했습니다.{" "}
            <button className="underline" onClick={() => refetchDetail()}>
              다시 시도
            </button>
          </div>
        ) : (
          <article className="prose max-w-none">
            {/* 중요한 요구사항: raw_text는 '순수 텍스트'이므로 줄바꿈 표시 */}
            <div className="whitespace-pre-line text-[15px] leading-7 text-gray-800">
              {noticeData?.raw_text || noticeData?.body || "내용이 없습니다."}
            </div>
          </article>
        )}
      </section>

      {/* 자격 분석 결과 카드 */}
      <section className="mb-8">
        {isEligibilityError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            자격 분석 결과를 불러오지 못했습니다.{" "}
            <button className="underline" onClick={() => refetchEligibility()}>
              다시 시도
            </button>
          </div>
        ) : (
          <EligibilityResult
            data={eligibilityData}
            isLoading={isEligibilityLoading}
          />
        )}
      </section>
    </main>
  );
}
