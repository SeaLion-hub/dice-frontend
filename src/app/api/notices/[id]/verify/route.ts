// src/app/api/notices/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';
import type { NoticeEligibilityResult } from '@/types/notices';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Notice id is required' }, { status: 400 });
    }

    const authToken = request.headers.get('Authorization');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized: missing Authorization header' },
        { status: 401 }
      );
    }

    // 백엔드에도 POST로 위임 (빈 바디)
    // 백엔드 응답(eligible:boolean, reason?:string)을 프론트 타입으로 매핑
    const res = await api.post(
      `/notices/${encodeURIComponent(id)}/verify-eligibility`,
      {},
      { headers: { Authorization: authToken } }
    );

    const backend: any = res.data ?? {};
    const eligible: boolean = Boolean(backend.eligible);
    const reason: string = String(backend.reason || "");

    // 간단 매핑 규칙: true→ELIGIBLE, false→INELIGIBLE (정보 부족 문구 감지 시 BORDERLINE)
    const borderlineHints = ["정보", "부족", "없습니다", "없음", "미확인", "불명"];
    const isBorderline = !eligible && borderlineHints.some((h) => reason.includes(h));
    const eligibility = eligible ? "ELIGIBLE" : isBorderline ? "BORDERLINE" : "INELIGIBLE";

    const mapped: NoticeEligibilityResult = {
      noticeId: String(id),
      eligibility,
      checkedAt: new Date().toISOString(),
      reasons: reason ? [reason] : [],
    } as NoticeEligibilityResult;

    return NextResponse.json(mapped, { status: 200 });
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
