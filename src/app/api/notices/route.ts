// src/app/api/notices/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiGet } from "@/lib/api"; // 실제 경로에 맞춰 수정하세요
import { PagedResponse, NoticeItem } from "@/types/notices";
export async function GET(req: NextRequest) {
  try {
    // URL에서 searchParams 추출
    const { searchParams } = new URL(req.url);
    const my = searchParams.get("my") === "true";

    // my=true인 경우에만 쿠키에서 토큰 추출
    const token = my ? (await cookies()).get("DICE_TOKEN")?.value : undefined;

    // my=true인데 토큰이 없으면 401 반환
    if (my && !token) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized: missing authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 클라이언트에서 넘어온 모든 쿼리 파라미터를 객체로 변환
    // 단, 백엔드에서 'all'로 처리하지 않는 필터값은 제외 (예: category=all, dateRange=all)
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      // 공백 문자열은 전달하지 않음
      if (value === "") return;

      // 백엔드가 허용하지 않을 가능성이 높은 'all' 값들 필터링
      if ((key === "category" || key === "dateRange") && value === "all") return;

      // 'offset'이나 'limit' 등은 문자열로 전달 (apiGet 또는 백엔드에서 파싱)
      query[key] = value;
    });

    // (디버깅) 서버 로그로 전달되는 쿼리와 토큰 존재 여부 출력
    // console.log("[api/notices] proxy to backend /notices with", { query, requireAuth: my, hasToken: !!token });

    // 백엔드로 프록시 — query에 클라이언트의 모든 유효한 파라미터 전달
    const data = await apiGet<PagedResponse<NoticeItem>>("/notices", {
      requireAuth: my, // 내 공지일 때만 인증 강제
      token,
      query,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    // 에러 로그: 실제 서버 콘솔에 남도록 출력
    console.error("[api/notices] Error while proxying to /notices:", error);

    // 가능한 경우 백엔드 에러 메시지를 포함
    const message =
      error?.message ?? "Internal Server Error while fetching notices";

    return new NextResponse(
      JSON.stringify({ message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
