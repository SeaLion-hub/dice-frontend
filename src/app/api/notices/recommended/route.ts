import { NextResponse } from "next/server";
import { apiGet } from "@/lib/api";

// GET /api/notices/recommended?limit=10&offset=0
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ?? "10";
  const offset = searchParams.get("offset") ?? "0";

  const r = await apiGet(`/notices/recommended?limit=${limit}&offset=${offset}`);
  const data = await r.json();

  return NextResponse.json(data, {
    status: r.status,
  });
}
