// src/app/api/notices/recommended/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    // 1) 쿠키에서 액세스 토큰 읽기
    const cookieStore = await cookies();
    const token = cookieStore.get("DICE_TOKEN")?.value;
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // 2) 클라에서 넘겨준 쿼리 그대로 백엔드로 전달
    const url = new URL("/notices", API_BASE);
    // '맞춤 공지'는 my=true 쿼리로 필터링한다고 가정
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
    if (!url.searchParams.has("my")) url.searchParams.set("my", "true");

    // 3) 백엔드로 Authorization 헤더 붙여서 프록시
    const backendRes = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    // 4) 백엔드 에러면 그대로 전달(디버깅 용이)
    if (!backendRes.ok) {
      const body = await backendRes.text().catch(() => "");
      return new NextResponse(body || backendRes.statusText, {
        status: backendRes.status,
        headers: { "content-type": backendRes.headers.get("content-type") ?? "text/plain" },
      });
    }

    // 5) 정상 응답은 JSON 그대로 반환
    const data = await backendRes.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[/api/notices/recommended] proxy error:", err);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
