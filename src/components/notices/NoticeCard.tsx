// src/components/notices/NoticeCard.tsx
'use client';

import React from 'react';
import clsx from 'clsx';
import { Calendar, MapPin, Tag } from 'lucide-react';
import type { NoticeItem } from '@/types/notices';

type Props = {
  item: NoticeItem;
  dense?: boolean; // 리스트 모드(헤더와 12컬럼 정렬)
  onClick?: (id: string) => void;
};

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    // 로컬 시간대 기준 YYYY-MM-DD HH:mm
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

export default function NoticeCard({ item, dense = false, onClick }: Props) {
  if (dense) {
    // 12 컬럼 그리드: [제목 5][대분류 2][소분류 2][출처 1][게시일 1][적합도 1]
    return (
      <div
        className={clsx(
          'grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-xl',
          'bg-white/70 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800',
          'hover:bg-white dark:hover:bg-neutral-900 transition-colors'
        )}
        role="button"
        onClick={() => onClick?.(item.id)}
      >
        {/* 1️⃣ 제목 (col-span-5) */}
        <div className="col-span-5 truncate">
          <div className="text-sm font-medium truncate">{item.title}</div>
          {item.read && (
            <span className="text-[10px] text-neutral-400">읽음</span>
          )}
        </div>

        {/* 2️⃣ 대분류 (col-span-2) */}
        <div className="col-span-2 flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300 truncate">
          <Tag className="w-3 h-3" />
          <span className="truncate">{item.hashtags_ai ?? '-'}</span>
        </div>

        {/* 3️⃣ 소분류 (col-span-2) */}
        <div className="col-span-2 text-xs text-neutral-700 dark:text-neutral-300 truncate">
          {Array.isArray(item.detailed_hashtags) && item.detailed_hashtags.length > 0
            ? item.detailed_hashtags.join(', ')
            : '-'}
        </div>

        {/* 4️⃣ 출처 (col-span-1) */}
        <div className="col-span-1 flex items-center gap-1 text-xs text-neutral-700 dark:text-neutral-300 truncate">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{item.source_college ?? '-'}</span>
        </div>

        {/* 5️⃣ 게시일 (col-span-1) */}
        <div className="col-span-1 flex items-center gap-1 text-[11px] text-neutral-500 truncate">
          <Calendar className="w-3 h-3" />
          <span className="truncate">{formatDate(item.posted_at) || '-'}</span>
        </div>

        {/* 6️⃣ 적합도 (col-span-1) - 작업 3 교체 블록 */}
        <div className="relative col-span-1 flex justify-center items-center">
          {item.eligibility === 'ELIGIBLE' && (
            <span className="h-3 w-3 rounded-full bg-emerald-500" title="적합" />
          )}
          {item.eligibility === 'BORDERLINE' && (
            <span className="h-3 w-3 rounded-full bg-yellow-500" title="부분 적합" />
          )}
          {item.eligibility === 'INELIGIBLE' && (
            <span className="h-3 w-3 rounded-full bg-red-500" title="부적합" />
          )}
          {!item.eligibility && (
            <span className="h-3 w-3 rounded-full bg-gray-200" title="미판단" />
          )}
        </div>
      </div>
    );
  }

  // 카드 모드(기본)
  return (
    <div
      className={clsx(
        'rounded-2xl p-4 border',
        'bg-white/80 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800',
        'hover:shadow-sm hover:bg-white dark:hover:bg-neutral-900 transition'
      )}
      role="button"
      onClick={() => onClick?.(item.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">{item.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {item.read && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              읽음
            </span>
          )}
          {item.hashtags_ai && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {item.hashtags_ai}
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
          <span>{item.source_college ?? '출처 미상'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(item.posted_at) || '게시일 미상'}</span>
        </div>
        {Array.isArray(item.detailed_hashtags) && item.detailed_hashtags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>{item.detailed_hashtags.join(', ')}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1">
          {item.eligibility === 'ELIGIBLE' && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              적합
            </span>
          )}
          {item.eligibility === 'BORDERLINE' && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              부분 적합
            </span>
          )}
          {item.eligibility === 'INELIGIBLE' && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              부적합
            </span>
          )}
          {!item.eligibility && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
              미판단
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
