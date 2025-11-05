// 기존 fetch 코드 기준으로 아래처럼 변경
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const sort = searchParams.get("sort") || "recent";
  const college = searchParams.get("college");
  const date_from = searchParams.get("date_from");
  const date_to = searchParams.get("date_to");
  const limit = searchParams.get("limit") ?? "20";
  const offset = searchParams.get("offset") ?? "0";

  const query = new URLSearchParams({
    sort,
    limit,
    offset,
  });

  if (q) query.set("q", q);
  if (college) query.set("college", college);
  if (date_from) query.set("date_from", date_from);
  if (date_to) query.set("date_to", date_to);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/notices?${query.toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
