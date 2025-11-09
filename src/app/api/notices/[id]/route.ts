// src/app/api/notices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';
import type { Notice } from '@/types/notices';

export const dynamic = 'force-dynamic';

// GET /api/notices/[id] -> DICE GET /notices/{id} (인증 헤더 전달)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const endpoint = `/notices/${id}`;

    // 맞춤 공지 등에서 인증이 필요할 수 있으므로 Authorization 헤더 pass-through
    const authToken = request.headers.get('Authorization');
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    const res = await api.get<Notice>(endpoint, { headers });

    return NextResponse.json(res.data, { status: 200 });
  } catch (error: any) {
    console.error('[DICE BFF ERROR] Failed fetching /notices/[id]:', {
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
      'Failed to fetch notice detail';

    return NextResponse.json(
      { error: message, status },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
