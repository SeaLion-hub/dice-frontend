// src/app/api/notices/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';
import type { NoticeEligibilityResult } from '@/types/notices';

export const dynamic = 'force-dynamic';

// GET → POST 전환 + URL에서 id 직접 파싱
export async function POST(
  request: NextRequest,
  _context: { params: { id: string } } // 사용 안 함 (호환만 유지)
) {
  try {
    // URL에서 /api/notices/{id}/verify 형태의 {id} 추출
    const { pathname } = new URL(request.url);
    const segments = pathname.split('/').filter(Boolean); // ['api','notices','{id}','verify']
    const idx = segments.indexOf('notices');
    const id = idx >= 0 && segments[idx + 1] ? segments[idx + 1] : undefined;

    if (!id) {
      return NextResponse.json(
        { error: 'Notice id is required' },
        { status: 400 }
      );
    }

    const authToken = request.headers.get('Authorization');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized: missing Authorization header' },
        { status: 401 }
      );
    }

    // 백엔드도 POST 사용, 빈 body 전송
    const res = await api.post<NoticeEligibilityResult>(
      `/notices/${encodeURIComponent(id)}/verify-eligibility`,
      {},
      {
        headers: { Authorization: authToken },
      }
    );

    return NextResponse.json(res.data, { status: 200 });
  } catch (error: any) {
    console.error('[DICE BFF ERROR] POST /notices/:id/verify-eligibility failed', {
      status: error?.response?.status,
      data: JSON.stringify(error?.response?.data, null, 2),
      url: error?.config?.url,
      method: error?.config?.method,
      message: error?.message,
    });

    const status = error?.response?.status ?? 500;

    if (status === 401) {
      const message =
        error?.response?.data?.message ??
        'Unauthorized: invalid or expired token';
      return NextResponse.json({ error: message, status }, { status: 401 });
    }

    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Failed to verify eligibility';

    return NextResponse.json(
      { error: message, status },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
