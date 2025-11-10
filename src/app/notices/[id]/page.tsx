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
  const [keyDateStatus, setKeyDateStatus] = React.useState<Record<string, "added" | "duplicate">>({});
  const keyDateTimeouts = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  React.useEffect(() => {
    setAutoAdded(false);
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
  const hasCalendarRange = Boolean(noticeData?.start_at_ai || noticeData?.end_at_ai);

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

          {noticeData && (keyDates.length > 0 || hasCalendarRange) && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">일정 관리</h2>
              <p className="mt-1 text-xs text-gray-500">마감 기한을 놓치지 않도록 서비스 캘린더에 저장해 보세요.</p>

              {keyDates.length > 0 && (
                <div className="mt-3 space-y-3">
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
                        className="rounded-lg border border-blue-100 bg-blue-50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <Clock className="mt-1 h-4 w-4 text-blue-600" />
                          <div className="flex-1 space-y-1">
                            <p className="text-[11px] font-semibold text-blue-700">{entry.typeLabel}</p>
                            <p className="text-sm font-medium text-blue-900">{entry.dateText}</p>
                            {entry.parsedDate ? (
                              <p className="text-[11px] text-blue-700">
                                캘린더 저장 시: {formatParsedDate(entry.parsedDate)}
                              </p>
                            ) : (
                              <p className="text-[11px] text-blue-600">
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
                          <p className="mt-2 rounded-md bg-white/60 px-2 py-1 text-[11px] text-blue-700">
                            캘린더에 직접 입력해 주세요.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {hasCalendarRange && (
                <div className={keyDates.length > 0 ? "mt-4" : "mt-3"}>
                  <CalendarButton notice={noticeData} />
                </div>
              )}

              {autoAdded && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
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
