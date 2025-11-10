// src/app/api/notices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';
import type { Notice, Paginated } from '@/types/notices';

export const dynamic = 'force-dynamic';

// GET /api/notices -> DICE GET /notices (쿼리스트링 패스스루 + 인증 헤더 전달)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const paramsMap: Record<string, string | string[]> = {};

    url.searchParams.forEach((value, key) => {
      if (paramsMap[key] === undefined) {
        paramsMap[key] = value;
        return;
      }

      const existing = paramsMap[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        paramsMap[key] = [existing, value];
      }
    });

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(paramsMap)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    }

    const endpoint = `/notices${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    // Authorization 헤더 전달 (my=true 등 맞춤 공지용)
    const authToken = request.headers.get('Authorization');
    const headers: Record<string, string> = {};
    if (authToken) headers['Authorization'] = authToken;

    const res = await api.get<Paginated<Notice>>(endpoint, { headers });

    return NextResponse.json(res.data, { status: 200 });
  } catch (error: any) {
    console.error('[DICE BFF ERROR] Failed fetching /notices:', {
      status: error?.response?.status,
      data: JSON.stringify(error?.response?.data, null, 2),
      headers: error?.response?.headers,
      url: error?.config?.url,
      method: error?.config?.method,
      params: error?.config?.params,
      message: error?.message,
    });

    const status = error?.response?.status ?? 500;
    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Failed to fetch notices';

    return NextResponse.json(
      { error: message, status },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
