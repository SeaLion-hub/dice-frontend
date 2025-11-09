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
};

const INDICATOR_LABELS: Record<NonNullable<NoticeItem['eligibility']>, string> = {
  ELIGIBLE: '적합',
  BORDERLINE: '부분 적합',
  INELIGIBLE: '부적합',
};

export default function NoticeCard({ item, dense = false, onClick, recommended = false }: Props) {
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

  const effectiveEligibility = eligibilityData?.eligibility ?? item.eligibility ?? null;

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
          'bg-white/70 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800',
          'hover:bg-white dark:hover:bg-neutral-900 transition-colors',
          'cursor-pointer'
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
          <div className="min-w-0 truncate text-sm font-medium">{item.title}</div>
          {item.read && <span className="text-[10px] text-neutral-400">읽음</span>}
        </div>

        {/* 2️⃣ 대분류 (col-span-2) */}
        <div className="col-span-2 flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300 truncate">
          <Tag className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {Array.isArray(item.hashtags_ai) && item.hashtags_ai.length > 0
              ? item.hashtags_ai.join(', ')
              : '-'}
          </span>
        </div>

        {/* 3️⃣ 소분류 (col-span-2) */}
        <div className="col-span-2 text-xs text-neutral-700 dark:text-neutral-300 truncate">
          {Array.isArray(item.detailed_hashtags) && item.detailed_hashtags.length > 0
            ? item.detailed_hashtags.join(', ')
            : '-'}
        </div>

        {/* 4️⃣ 출처 (col-span-1) */}
        <div className="col-span-1 flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300 truncate">
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
        'bg-white/80 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800',
        'hover:shadow-sm hover:bg-white dark:hover:bg-neutral-900 transition',
        'cursor-pointer'
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
            <h3 className="min-w-0 truncate text-base font-semibold leading-snug">{item.title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.read && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              읽음
            </span>
          )}
          {Array.isArray(item.hashtags_ai) && item.hashtags_ai.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {item.hashtags_ai[0]}
            </span>
          )}
        </div>
      </div>

      {item.raw_text && (
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
          {item.raw_text}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
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
        fillClass: 'bg-white',
        borderClass: 'border-gray-300',
        outerBgClass: 'bg-white',
      };
  }
}
