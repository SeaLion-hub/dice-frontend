// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/auth/me -> DICE GET /auth/me (인증 헤더 전달)
export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('Authorization');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized: missing Authorization header' },
        { status: 401 }
      );
    }

    const res = await api.get('/auth/me', {
      headers: { Authorization: authToken },
    });

    return NextResponse.json(res.data, { status: 200 });
  } catch (error: any) {
    console.error('[DICE BFF ERROR] Failed fetching /auth/me:', {
      status: error?.response?.status,
      data: JSON.stringify(error?.response?.data, null, 2),
      message: error?.message,
    });

    const status = error?.response?.status ?? 500;
    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Failed to fetch user info';

    return NextResponse.json(
      { error: message, status },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}

