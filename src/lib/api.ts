// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export interface ApiGetOptions {
  requireAuth?: boolean;
  token?: string; // 서버 route handler에서 읽은 토큰을 넘겨줄 수 있게
  query?: Record<string, string | number | boolean | undefined>;
}

/**
 * 백엔드 API(GET)를 감싸는 유틸.
 * - query 파라미터를 알아서 붙여줌
 * - requireAuth=true일 경우 Authorization 헤더 추가
 */
export async function apiGet<T>(
  path: string,
  { requireAuth, token, query }: ApiGetOptions = {}
): Promise<T> {
  // 1) 쿼리 스트링 구성
  const url = new URL(API_BASE + path);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // 2) 헤더 구성
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    // token은 route handler에서 쿠키 등으로 확보해서 넣어줄 예정
    if (!token) {
      // 인증이 필요한데 토큰이 아예 없으면 에러를 던져서
      // route handler가 401을 응답하게 할 수 있도록
      throw new Error("NO_AUTH_TOKEN");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  // 3) 실제 fetch
  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
    // 백엔드 API는 서버-서버 통신이므로 credentials 필요 없다면 생략 가능.
    // 만약 백엔드가 쿠키기반 인증이라면 여기에 credentials: "include" 고려
  });

  if (!res.ok) {
    // 에러 내용을 최대한 surface
    const text = await res.text().catch(() => "");
    throw new Error(
      `API_GET_FAILED ${res.status} ${res.statusText} :: ${text}`
    );
  }

  return res.json() as Promise<T>;
}
