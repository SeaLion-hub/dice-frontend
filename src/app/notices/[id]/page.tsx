"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import DOMPurify from "dompurify";

import type { Notice } from "@/types/notices";
import { useNoticeDetail, useNoticeEligibility } from "@/hooks/useNoticeQueries";
import { EligibilityResult } from "@/components/notices/EligibilityResult";
import { CalendarButton } from "@/components/notices/CalendarButton";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/stores/useCalendarStore";

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

  const shouldFetchEligibility = !!id;
  const {
    data: eligibilityData,
    isLoading: isEligibilityLoading,
    isError: isEligibilityError,
    refetch: refetchEligibility,
  } = useNoticeEligibility(id, shouldFetchEligibility);

  const isLoading = isDetailLoading || isEligibilityLoading;

  const addCalendarEvent = useCalendarStore((state) => state.addEvent);
  const [autoAdded, setAutoAdded] = React.useState(false);

  React.useEffect(() => {
    setAutoAdded(false);
  }, [id]);

  const sanitizedBody = React.useMemo(() => {
    if (!noticeData?.body_html) return null;
    return DOMPurify.sanitize(noticeData.body_html);
  }, [noticeData?.body_html]);

  React.useEffect(() => {
    if (!noticeData || autoAdded) return;
    const startStr = noticeData.start_at_ai ?? noticeData.end_at_ai ?? null;
    if (!startStr) return;
    const startDate = new Date(startStr);
    if (Number.isNaN(startDate.getTime())) return;

    let endDate: Date | null = null;
    if (noticeData.end_at_ai) {
      const parsedEnd = new Date(noticeData.end_at_ai);
      if (!Number.isNaN(parsedEnd.getTime())) {
        endDate = parsedEnd;
      }
    }

    const result = addCalendarEvent({
      noticeId: noticeData.id,
      title: noticeData.title || "공지사항",
      startDate,
      endDate,
      source: "auto",
    });

    if (result.status === "added" || result.status === "duplicate") {
      setAutoAdded(true);
    }
  }, [noticeData, autoAdded, addCalendarEvent]);

  const postedAt = noticeData?.posted_at ?? (noticeData as any)?.postedAt ?? null;

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
          <h1 className="text-2xl font-semibold text-gray-900">
            {noticeData?.title ?? "제목 없음"}
          </h1>
        )}
      </header>

      <div className="space-y-4 md:grid md:grid-cols-[minmax(0,1fr)_320px] md:gap-6 md:space-y-0">
        <section className="mb-10 md:mb-0">
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
              {sanitizedBody ? (
                <div
                  className="text-[15px] leading-7 text-gray-800"
                  dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                />
              ) : (
                <div className="whitespace-pre-line text-[15px] leading-7 text-gray-800">
                  {noticeData?.raw_text || noticeData?.body || "내용이 없습니다."}
                </div>
              )}
            </article>
          )}
        </section>

        <aside className="space-y-6 md:sticky md:top-24">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">공지 정보</h2>
            <dl className="mt-3 space-y-2 text-xs text-gray-600">
              {noticeData?.source_college && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-700">출처</dt>
                  <dd className="text-gray-600">{noticeData.source_college}</dd>
                </div>
              )}
              {postedAt && (
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-700">게시일</dt>
                  <dd className="text-gray-600">
                    {new Date(postedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              )}
              {(noticeData?.start_at_ai || noticeData?.end_at_ai) && (
                <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  <CalendarIcon className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">AI 추출 일정</p>
                    <p>
                      {noticeData.start_at_ai
                        ? new Date(noticeData.start_at_ai).toLocaleString("ko-KR")
                        : "시작일 미정"}
                    </p>
                    {noticeData.end_at_ai && (
                      <p>
                        ~ {new Date(noticeData.end_at_ai).toLocaleString("ko-KR")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </dl>
            {noticeData?.url && (
              <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-center">
                <Link href={noticeData.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> 원본 공지 보기
                </Link>
              </Button>
            )}
          </div>

          {noticeData && (noticeData.start_at_ai || noticeData.end_at_ai) && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">일정 관리</h2>
              <p className="mt-1 text-xs text-gray-500">
                일정 정보를 내 캘린더에 저장해 두고 잊지 마세요.
              </p>
              <div className="mt-3">
                <CalendarButton notice={noticeData} />
              </div>
              {autoAdded && (
                <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                  이 일정은 자동으로 서비스 캘린더에 저장되었습니다.
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">자격 분석</h2>
            {isEligibilityError ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                자격 분석 결과를 불러오지 못했습니다.{" "}
                <button className="underline" onClick={() => refetchEligibility()}>
                  다시 시도
                </button>
              </div>
            ) : (
              <EligibilityResult data={eligibilityData} isLoading={isLoading} />
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
