// src/app/api/notices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';
import type { Notice, Paginated } from '@/types/notices';

export const dynamic = 'force-dynamic';

// GET /api/notices -> DICE GET /notices (쿼리스트링 패스스루 + 맞춤 공지 시 인증 전달)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.search; // ?q=...&sort=...&my=true...
    const endpoint = `/notices${search}`;

    // 맞춤 공지(my=true)일 때를 대비해 Authorization 헤더 pass-through
    const authToken = request.headers.get('Authorization');
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = authToken;
    }

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
