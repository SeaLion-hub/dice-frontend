"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
// import { Badge } from "@/components/ui/badge"; // shadcn/ui에 badge 컴포넌트 있다고 가정
import { Badge } from "../ui/badge"; // 경로를 실제 Badge 컴포넌트 위치로 수정
import { PagedResponse, NoticeItem } from "@/types/notices";

export default function RecommendedRow() {
  const { data, isLoading, isError, refetch } = useQuery<PagedResponse<NoticeItem>>({
    queryKey: ["recommended"],
    queryFn: async () => {
      const r = await fetch("/api/notices/recommended?limit=10&offset=0");
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">회원님께 추천!</h2>
          <span className="text-sm text-gray-400">불러오는 중…</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="min-w-[320px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-6 w-64 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          추천을 불러오지 못했어요.{" "}
          <button className="underline" onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">회원님께 추천!</h2>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          아직 보여드릴 추천이 없어요. 프로필을 업데이트하면 더 정확한 추천을 받을 수 있어요.{" "}
          <Link href="/profile" className="text-blue-600 underline">
            프로필 수정
          </Link>
        </div>
      </section>
    );
  }

  function SuitBadge({ s }: { s?: NoticeItem["suitability"] }) {
    if (s === "eligible") {
      return (
        <Badge className="border border-green-200 bg-green-100 text-green-700">
          ✅ 지원 가능
        </Badge>
      );
    }
    if (s === "check") {
      return (
        <Badge className="border border-yellow-200 bg-yellow-100 text-yellow-800">
          ⚠️ 자격 확인 필요
        </Badge>
      );
    }
    return (
      <Badge className="border border-gray-200 bg-gray-100 text-gray-700">
        참고
      </Badge>
    );
  }

  return (
    <section className="mt-4" aria-labelledby="reco-title">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="reco-title" className="text-lg font-semibold text-gray-900">
          회원님께 추천!
        </h2>
        <Link
          href="/notices?tab=custom"
          className="text-sm text-blue-600 hover:underline"
        >
          전체 보기
        </Link>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 no-scrollbar">
        {items.map((item) => (
          <article
            key={item.id}
            className="min-w-[320px] snap-start rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <SuitBadge s={item.suitability} />
              {item.posted_at && (
                <time className="text-xs text-gray-500">
                  {new Date(item.posted_at).toLocaleDateString()}
                </time>
              )}
            </div>

            <Link
              href={`/notices/${item.id}`}
              className="mt-2 block text-base font-semibold text-gray-900 line-clamp-2"
            >
              {item.title}
            </Link>

            <dl className="mt-3 space-y-1 text-sm text-gray-700">
              {item.qualification_ai?.grade_years && (
                <div>
                  <dt className="inline">🎓 학년</dt>
                  <dd className="ml-2 inline">
                    {item.qualification_ai.grade_years}
                  </dd>
                </div>
              )}
              {item.qualification_ai?.gpa && (
                <div>
                  <dt className="inline">📊 학점</dt>
                  <dd className="ml-2 inline">
                    {item.qualification_ai.gpa}
                  </dd>
                </div>
              )}
              {item.qualification_ai?.language && (
                <div>
                  <dt className="inline">🗣️ 어학</dt>
                  <dd className="ml-2 inline">
                    {item.qualification_ai.language}
                  </dd>
                </div>
              )}
            </dl>

            {item.reason && (
              <p className="mt-3 line-clamp-1 text-xs text-gray-500">
                매칭 이유: {item.reason}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
