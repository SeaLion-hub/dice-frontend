export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function apiGet(path: string, init?: RequestInit) {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    // 토큰 쓰는 경우 여기서 Authorization 달면 됨
    // headers: { Authorization: `Bearer ${token}`, ...init?.headers },
    cache: "no-store",
  });
  return r;
}
