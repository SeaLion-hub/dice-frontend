// src/components/notices/NoticeCard.tsx
'use client';

import React from 'react';
import clsx from 'clsx';
import { MapPin, Tag } from 'lucide-react';
import type { NoticeItem } from '@/types/notices';
import { useColleges } from '@/hooks/useColleges';
import { useNoticeEligibility } from '@/hooks/useNoticeQueries';
import { useAuthStore } from '@/stores/useAuthStore';
import { Badge } from '@/components/ui/badge';

type Props = {
  item: NoticeItem;
  dense?: boolean; // 리스트 모드(헤더와 12컬럼 정렬)
  onClick?: (id: string) => void;
  recommended?: boolean;
  highlightQuery?: string; // 검색어 하이라이트용
};

const INDICATOR_LABELS: Record<NonNullable<NoticeItem['eligibility']>, string> = {
  ELIGIBLE: '적합',
  BORDERLINE: '부분 적합',
  INELIGIBLE: '부적합',
};

export default function NoticeCard({ item, dense = false, onClick, recommended = false, highlightQuery }: Props) {
  // 검색어 하이라이트 함수
  const highlightText = React.useCallback((text: string, query?: string) => {
    if (!query || !query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);
  
  // 강화된 날짜 파싱 함수 (다양한 형식 지원)
  const parseDate = React.useCallback((dateValue: any): Date | null => {
    if (!dateValue) return null;
    
    // 이미 Date 객체인 경우
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    // 숫자 타임스탬프인 경우 (초 또는 밀리초)
    if (typeof dateValue === 'number') {
      // 밀리초인지 초인지 판단 (10자리면 초, 13자리면 밀리초)
      // 10자리: 1234567890 (초)
      // 13자리: 1234567890123 (밀리초)
      const timestamp = dateValue > 10_000_000_000_000 ? dateValue : dateValue * 1000;
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // 문자열인 경우
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      if (!trimmed) return null;
      
      // 1. ISO 형식 우선 처리 (PostgreSQL TIMESTAMPTZ가 이 형식으로 반환됨)
      // 예: "2024-01-15T00:00:00Z", "2024-01-15T00:00:00+09:00", "2024-01-15T00:00:00.000Z"
      // 다양한 ISO 형식 시도
      const isoPatterns = [
        trimmed, // 원본
        trimmed.replace(/Z$/, '+00:00'), // Z를 +00:00로 변환
        trimmed.replace(/Z$/, ''), // Z 제거
        trimmed.replace(/(\+\d{2}):(\d{2})$/, '$1$2'), // +09:00을 +0900으로
        trimmed.replace(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/, '$1 $2'), // T를 공백으로
      ];
      
      for (const pattern of isoPatterns) {
        try {
          const date = new Date(pattern);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            // 유효한 연도 범위 확인
            if (year >= 1900 && year <= 2100) {
              return date;
            }
          }
        } catch (e) {
          // 다음 패턴 시도
          continue;
        }
      }
      
      // 2. YYYY-MM-DD 형식 (날짜만 있는 경우, 타임존 정보 포함 가능)
      const ymdMatch = trimmed.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:\s|$|T|Z|\+|-)/);
      if (ymdMatch) {
        const [, year, month, day] = ymdMatch;
        const y = parseInt(year, 10);
        const m = parseInt(month, 10) - 1; // 월은 0부터 시작
        const d = parseInt(day, 10);
        if (y >= 1900 && y <= 2100 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
          const date = new Date(y, m, d);
          // 유효한 날짜인지 확인 (예: 2월 30일 같은 경우)
          if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
            return date;
          }
        }
      }
      
      // 3. YYYY.MM.DD 형식
      const dotMatch = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\s|$|T|Z|\+|-)/);
      if (dotMatch) {
        const [, year, month, day] = dotMatch;
        const y = parseInt(year, 10);
        const m = parseInt(month, 10) - 1;
        const d = parseInt(day, 10);
        if (y >= 1900 && y <= 2100 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
          const date = new Date(y, m, d);
          if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
            return date;
          }
        }
      }
      
      // 4. YYYY년 MM월 DD일 형식 (한국어 형식)
      const koreanFullMatch = trimmed.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
      if (koreanFullMatch) {
        const [, year, month, day] = koreanFullMatch;
        const y = parseInt(year, 10);
        const m = parseInt(month, 10) - 1;
        const d = parseInt(day, 10);
        if (y >= 1900 && y <= 2100 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
          const date = new Date(y, m, d);
          if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
            return date;
          }
        }
      }
      
      // 5. MM월 DD일 형식 (연도 없음, 현재 연도 또는 다음 연도 추론)
      // "(금)" 같은 요일 표시도 처리
      const koreanShortMatch = trimmed.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
      if (koreanShortMatch) {
        const [, month, day] = koreanShortMatch;
        const now = new Date();
        const currentYear = now.getFullYear();
        const m = parseInt(month, 10) - 1;
        const d = parseInt(day, 10);
        
        if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
          // 현재 연도로 시도
          let date = new Date(currentYear, m, d);
          if (date.getFullYear() === currentYear && date.getMonth() === m && date.getDate() === d) {
            // 날짜가 현재보다 이전이면 다음 연도일 가능성
            // 특히 11월, 12월인 경우 다음 연도일 가능성이 높음
            if (date < now) {
              if (m >= 10) {
                // 11월, 12월: 다음 연도
                date = new Date(currentYear + 1, m, d);
              } else if (m <= 1) {
                // 1월, 2월: 현재가 11월, 12월이면 다음 연도
                if (now.getMonth() >= 10) {
                  date = new Date(currentYear + 1, m, d);
                }
              } else {
                // 3월~10월: 현재보다 이전이면 다음 연도
                date = new Date(currentYear + 1, m, d);
              }
            }
            return date;
          }
        }
      }
      
      // 6. 마지막 시도: Date 생성자에 직접 전달
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        // 유효한 날짜인지 추가 검증 (1970년 이전이나 2100년 이후는 의심스러움)
        const year = date.getFullYear();
        if (year >= 1900 && year <= 2100) {
          return date;
        }
      }
    }
    
    return null;
  }, []);
  
  // 일정이 추출된 공지인지 확인하는 함수
  const hasSchedule = React.useMemo(() => {
    const startDateValue = item.start_at_ai ?? (item as any).startAtAi ?? null;
    const endDateValue = item.end_at_ai ?? (item as any).endAtAi ?? null;
    return !!(startDateValue || endDateValue);
  }, [item.start_at_ai, item.end_at_ai]);

  // 마감일이 지났는지 확인하는 함수 (일정이 추출된 공지에 대하여)
  const isDeadlinePassed = React.useMemo(() => {
    // 일정이 추출되지 않은 공지는 마감 여부를 확인하지 않음
    if (!hasSchedule) {
      return false;
    }

    // 백엔드에서 계산한 is_closed 필드가 있으면 우선 사용
    if (item.is_closed !== undefined) {
      return item.is_closed;
    }

    // end_at_ai 또는 endAtAi 필드 확인 (우선순위 1)
    let deadlineDateValue = item.end_at_ai ?? (item as any).endAtAi ?? null;
    const hasStartAt = !!(item.start_at_ai ?? (item as any).startAtAi);
    
    // end_at_ai가 없고 start_at_ai만 있는 경우, start_at_ai를 기준으로 마감 여부 확인
    if (!deadlineDateValue) {
      deadlineDateValue = item.start_at_ai ?? (item as any).startAtAi ?? null;
    }
    
    if (!deadlineDateValue) {
      return false;
    }
    
    // 날짜 파싱
    const deadlineDate = parseDate(deadlineDateValue);
    if (!deadlineDate) {
      // 개발 모드에서 파싱 실패 로깅
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Deadline Check] Failed to parse date', {
          noticeId: item.id,
          title: item.title?.substring(0, 30),
          deadlineDateValue,
          hasEndAt: !!(item.end_at_ai ?? (item as any).endAtAi),
          hasStartAt,
        });
      }
      return false;
    }
    
    // 04:23은 일회성 이벤트 표시용 (프론트엔드에서 시간 숨김용)
    // end_at_ai가 04:23이고 start_at_ai가 없으면 → 일회성 이벤트 (마감 여부 판단 불가)
    const isOneTimeEvent = deadlineDate.getHours() === 4 && deadlineDate.getMinutes() === 23 && 
                           !!(item.end_at_ai ?? (item as any).endAtAi) && !hasStartAt;
    if (isOneTimeEvent) {
      // 일회성 이벤트는 마감 여부를 판단할 수 없음
      return false;
    }
    
    // 현재 시간과 비교: 마감일이 현재 시간보다 이전이면 마감됨
    const now = new Date();
    const isPassed = deadlineDate.getTime() < now.getTime();
    
    // 개발 모드에서 디버깅 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Deadline Check]', {
        noticeId: item.id,
        title: item.title?.substring(0, 30),
        deadlineDateValue,
        hasEndAt: !!(item.end_at_ai ?? (item as any).endAtAi),
        hasStartAt: !!(item.start_at_ai ?? (item as any).startAtAi),
        deadlineDate: deadlineDate.toISOString(),
        deadlineDateLocal: deadlineDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        now: now.toISOString(),
        nowLocal: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        deadlineTime: deadlineDate.getTime(),
        nowTime: now.getTime(),
        isPassed,
        timeDiff: now.getTime() - deadlineDate.getTime(),
        timeDiffHours: Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60)),
      });
    }
    
    return isPassed;
  }, [hasSchedule, item.is_closed, item.end_at_ai, item.start_at_ai, item.id, item.title, parseDate]);
  
  const { data: colleges } = useColleges();
  const token = useAuthStore((s) => s.token);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [hasIntersected, setHasIntersected] = React.useState(false);

  React.useEffect(() => {
    if (hasIntersected) return;
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasIntersected(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '120px 0px 120px 0px', threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasIntersected]);

  const noticeId = item?.id ? String(item.id) : null;
  const hasQualificationData = Boolean(item?.qualification_ai ?? (item as any)?.qualificationAi);
  const shouldFetchEligibility = Boolean(
    token && noticeId && hasQualificationData && hasIntersected
  );

  const {
    data: eligibilityData,
  } = useNoticeEligibility(noticeId, shouldFetchEligibility);

  // 정보성 공지인지 확인 (reason_codes에 INFO_NOTICE가 포함되어 있으면 자격이 큰 의미가 없음)
  const reasonCodes = Array.isArray(eligibilityData?.reason_codes) ? eligibilityData.reason_codes : [];
  const isInfoNotice = reasonCodes.includes("INFO_NOTICE");

  // AI 자격분석이 없거나 정보성 공지인 경우 null로 설정하여 회색으로 표시
  const effectiveEligibility = (hasQualificationData && !isInfoNotice)
    ? (eligibilityData?.eligibility ?? item.eligibility ?? null)
    : null;

  // college_key로 college name 찾기
  const collegeName = React.useMemo(() => {
    if (!item.college_key || !colleges) return item.source_college || '-';
    const college = colleges.find((c) => c.college_key === item.college_key);
    return college?.name || item.source_college || '-';
  }, [item.college_key, item.source_college, colleges]);
  const eligibilityVisual = React.useMemo(() => getEligibilityVisual(effectiveEligibility), [effectiveEligibility]);

  const renderEligibilityIndicator = (size: 'sm' | 'md') => {
    const outerSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    const innerSize = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3';
    const label = eligibilityVisual.label;

    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center rounded-full border',
          eligibilityVisual.borderClass,
          eligibilityVisual.outerBgClass,
          outerSize
        )}
        title={label}
        aria-label={`자격 판정: ${label}`}
      >
        <span className={clsx('block rounded-full', eligibilityVisual.fillClass, innerSize)} aria-hidden />
      </span>
    );
  };

  if (dense) {
    // 12 컬럼 그리드: [제목 5][대분류 2][소분류 2][출처 1][게시일 1][적합도 1]
    return (
      <div
        ref={rootRef}
        className={clsx(
          'grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-xl',
          'bg-card/80 dark:bg-card/60 border border-border',
          'hover:bg-card dark:hover:bg-card/90 transition-colors',
          'cursor-pointer',
          // 마감일이 지난 경우 빨간색 테두리와 배경색 적용
          isDeadlinePassed && 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-950/30'
        )}
        role="button"
        onClick={() => onClick?.(item.id)}
      >
        {/* 1️⃣ 제목 (col-span-5) */}
        <div className="col-span-6 flex min-w-0 items-center gap-2">
          {recommended && (
            <Badge className="shrink-0 bg-purple-100 text-[10px] font-semibold text-purple-700 border border-purple-200">
              추천
            </Badge>
          )}
          {isDeadlinePassed && (
            <Badge className="shrink-0 bg-red-100 text-[10px] font-semibold text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
              마감됨
            </Badge>
          )}
          <div className="min-w-0 truncate text-sm font-medium">
            {highlightQuery ? highlightText(item.title, highlightQuery) : item.title}
          </div>
          {item.read && <span className="text-[10px] text-muted-foreground">읽음</span>}
        </div>

        {/* 2️⃣ 대분류 (col-span-2) */}
        <div className="col-span-2 flex items-center gap-1 text-xs text-foreground truncate">
          <Tag className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {Array.isArray(item.hashtags_ai) && item.hashtags_ai.length > 0
              ? item.hashtags_ai.join(', ')
              : '-'}
          </span>
        </div>

        {/* 3️⃣ 소분류 (col-span-2) */}
        <div className="col-span-2 text-xs text-foreground truncate">
          {Array.isArray(item.detailed_hashtags) && item.detailed_hashtags.length > 0
            ? item.detailed_hashtags.join(', ')
            : '-'}
        </div>

        {/* 4️⃣ 출처 (col-span-1) */}
        <div className="col-span-1 flex items-center gap-1 text-xs text-foreground truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate" title={collegeName}>{collegeName}</span>
        </div>

        {/* 5️⃣ 자격 결과 (col-span-1) */}
        <div className="col-span-1 flex items-center justify-center">
          {renderEligibilityIndicator('sm')}
        </div>
      </div>
    );
  }

  // 카드 모드(기본)
  return (
    <div
      ref={rootRef}
      className={clsx(
        'rounded-2xl p-4 border',
        'bg-card/80 dark:bg-card/60 border-border',
        'hover:shadow-sm hover:bg-card dark:hover:bg-card/90 transition',
        'cursor-pointer',
        // 마감일이 지난 경우 빨간색 테두리와 배경색 적용
        isDeadlinePassed && 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-950/30'
      )}
      role="button"
      onClick={() => onClick?.(item.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            {recommended && (
              <Badge className="shrink-0 bg-purple-100 text-[11px] font-semibold text-purple-700 border border-purple-200">
                추천
              </Badge>
            )}
            <h3 className="min-w-0 truncate text-base font-semibold leading-snug">
              {highlightQuery ? highlightText(item.title, highlightQuery) : item.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDeadlinePassed && (
            <Badge className="shrink-0 bg-red-100 text-[10px] font-semibold text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
              마감됨
            </Badge>
          )}
          {item.read && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              읽음
            </span>
          )}
          {Array.isArray(item.hashtags_ai) && item.hashtags_ai.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {item.hashtags_ai[0]}
            </span>
          )}
        </div>
      </div>

      {item.raw_text && (
        <p className="mt-2 text-sm text-foreground line-clamp-3">
          {item.raw_text}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span>{collegeName}</span>
        </div>
        {Array.isArray(item.detailed_hashtags) && item.detailed_hashtags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>{item.detailed_hashtags.join(', ')}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">{renderEligibilityIndicator('md')}</div>
      </div>
    </div>
  );
}

function getEligibilityVisual(status: NoticeItem['eligibility'] | null) {
  switch (status) {
    case 'ELIGIBLE':
      return {
        label: INDICATOR_LABELS.ELIGIBLE,
        fillClass: 'bg-emerald-500',
        borderClass: 'border-emerald-200',
        outerBgClass: 'bg-emerald-50',
      };
    case 'BORDERLINE':
      return {
        label: INDICATOR_LABELS.BORDERLINE,
        fillClass: 'bg-amber-500',
        borderClass: 'border-amber-200',
        outerBgClass: 'bg-amber-50',
      };
    case 'INELIGIBLE':
      return {
        label: INDICATOR_LABELS.INELIGIBLE,
        fillClass: 'bg-red-500',
        borderClass: 'border-red-200',
        outerBgClass: 'bg-red-50',
      };
    default:
      return {
        label: '미판단',
        fillClass: 'bg-muted-foreground',
        borderClass: 'border-border',
        outerBgClass: 'bg-muted',
      };
  }
}
