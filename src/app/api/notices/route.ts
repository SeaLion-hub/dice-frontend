import { NextResponse } from "next/server";
import { apiGet } from "@/lib/api";

// GET /api/notices?my=true&sort=recent&limit=20&offset=0
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const my = searchParams.get("my") ?? "false";
  const sort = searchParams.get("sort") ?? "recent";
  const limit = searchParams.get("limit") ?? "20";
  const offset = searchParams.get("offset") ?? "0";

  const qs = new URLSearchParams({
    sort,
    limit,
    offset,
  });
  if (my === "true") {
    qs.set("my", "true");
  }

  const r = await apiGet(`/notices?${qs.toString()}`);
  const data = await r.json();

  return NextResponse.json(data, {
    status: r.status,
  });
}
