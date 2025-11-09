"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Badge } from "../ui/badge";
import { PagedResponse, NoticeItem } from "@/types/notices";
import { useAuthStore } from "@/stores/useAuthStore";

export default function RecommendedRow() {
  const token = useAuthStore((s) => s.token);
  const isAuthed = !!token;

  const { data, isLoading, isError, refetch } = useQuery<
    PagedResponse<NoticeItem>
  >({
    // 사용자별 캐시 분리를 위해 token 포함
    queryKey: ["recommended", token],
    queryFn: async () => {
      // BFF 경유: 현재 사용자 기준 맞춤 공지 (my=true)
      const url = `/api/notices?limit=10&offset=0&my=true`;

      const r = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "same-origin",
      });
      if (r.status === 401) throw new Error("unauthorized");
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    enabled: isAuthed, // 토큰 없으면 호출하지 않음
    staleTime: 60_000,
  });

  const [hidden, setHidden] = useState<Record<string | number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollByCardWidth = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = dir === "left" ? -(320 + 16) : 320 + 16;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  const handleHide = useCallback(async (noticeId: number | string) => {
    setHidden((prev) => ({ ...prev, [noticeId]: true }));
    try {
      // 선택사항: 피드백 API (있다면 BFF 경유 경로로 호출)
      await fetch(`/api/notices/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "same-origin",
        body: JSON.stringify({ noticeId, action: "hide", ts: Date.now() }),
      });
    } catch {
      setHidden((prev) => {
        const copy = { ...prev };
        delete copy[noticeId];
        return copy;
      });
    }
  }, [token]);

  // Hooks must run on every render. Compute list before any early returns.
  const allItems = data?.items ?? [];
  const items = useMemo(() => allItems.filter((it) => !hidden[it.id]), [allItems, hidden]);

  if (!isAuthed) {
    return (
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">회원님께 추천!</h2>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          맞춤 추천은 로그인 후 이용할 수 있어요.{" "}
          <Link href="/login" className="text-blue-600 underline">로그인</Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">회원님께 추천!</h2>
          <span className="text-sm text-gray-400">불러오는 중…</span>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="min-w-[320px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-10 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="mt-3 h-6 w-64 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
          <FadeEdges />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">회원님께 추천!</h2>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          추천을 불러오지 못했어요.{" "}
          <button className="underline" onClick={() => refetch()}>다시 시도</button>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">회원님께 추천!</h2>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          아직 보여드릴 추천이 없어요. 프로필을 업데이트하면 더 정확한 추천을 받을 수 있어요.{" "}
          <Link href="/profile" className="text-blue-600 underline">프로필 수정</Link>
        </div>
      </section>
    );
  }

  function SuitBadge({ s }: { s?: NoticeItem["suitability"] }) {
    if (s === "eligible") {
      return (
        <Badge className="flex items-center gap-1 border border-green-500/60 bg-green-100 text-[0.75rem] font-semibold text-green-700 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
          <span className="text-base leading-none">✅</span>
          <span>지원 가능</span>
        </Badge>
      );
    }
    if (s === "check") {
      return (
        <Badge className="flex items-center gap-1 border border-yellow-200 bg-yellow-100 text-[0.7rem] font-medium text-yellow-800">
          <span className="text-sm leading-none">⚠️</span>
          <span>자격 확인 필요</span>
        </Badge>
      );
    }
    return (
      <Badge className="flex items-center gap-1 border border-gray-200 bg-gray-100 text-[0.7rem] font-medium text-gray-700">
        <span className="text-sm leading-none">ℹ️</span>
        <span>참고</span>
      </Badge>
    );
  }

  return (
    <section className="mt-4" aria-labelledby="reco-title">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="reco-title" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          회원님께 추천!
          <span
            className="cursor-help select-none text-[0.7rem] leading-none text-gray-400 hover:text-gray-600"
            title="회원님의 학년, 전공, 어학, GPA 등 프로필과 유사한 지원자 패턴을 분석해 매칭된 공고예요."
            aria-label="추천 방식 안내"
          >
            ⓘ
          </span>
        </h2>
        <Link href="/notices?tab=custom" className="text-sm text-blue-600 hover:underline whitespace-nowrap">
          전체 보기
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByCardWidth("left")}
          className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 px-2 py-1 text-gray-700 shadow-md hover:bg-white lg:flex"
          aria-label="왼쪽으로 스크롤"
        >
          <span className="text-lg leading-none">‹</span>
        </button>

        <button
          type="button"
          onClick={() => scrollByCardWidth("right")}
          className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 px-2 py-1 text-gray-700 shadow-md hover:bg-white lg:flex"
          aria-label="오른쪽으로 스크롤"
        >
          <span className="text-lg leading-none">›</span>
        </button>

        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
          role="list"
          aria-label="맞춤 추천 공고 목록"
        >
          {items.map((item) => (
            <article
              key={item.id}
              role="listitem"
              className="relative min-w-[320px] snap-start rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <button
                type="button"
                onClick={() => handleHide(item.id)}
                className="absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="이 추천 숨기기"
                title="이 추천 숨기기"
              >
                ×
              </button>

              <div className="flex items-start justify-between pr-8">
                <SuitBadge s={item.suitability} />
                {item.posted_at && (
                  <time className="text-xs text-gray-500" dateTime={item.posted_at}>
                    {new Date(item.posted_at).toLocaleDateString()}
                  </time>
                )}
              </div>

              <Link
                href={`/notices/${item.id}`}
                className="mt-2 block text-base font-semibold text-gray-900 line-clamp-2 hover:underline"
              >
                {item.title}
              </Link>

              <dl className="mt-3 space-y-1 text-sm text-gray-700">
                {item.qualification_ai?.grade_years && (
                  <div>
                    <dt className="inline">🎓 학년</dt>
                    <dd className="ml-2 inline">{item.qualification_ai.grade_years}</dd>
                  </div>
                )}
                {item.qualification_ai?.gpa && (
                  <div>
                    <dt className="inline">📊 학점</dt>
                    <dd className="ml-2 inline">{item.qualification_ai.gpa}</dd>
                  </div>
                )}
                {item.qualification_ai?.language && (
                  <div>
                    <dt className="inline">🗣️ 어학</dt>
                    <dd className="ml-2 inline">{item.qualification_ai.language}</dd>
                  </div>
                )}
              </dl>

              {item.reason && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <div className="mb-1 flex items-center text-xs font-semibold text-blue-700">
                    <span className="mr-1">나와 관련 높은 이유</span>
                    <span
                      className="cursor-help select-none text-[0.7rem] leading-none text-blue-500 hover:text-blue-700"
                      title="이 공고가 특히 회원님께 적합하다고 판단된 핵심 근거예요."
                      aria-label="이유 설명 보기"
                    >
                      ⓘ
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-blue-800 line-clamp-2">
                    {item.reason}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>

        <FadeEdges />
      </div>
    </section>
  );
}

function FadeEdges() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent" />
    </>
  );
}
