"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import DOMPurify from "dompurify";

import type { Notice, NoticeQualificationAI } from "@/types/notices";
import { useNoticeDetail, useNoticeEligibility } from "@/hooks/useNoticeQueries";
import { EligibilityResult } from "@/components/notices/EligibilityResult";
import { CalendarButton } from "@/components/notices/CalendarButton";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useInfiniteNotices } from "@/hooks/useInfiniteNotices";
import NoticeCard from "@/components/notices/NoticeCard";
import { useApiError } from "@/hooks/useApiError";
import { NoticeCardSkeleton } from "@/components/notices/NoticeCardSkeleton";

export default function NoticeDetailPage() {
  const router = useRouter();
  const { getErrorMessage } = useApiError();
  
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

  // 정보성 공지 여부 확인 (#일반 태그가 있는지) - 자격 분석 API 호출 여부 결정
  const isInformationalNoticeForFetch = React.useMemo(() => {
    if (!noticeData) return false;
    const hashtags = noticeData?.hashtags_ai ?? [];
    return Array.isArray(hashtags) && hashtags.includes("#일반");
  }, [noticeData]);

  // 자격 분석은 정보성 공지가 아닐 때만 호출
  const shouldFetchEligibility = !!id && !isInformationalNoticeForFetch;
  const {
    data: eligibilityData,
    isLoading: isEligibilityLoading,
    isError: isEligibilityError,
    refetch: refetchEligibility,
  } = useNoticeEligibility(id, shouldFetchEligibility);

  const isLoading = isDetailLoading || (shouldFetchEligibility && isEligibilityLoading);

  const addCalendarEvent = useCalendarStore((state) => state.addEvent);
  const [keyDateStatus, setKeyDateStatus] = React.useState<Record<string, "added" | "duplicate">>({});
  const keyDateTimeouts = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  React.useEffect(() => {
    setKeyDateStatus({});
    Object.values(keyDateTimeouts.current).forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    keyDateTimeouts.current = {};
  }, [id]);

  React.useEffect(() => {
    return () => {
      Object.values(keyDateTimeouts.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      keyDateTimeouts.current = {};
    };
  }, []);

  const qualificationAI = React.useMemo<NoticeQualificationAI | null>(() => {
    return normalizeQualificationAI(noticeData?.qualification_ai as unknown);
  }, [noticeData?.qualification_ai]);

  const keyDates = React.useMemo(() => deriveKeyDates(qualificationAI), [qualificationAI]);

  const sanitizedBody = React.useMemo(() => {
    if (!noticeData?.body_html) return null;
    return DOMPurify.sanitize(noticeData.body_html);
  }, [noticeData?.body_html]);


  const postedAt = noticeData?.posted_at ?? (noticeData as any)?.postedAt ?? null;
  const hasCalendarRange = Boolean(noticeData?.start_at_ai || noticeData?.end_at_ai);
  
  // 일정 정보가 있는지 확인
  const hasScheduleInfo = React.useMemo(() => {
    return hasCalendarRange || keyDates.length > 0;
  }, [hasCalendarRange, keyDates.length]);
  
  // 일정 관리 섹션 표시 여부: 일정 정보가 있고 정보성 공지가 아닐 때만 표시
  const shouldShowScheduleSection = hasScheduleInfo && !isInformationalNoticeForFetch;
  
  // 자격 분석 섹션 표시 여부: 정보성 공지가 아닐 때만 표시
  const shouldShowEligibilitySection = !isInformationalNoticeForFetch;

  // 관련 공지 추천을 위한 쿼리
  const relatedNoticesQuery = React.useMemo(() => {
    if (!noticeData) return null;
    const hashtags = noticeData.hashtags_ai ?? [];
    const detailedHashtags = noticeData.detailed_hashtags ?? [];
    
    // 해시태그가 있으면 해시태그로, 없으면 출처로 검색
    if (Array.isArray(hashtags) && hashtags.length > 0) {
      return {
        hashtags: [hashtags[0]],
        sort: "recent" as const,
      };
    } else if (noticeData.source_college) {
      return {
        sourceCollege: noticeData.college_key || noticeData.source_college,
        sort: "recent" as const,
      };
    }
    
    return null;
  }, [noticeData]);

  const {
    data: relatedNoticesData,
    isLoading: isRelatedLoading,
  } = useInfiniteNotices({
    query: relatedNoticesQuery || {},
    pageSize: 5,
    enabled: !!relatedNoticesQuery,
  });

  const relatedNotices = React.useMemo(() => {
    if (!relatedNoticesData) return [];
    const allNotices = relatedNoticesData.pages.flatMap((page) => page?.items ?? []);
    // 현재 공지 제외
    return allNotices.filter((notice) => String(notice.id) !== String(id)).slice(0, 5);
  }, [relatedNoticesData, id]);

  const handleAddKeyDate = React.useCallback(
    (entry: DerivedKeyDate) => {
      if (!noticeData?.id || !entry.parsedDate) return;

      const noticeId = String(noticeData.id);
      const baseTitle = (noticeData.title ?? "공지사항").trim();
      const title =
        entry.typeLabel && entry.typeLabel !== "주요 일정"
          ? `${baseTitle} · ${entry.typeLabel}`
          : baseTitle;

      const result = addCalendarEvent({
        noticeId,
        title,
        startDate: entry.parsedDate,
        endDate: null,
        source: "manual",
      });

      setKeyDateStatus((prev) => ({ ...prev, [entry.id]: result.status }));

      if (keyDateTimeouts.current[entry.id]) {
        clearTimeout(keyDateTimeouts.current[entry.id]);
      }

      keyDateTimeouts.current[entry.id] = setTimeout(() => {
        setKeyDateStatus((prev) => {
          const next = { ...prev };
          delete next[entry.id];
          return next;
        });
        delete keyDateTimeouts.current[entry.id];
      }, 2500);
    },
    [addCalendarEvent, noticeData]
  );

  return (
    <main className="mx-auto mb-20 max-w-4xl px-4 py-6 animate-in fade-in duration-300">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          aria-label="이전 페이지로 돌아가기"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          뒤로
        </Button>
      </div>

      <div className="space-y-6">
        {/* 메인 콘텐츠 영역 */}
        <section>
          {/* 제목 */}
          <header className="mb-6">
            {isDetailLoading ? (
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            ) : (
              <h1 className="text-3xl font-bold leading-tight text-foreground">
                {noticeData?.title ?? "제목 없음"}
              </h1>
            )}
          </header>

          {/* 본문 */}
          {isDetailLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-muted" />
            </div>
          ) : isDetailError ? (
            <div 
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              <p className="mb-2">
                {noticeData 
                  ? "일부 정보를 불러오는데 실패했습니다."
                  : getErrorMessage(isDetailError) || "상세 정보를 불러오는 중 오류가 발생했습니다."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchDetail()}
                aria-label="다시 시도"
              >
                다시 시도
              </Button>
            </div>
          ) : (
            <article className="prose prose-gray max-w-none">
              {noticeData?.body_text ? (
                // 1. 'body_text' (요청하신 컬럼)를 최우선으로 표시
                <div className="whitespace-pre-line text-[15px] leading-8 text-foreground">
                  {noticeData.body_text}
                </div>
              ) : noticeData?.raw_text ? (
                // 2. 'body_text'가 없을 경우 'raw_text' 표시
                <div className="whitespace-pre-line text-[15px] leading-8 text-foreground">
                  {noticeData.raw_text}
                </div>
              ) : sanitizedBody ? (
                // 3. 둘 다 없을 경우 'body_html' (sanitizedBody) 표시
                <div
                  className="text-[15px] leading-8 text-foreground [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-2"
                  dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                />
              ) : (
                // 4. 모두 없을 경우 'body' 또는 대체 텍스트 표시
                <div className="whitespace-pre-line text-[15px] leading-8 text-foreground">
                  {noticeData?.body || "내용이 없습니다."}
                </div>
              )}
            </article>
          )}

          {/* 일정 관리 섹션 - 본문 밑에 표시 */}
          {noticeData && shouldShowScheduleSection && (
            <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-2 text-base font-semibold text-foreground">일정 관리</h2>
              <p className="mb-4 text-xs text-muted-foreground">마감 기한을 놓치지 않도록 서비스 캘린더에 저장해 보세요.</p>

              {keyDates.length > 0 && (
                <div className="space-y-3">
                  {keyDates.map((entry) => {
                    const status = keyDateStatus[entry.id] ?? null;
                    const buttonLabel =
                      status === "added"
                        ? "✓ 저장됨"
                        : status === "duplicate"
                        ? "이미 저장됨"
                        : "캘린더에 등록";

                    return (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-primary/30 bg-primary/10 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <Clock className="mt-1 h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-semibold text-primary">{entry.typeLabel}</p>
                            <p className="text-sm font-medium text-foreground">{entry.dateText}</p>
                            {entry.parsedDate ? (
                              <p className="text-[11px] text-primary">
                                캘린더 저장 시: {formatParsedDate(entry.parsedDate)}
                              </p>
                            ) : (
                              <p className="text-[11px] text-primary">
                                날짜 형식을 완전히 인식하지 못해요. 저장 전에 한 번 더 확인해 주세요.
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant={status ? "default" : "secondary"}
                            size="sm"
                            className="shrink-0"
                            onClick={() => handleAddKeyDate(entry)}
                            disabled={!entry.parsedDate}
                            title={
                              entry.parsedDate
                                ? undefined
                                : "텍스트 기한을 정확한 날짜로 변환할 수 없어 수동으로 등록해야 해요."
                            }
                          >
                            {buttonLabel}
                          </Button>
                        </div>
                        {status === "added" && (
                          <p className="mt-2 rounded-md bg-white/80 px-2 py-1 text-[11px] text-emerald-700">
                            서비스 캘린더에 저장했습니다.
                          </p>
                        )}
                        {status === "duplicate" && (
                          <p className="mt-2 rounded-md bg-white/80 px-2 py-1 text-[11px] text-amber-700">
                            이미 저장된 일정이에요.
                          </p>
                        )}
                        {!entry.parsedDate && (
                          <p className="mt-2 rounded-md bg-card/60 px-2 py-1 text-[11px] text-primary">
                            캘린더에 직접 입력해 주세요.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {hasCalendarRange && (
                <div className={keyDates.length > 0 ? "mt-4" : ""}>
                  <CalendarButton notice={noticeData} />
                </div>
              )}
            </div>
          )}

          {/* 자격 분석 섹션 - 본문 밑에 표시 */}
          {shouldShowEligibilitySection && (() => {
            // 정보성 공지인 경우 섹션 자체를 표시하지 않음
            const reasonCodes = Array.isArray(eligibilityData?.reason_codes) ? eligibilityData.reason_codes : [];
            if (reasonCodes.includes("INFO_NOTICE")) {
              return null;
            }
            
            return (
              <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-2 text-base font-semibold text-foreground">AI 자격 분석</h2>
                {isEligibilityError ? (
                  <div 
                    className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                    role="alert"
                    aria-live="polite"
                  >
                    <p className="mb-2">
                      {getErrorMessage(isEligibilityError) || "자격 분석 결과를 불러오지 못했습니다."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchEligibility()}
                      aria-label="자격 분석 다시 시도"
                    >
                      다시 시도
                    </Button>
                  </div>
                ) : (
                  <EligibilityResult data={eligibilityData} isLoading={isEligibilityLoading} />
                )}
              </div>
            );
          })()}
        </section>

        {/* 사이드바 */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          {/* 공지 정보 카드 */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">공지 정보</h2>
            <dl className="space-y-3 text-sm">
              {noticeData?.source_college && (
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="font-medium text-foreground">출처</dt>
                  <dd className="text-muted-foreground">{noticeData.source_college}</dd>
                </div>
              )}
              {postedAt && (
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="font-medium text-foreground">게시일</dt>
                  <dd className="text-muted-foreground">
                    {new Date(postedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
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
        </aside>
      </div>

      {/* 관련 공지 추천 섹션 */}
      {isRelatedLoading ? (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">관련 공지</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <NoticeCardSkeleton key={index} />
            ))}
          </div>
        </section>
      ) : relatedNotices.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">관련 공지</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => router.push(`/notices/${notice.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/notices/${notice.id}`);
                  }
                }}
                className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                role="button"
                tabIndex={0}
                aria-label={`${notice.title} 공지사항 보기`}
              >
                <NoticeCard item={notice} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

type DerivedKeyDate = {
  id: string;
  typeLabel: string;
  dateText: string;
  parsedDate: Date | null;
};

const DEADLINE_KEYWORDS = ["마감", "까지", "deadline", "기한", "접수", "종료", "마감일", "제출"];

function normalizeQualificationAI(raw: unknown): NoticeQualificationAI | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as NoticeQualificationAI;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") {
    return raw as NoticeQualificationAI;
  }
  return null;
}

function deriveKeyDates(qa: NoticeQualificationAI | null): DerivedKeyDate[] {
  if (!qa) return [];
  const entries: DerivedKeyDate[] = [];
  const seen = new Set<string>();

  const pushEntry = (typeLabel?: string | null, dateText?: string | null, iso?: string | null) => {
    const text = typeof dateText === "string" ? dateText.trim() : "";
    if (!text) return;
    const label = (typeLabel && typeLabel.trim()) || "주요 일정";
    const key = `${label}|${text}`;
    if (seen.has(key)) return;

    let parsedDate: Date | null = null;
    if (iso) {
      const isoDate = new Date(iso);
      if (!Number.isNaN(isoDate.getTime())) {
        parsedDate = isoDate;
      }
    }
    if (!parsedDate) {
      parsedDate = parseKeyDateTextToDate(text, label);
    }

    entries.push({
      id: key,
      typeLabel: label,
      dateText: text,
      parsedDate,
    });
    seen.add(key);
  };

  const keyDateList =
    Array.isArray(qa.key_dates) && qa.key_dates.length > 0
      ? qa.key_dates
      : Array.isArray(qa.keyDates) && qa.keyDates.length > 0
      ? qa.keyDates
      : null;

  if (keyDateList) {
    keyDateList.forEach((item) => {
      if (!item) return;
      const iso = item.iso ?? item.key_date_iso ?? null;
      const label = item.key_date_type ?? item.keyDateType ?? item.type ?? item.type_label ?? item.label ?? null;
      const text = item.key_date ?? item.keyDate ?? item.value ?? item.text ?? null;
      pushEntry(label ?? undefined, text ?? undefined, typeof iso === "string" ? iso : undefined);
    });
  }

  pushEntry(qa.key_date_type ?? qa.keyDateType, qa.key_date ?? qa.keyDate);

  return entries;
}

function parseKeyDateTextToDate(text: string, typeLabel?: string | null): Date | null {
  if (!text) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  let year = currentYear;
  let hasExplicitYear = false;
  let month: number | null = null;
  let day: number | null = null;
  let hour: number | null = null;
  let minute: number | null = null;

  let working = text.trim();
  if (!working) return null;

  working = working.replace(/\s+/g, " ");
  if (working.startsWith("~")) {
    working = working.substring(1).trim();
  }
  if (working.includes("~")) {
    const segments = working.split("~");
    working = segments[segments.length - 1].trim();
  }
  if (working.includes("부터")) {
    working = working.split("부터")[0].trim();
  }

  // 연도 추출
  const yearMatch = working.match(/20\d{2}/);
  if (yearMatch) {
    year = Number.parseInt(yearMatch[0], 10);
    hasExplicitYear = Number.isFinite(year);
  }

  // 월/일 추출 (다양한 구분자 지원)
  const monthDayPattern = /(\d{1,2})\s*(?:월|\.|\/|-)\s*(\d{1,2})\s*(?:일)?/g;
  for (const match of working.matchAll(monthDayPattern)) {
    const m = Number.parseInt(match[1], 10);
    const d = Number.parseInt(match[2], 10);
    if (Number.isFinite(m) && Number.isFinite(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      month = m;
      day = d;
    }
  }

  if (month == null || day == null) {
    const wordPattern = /(\d{1,2})\s*월\s*(\d{1,2})/g;
    for (const match of working.matchAll(wordPattern)) {
      const m = Number.parseInt(match[1], 10);
      const d = Number.parseInt(match[2], 10);
      if (Number.isFinite(m) && Number.isFinite(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        month = m;
        day = d;
      }
    }
  }

  if (month == null || day == null) {
    const fallbackPattern = /(\d{1,2})\s*(\d{1,2})\s*일/g;
    for (const match of working.matchAll(fallbackPattern)) {
      const m = Number.parseInt(match[1], 10);
      const d = Number.parseInt(match[2], 10);
      if (Number.isFinite(m) && Number.isFinite(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        month = m;
        day = d;
      }
    }
  }

  // 시간 추출
  const colonMatch = working.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (colonMatch) {
    hour = Number.parseInt(colonMatch[1], 10);
    minute = Number.parseInt(colonMatch[2], 10);
  }

  const ampmMatch = working.match(/(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분?)?/);
  if (ampmMatch) {
    hour = Number.parseInt(ampmMatch[2], 10);
    minute = ampmMatch[3] ? Number.parseInt(ampmMatch[3], 10) : 0;
    if (ampmMatch[1] === "오후" && hour < 12) {
      hour += 12;
    }
    if (ampmMatch[1] === "오전" && hour === 12) {
      hour = 0;
    }
  }

  if (working.includes("자정")) {
    hour = 23;
    minute = 59;
  }

  if (hour == null) {
    const hourMatch = working.match(/(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분?)?/);
    if (hourMatch) {
      hour = Number.parseInt(hourMatch[1], 10);
      minute = hourMatch[2] ? Number.parseInt(hourMatch[2], 10) : 0;
    }
  }

  const context = `${working} ${(typeLabel ?? "").toLowerCase()}`;
  const isDeadline = DEADLINE_KEYWORDS.some((keyword) =>
    context.toLowerCase().includes(keyword)
  );

  if (hour == null) {
    hour = isDeadline ? 23 : 9;
    minute = isDeadline ? 59 : 0;
  } else if (minute == null) {
    minute = 0;
  }

  if (month == null || day == null) {
    return null;
  }

  month = Math.max(1, Math.min(12, month));
  day = Math.max(1, Math.min(31, day));
  hour = Math.max(0, Math.min(23, hour));
  minute = Math.max(0, Math.min(59, minute));

  const candidate = new Date(year, month - 1, day, hour, minute);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }

  if (!hasExplicitYear) {
    const sixtyDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60);
    if (candidate < sixtyDaysAgo) {
      candidate.setFullYear(candidate.getFullYear() + 1);
    }
  }

  return candidate;
}

function formatParsedDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
