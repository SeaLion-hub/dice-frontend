"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bookmark,
  MoreVertical,
  EyeOff,
  Clock,
  CheckCircle2,
  Circle,
  Building2,
  GraduationCap,
  BadgeDollarSign,
  Tag,
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
    // ex) "2시간 전", "하루 전"
    return formatDistanceToNow(d, { addSuffix: true, locale: ko });
  }

  // ex) "2025.10.29"
  return format(d, "yyyy.MM.dd");
}

// 카테고리별 아이콘 선택
function CategoryIcon({ category }: { category: string }) {
  // 매우 단순한 매핑 (원하면 확대 가능)
  const lower = category.toLowerCase();

  if (lower.includes("학사") || lower.includes("수업") || lower.includes("수강")) {
    return <GraduationCap className="h-3.5 w-3.5 text-blue-600" />;
  }

  if (lower.includes("장학") || lower.includes("장학금") || lower.includes("등록금")) {
    return <BadgeDollarSign className="h-3.5 w-3.5 text-emerald-600" />;
  }

  // fallback
  return <Tag className="h-3.5 w-3.5 text-gray-500" />;
}

export function NoticeCard({
  item,
  dense = false,
  onToggleRead,
  onSaveForLater,
  onHide,
  onToggleBookmark,
}: NoticeCardProps) {
  const unread = !item.read;
  const [menuOpen, setMenuOpen] = useState(false);

  const postedLabel = getRelativeOrAbsoluteDate(item.posted_at);

  const handleToggleRead = () => {
    onToggleRead?.(item.id, !item.read);
    setMenuOpen(false);
  };

  const handleSaveForLater = () => {
    onSaveForLater?.(item.id);
    setMenuOpen(false);
  };

  const handleHide = () => {
    onHide?.(item.id);
    setMenuOpen(false);
  };

  const handleBookmark = () => {
    onToggleBookmark?.(item.id);
  };

  return (
    <article
      className={[
        "group relative flex rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors",
        dense ? "p-3" : "p-4",
        unread ? "bg-blue-50/40" : "bg-white",
      ].join(" ")}
    >
      {/* 왼쪽 unread indicator dot */}
      <div className="mr-3 flex w-3 flex-col pt-1">
        {unread ? (
          <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
        ) : (
          <span className="mt-1 h-2 w-2 rounded-full bg-transparent" />
        )}
      </div>

      {/* 메인 카드 내용 */}
      <div className="min-w-0 flex-1">
        {/* 상단 메타 영역 */}
        <div
          className={[
            "flex items-start justify-between text-[11px] text-gray-500 leading-tight",
            dense ? "" : "text-xs",
          ].join(" ")}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {/* 카테고리 Chip */}
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
              <CategoryIcon category={item.category_ai ?? "#기타"} />
              <span className="whitespace-nowrap">
                {item.category_ai ?? "#기타"}
              </span>
            </span>

            {/* 소속/출처 */}
            {item.source_college && (
              <span className="flex min-w-0 items-center gap-1 truncate">
                <Building2 className="h-3 w-3 text-gray-400" />
                <span className="truncate">{item.source_college}</span>
              </span>
            )}
          </div>

          {/* 날짜 */}
          {postedLabel && (
            <time className="shrink-0 text-gray-400">{postedLabel}</time>
          )}
        </div>

        {/* 제목 */}
        <Link
          href={`/notices/${item.id}`}
          className={[
            "mt-2 block text-gray-900 line-clamp-2",
            unread ? "font-semibold" : "font-medium",
            dense ? "text-sm leading-snug" : "text-base leading-snug",
          ].join(" ")}
        >
          {item.title}
        </Link>

        {/* 요약 (dense 모드에서는 더 작고 살짝 줄간격 타이트) */}
        {item.summary_raw && !dense && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {item.summary_raw}
          </p>
        )}
        {item.summary_raw && dense && (
          <p className="mt-1 text-[12px] leading-snug text-gray-600 line-clamp-1">
            {item.summary_raw}
          </p>
        )}

        {/* 하단 액션 row */}
        <div className="mt-3 flex items-center justify-between">
          {/* 왼쪽: 상태/메타 (optional slot, 여기선 '안 읽음' 표시 등) */}
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            {unread && (
              <span className="flex items-center gap-1 font-medium text-blue-600">
                <Circle className="h-2 w-2 fill-blue-600 stroke-blue-600" />
                <span>새 공지</span>
              </span>
            )}
            {/* “나중에 보기” 같은 라벨이 있다면 여기에 붙일 수 있음 */}
          </div>

          {/* 오른쪽: 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {/* 북마크 */}
            <button
              aria-label="북마크"
              onClick={handleBookmark}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <Bookmark size={16} />
            </button>

            {/* hover 시 나타나는 빠른 액션들 (lg 이상에서만 보이게) */}
            <div className="hidden lg:flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <button
                onClick={handleToggleRead}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{unread ? "읽음으로 표시" : "안 읽음으로"}</span>
              </button>

              <button
                onClick={handleSaveForLater}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>나중에</span>
              </button>

              <button
                onClick={handleHide}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                <span>숨기기</span>
              </button>
            </div>

            {/* always-visible menu (mobile / fallback) */}
            <div className="relative">
              <button
                aria-label="더 보기"
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 lg:hidden"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                  <button
                    onClick={handleToggleRead}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{unread ? "읽음으로 표시" : "안 읽음으로 표시"}</span>
                  </button>

                  <button
                    onClick={handleSaveForLater}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>나중에 보기</span>
                  </button>

                  <button
                    onClick={handleHide}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <EyeOff className="h-4 w-4 text-gray-400" />
                    <span>이 공지 숨기기</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
