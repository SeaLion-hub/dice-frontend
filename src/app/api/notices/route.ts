// src/app/api/notices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiGet } from "@/lib/api";
import { PagedResponse, NoticeItem } from "@/types/notices"; // 타입 가정

export async function GET(req: NextRequest) {
  try {
    // 1) query 파싱
    const { searchParams } = new URL(req.url);
    const my = searchParams.get("my") === "true";
    const limit = searchParams.get("limit") ?? "20";
    const offset = searchParams.get("offset") ?? "0";

    // 2) 인증 토큰 (ex: 로그인 시 쿠키에 저장했다고 가정: "DICE_TOKEN")
    const cookieStore = await cookies();
    const token = cookieStore.get("DICE_TOKEN")?.value;

    // 3) 백엔드로 프록시
    //    /notices 엔드포인트로 넘겨주는데
    //    my=true면 requireAuth=true 로 호출 (맞춤 공지는 로그인 필요)
    const data = await apiGet<PagedResponse<NoticeItem>>("/notices", {
      requireAuth: my, // 내 공지일 때만 인증 강제
      token,
      query: {
        my,
        limit,
        offset,
      },
    });

    // 4) 성공 응답
    return NextResponse.json(data);
  } catch (err: any) {
    // 인증 토큰이 없어서 난 경우 => 401
    if (err instanceof Error && err.message.includes("NO_AUTH_TOKEN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 그 외 백엔드 에러, 파싱 에러 등 => 500
    return NextResponse.json(
        { error: "Failed to fetch notices", detail: String(err.message ?? err) },
        { status: 500 }
    );
  }
}
