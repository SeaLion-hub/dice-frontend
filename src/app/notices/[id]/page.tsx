"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ArrowLeft } from "lucide-react";

import type { Notice } from "@/types/notices";
import { useNoticeDetail, useNoticeEligibility } from "@/hooks/useNoticeQueries";
import { EligibilityResult } from "@/components/notices/EligibilityResult";
import { CalendarButton } from "@/components/notices/CalendarButton";
import { Button } from "@/components/ui/button";

export default function NoticeDetailPage() {
  const router = useRouter();
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

  // qualification_ai가 있을 때만 eligibility 데이터 조회
  // noticeData가 로드되고 qualification_ai가 있을 때만 조회
  const shouldFetchEligibility = !!id && !!noticeData?.qualification_ai;
  const {
    data: eligibilityData,
    isLoading: isEligibilityLoading,
    isError: isEligibilityError,
    refetch: refetchEligibility,
  } = useNoticeEligibility(id, shouldFetchEligibility);


  return (
    <main className="mx-auto mb-20 max-w-3xl px-4 py-6 animate-in fade-in duration-300">
      {/* 뒤로가기 버튼 */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로
        </Button>
      </div>

      {/* 상단: 제목 + 캘린더 버튼 */}
      <header className="mb-6">
        {isDetailLoading ? (
          <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {noticeData?.title ?? "제목 없음"}
            </h1>

            {/* 캘린더 버튼 (start_at_ai 또는 end_at_ai가 있을 때만 노출) */}
            {noticeData && (noticeData.start_at_ai || noticeData.end_at_ai) && (
              <CalendarButton notice={noticeData} />
            )}
          </div>
        )}
      </header>

      {/* 원본 링크 */}
      {noticeData?.url && (
        <div className="mb-4">
          <Link
            href={noticeData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            원본 공지 보기
          </Link>
        </div>
      )}

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
            {noticeData?.body_html ? (
              <div
                className="text-[15px] leading-7 text-gray-800"
                dangerouslySetInnerHTML={{ __html: noticeData.body_html }}
              />
            ) : (
              <div className="whitespace-pre-line text-[15px] leading-7 text-gray-800">
                {noticeData?.raw_text || noticeData?.body || "내용이 없습니다."}
              </div>
            )}
          </article>
        )}
      </section>

      {/* 자격 분석 결과 카드 (qualification_ai가 있을 때만 렌더링) */}
      {noticeData?.qualification_ai && (
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
      )}
    </main>
  );
}
