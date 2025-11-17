// src/app/api/notifications/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/notifications/settings -> DICE GET /notifications/settings
export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('Authorization');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized: missing Authorization header' },
        { status: 401 }
      );
    }

    const res = await api.get('/notifications/settings', {
      headers: { Authorization: authToken },
    });

    return NextResponse.json(res.data, { status: 200 });
  } catch (error: any) {
    console.error('[DICE BFF ERROR] Failed fetching notification settings:', {
      status: error?.response?.status,
      data: JSON.stringify(error?.response?.data, null, 2),
      message: error?.message,
    });

    const status = error?.response?.status ?? 500;
    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Failed to fetch notification settings';

    return NextResponse.json(
      { error: message, status },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}

// PUT /api/notifications/settings -> DICE PUT /notifications/settings
export async function PUT(request: NextRequest) {
  try {
    const authToken = request.headers.get('Authorization');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized: missing Authorization header' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const res = await api.put('/notifications/settings', body, {
      headers: { Authorization: authToken },
    });

    return NextResponse.json(res.data, { status: 200 });
  } catch (error: any) {
    console.error('[DICE BFF ERROR] Failed updating notification settings:', {
      status: error?.response?.status,
      data: JSON.stringify(error?.response?.data, null, 2),
      message: error?.message,
    });

    const status = error?.response?.status ?? 500;
    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Failed to update notification settings';

    return NextResponse.json(
      { error: message, status },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}

