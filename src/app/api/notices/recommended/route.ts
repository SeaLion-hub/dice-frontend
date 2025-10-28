// src/app/api/notices/recommended/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiGet } from "@/lib/api";
import { PagedResponse, NoticeItem } from "@/types/notices";

export async function GET(req: NextRequest) {
  try {
    // 1) query 파싱
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ?? "10";
    const offset = searchParams.get("offset") ?? "0";

    // 2) 토큰 확보
    const cookieStore = await cookies();
    const token = cookieStore.get("DICE_TOKEN")?.value;

    // 3) 추천 공지는 "회원님께 추천!"이라 개인화일 가능성 높음 → requireAuth: true로 간다
    const data = await apiGet<PagedResponse<NoticeItem>>(
      "/notices/recommended",
      {
        requireAuth: true,
        token,
        query: {
          limit,
          offset,
        },
      }
    );

    // 4) 성공
    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof Error && err.message.includes("NO_AUTH_TOKEN")) {
      // 로그인 안 된 사용자라면 401로 돌려줌
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 여기서 만약 백엔드가 진짜로 500을 던졌다면:
    // 우리는 그대로 502 (Bad Gateway-ish) 정도로 감싸도 되고, 그냥 500 그대로 줘도 됩니다.
    return NextResponse.json(
      {
        error: "Failed to fetch recommended notices",
        detail: String(err.message ?? err),
      },
      { status: 500 }
    );
  }
}
