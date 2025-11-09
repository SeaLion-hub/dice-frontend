// src/app/api/notices/recommended/route.ts
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import type { Notice, Paginated } from "@/types/notices";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1) 쿼리 파싱
    const { searchParams } = new URL(req.url);
    const endpoint = `/notices/recommended?${searchParams.toString()}`;

    // 2) Authorization 헤더 확인 (추천 공지는 인증 필수)
    const authToken = req.headers.get("Authorization");
    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token" },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = { Authorization: authToken };

    // 3) 백엔드 호출 (api 인스턴스 사용)
    const res = await api.get<Paginated<Notice>>(endpoint, { headers });

    // 4) 성공 응답
    return NextResponse.json(res.data, { status: 200 });
  } catch (err: any) {
    // 상세 로깅
    console.error("[DICE BFF ERROR] /notices/recommended failed:", {
      status: err?.response?.status,
      data: JSON.stringify(err?.response?.data, null, 2),
      url: err?.config?.url,
      method: err?.config?.method,
      message: err?.message,
    });

    const status = err?.response?.status ?? 500;
    const message =
      err?.response?.data?.detail ??
      err?.response?.data?.message ??
      err?.message ??
      "Failed to fetch recommended notices";

    return NextResponse.json(
      { error: message, status },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
