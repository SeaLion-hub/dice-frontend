"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bookmark,
  MoreVertical,
  EyeOff,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { NoticeItem } from "@/types/notices";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";

type NoticeCardProps = {
  item: NoticeItem;
  dense?: boolean;
  onToggleRead?: (id: string | number, nextRead: boolean) => void;
  onSaveForLater?: (id: string | number) => void;
  onHide?: (id: string | number) => void;
  onToggleBookmark?: (id: string | number) => void;
};

function getRelativeOrAbsoluteDate(dateISO?: string | null) {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  const daysDiff = differenceInDays(new Date(), d);
  if (daysDiff <= 7) {
    return formatDistanceToNow(d, { addSuffix: true, locale: ko });
  }
  return format(d, "yyyy.MM.dd");
}

export function NoticeCard({
  item,
  dense = false,
  onToggleRead,
  onSaveForLater,
  onHide,
  onToggleBookmark,
}: NoticeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = !item.read;
  const formattedDate = getRelativeOrAbsoluteDate(item.posted_at);

  // ============================
  // DENSE MODE (리스트형 / 헤더 정렬 일치)
  // ============================
  if (dense) {
    return (
      <Link
        href={`/notices/${item.id}`}
        onClick={(e) => {
          if (menuOpen) e.preventDefault(); // 메뉴 열릴 때 링크 이동 방지
        }}
        className={`grid grid-cols-12 items-center gap-4 px-4 py-3 text-[13px] transition-colors ${
          unread ? "bg-blue-50/40 hover:bg-blue-50" : "hover:bg-gray-50"
        }`}
      >
        {/* 1️⃣ 제목 (col-span-5) */}
        <div className="col-span-5 flex min-w-0 items-center gap-2">
          {unread && (
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
          )}
          <span className="truncate font-medium text-gray-900 group-hover:underline">
            {item.title}
          </span>
        </div>

        {/* 2️⃣ 대분류 (col-span-2) */}
        <div className="col-span-2">
          {item.hashtags_ai ? (
            <span className="truncate rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              #{item.hashtags_ai}
            </span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>

        {/* 3️⃣ 소분류 (col-span-2) - [수정됨] */}
        <div className="col-span-2">
          {item.detailed_hashtags?.[0] ? (
            <span className="truncate rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              #{item.detailed_hashtags[0]}
            </span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>

        {/* 4️⃣ 출처 (col-span-1) */}
        <div className="col-span-1 truncate text-gray-600">
          {item.source_college || "—"}
        </div>

        {/* 5️⃣ 등록일 (col-span-1) */}
        <div className="col-span-1 min-w-16 text-right text-gray-500">
          {formattedDate ?? "—"}
        </div>

        {/* 6️⃣ 관리 (col-span-1) */}
        <div className="relative col-span-1 flex justify-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
            >
              <button
                onClick={() => onToggleRead?.(item.id, !item.read)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{unread ? "읽음으로 표시" : "안 읽음으로 표시"}</span>
              </button>
              <button
                onClick={() => onSaveForLater?.(item.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
              >
                <Clock className="h-4 w-4 text-amber-500" />
                <span>나중에 보기</span>
              </button>
              <button
                onClick={() => onHide?.(item.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
              >
                <EyeOff className="h-4 w-4 text-gray-400" />
                <span>이 공지 숨기기</span>
              </button>
              <button
                onClick={() => onToggleBookmark?.(item.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
              >
                <Bookmark className="h-4 w-4 text-blue-500" />
                <span>북마크</span>
              </button>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // ============================
  // CARD MODE (기존 디자인)
  // ============================
  return (
    <article className="group relative flex rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50">
      <div className="mr-3 flex w-3 flex-col pt-1">
        {unread ? (
          <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
        ) : (
          <span className="mt-1 h-2 w-2 rounded-full bg-transparent" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between text-xs leading-tight text-gray-500">
          <span>{item.source_college}</span>
          <time className="text-gray-400">{formattedDate}</time>
        </div>

        <Link
          href={`/notices/${item.id}`}
          className="mt-2 block text-base font-medium leading-snug text-gray-900 line-clamp-2"
        >
          {item.title}
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <button
            aria-label="북마크"
            onClick={() => onToggleBookmark?.(item.id)}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <Bookmark size={16} />
          </button>

          <div className="hidden items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 lg:flex">
            <button
              onClick={() => onToggleRead?.(item.id, !item.read)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>{unread ? "읽음으로" : "안 읽음으로"}</span>
            </button>
            <button
              onClick={() => onSaveForLater?.(item.id)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>나중에</span>
            </button>
            <button
              onClick={() => onHide?.(item.id)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <EyeOff className="h-3.5 w-3.5 text-gray-400" />
              <span>숨기기</span>
            </button>
          </div>

          <div className="relative lg:hidden">
            <button
              aria-label="더 보기"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                <button
                  onClick={() => onToggleRead?.(item.id, !item.read)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{unread ? "읽음으로" : "안 읽음으로"}</span>
                </button>
                <button
                  onClick={() => onSaveForLater?.(item.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                >
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>나중에 보기</span>
                </button>
                <button
                  onClick={() => onHide?.(item.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                >
                  <EyeOff className="h-4 w-4 text-gray-400" />
                  <span>숨기기</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}