// src/app/api/notices/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';
import type { NoticeEligibilityResult } from '@/types/notices';

type UserProfileResponse = {
  gender?: string | null;
  age?: number | null;
  major?: string | null;
  grade?: number | null;
  keywords?: string[] | null;
  military_service?: string | null;
  income_bracket?: number | null;
  gpa?: number | null;
  language_scores?: Record<string, number | string> | null;
};

function mapProfileForVerification(profile: UserProfileResponse | null) {
  if (!profile) return null;
  return {
    gender: profile.gender ?? null,
    age: profile.age ?? null,
    major: profile.major ?? null,
    grade: profile.grade ?? null,
    keywords: profile.keywords ?? [],
    military_service: profile.military_service ?? null,
    income_bracket: profile.income_bracket ?? null,
    gpa: profile.gpa ?? null,
    language_scores: profile.language_scores ?? {},
  } as Record<string, unknown>;
}

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

    // 사용자 프로필을 불러와 자격 검증에 전달
    let verificationProfile: Record<string, unknown> | null = null;
    try {
      const profileRes = await api.get<UserProfileResponse>(`/auth/me/profile`, {
        headers: { Authorization: authToken },
      });
      verificationProfile = mapProfileForVerification(profileRes.data ?? null);
    } catch (profileError: any) {
      const status = profileError?.response?.status;
      if (status === 404) {
        return NextResponse.json(
          { error: '프로필이 없습니다. 설정에서 정보를 입력한 뒤 다시 시도해 주세요.' },
          { status: 422 }
        );
      }
      if (status === 401) {
        return NextResponse.json(
          { error: '로그인이 만료되었거나 사용자 정보를 찾을 수 없습니다.' },
          { status: 401 }
        );
      }
      console.error('[DICE BFF ERROR] Failed to load profile for eligibility', {
        status,
        data: JSON.stringify(profileError?.response?.data, null, 2),
      });
      throw profileError;
    }

    if (!verificationProfile) {
      return NextResponse.json(
        { error: '자격 검증을 위해 프로필 정보가 필요합니다.' },
        { status: 422 }
      );
    }

    // 백엔드에도 POST로 위임
    const res = await api.post(
      `/notices/${encodeURIComponent(id)}/verify-eligibility`,
      verificationProfile,
      { headers: { Authorization: authToken } }
    );

    const backend: any = res.data ?? {};
    const eligibility = backend.eligibility ?? (backend.eligible ? "ELIGIBLE" : backend.eligible === false ? "INELIGIBLE" : null);
    const reasonsList: string[] =
      Array.isArray(backend.reasons_human) && backend.reasons_human.length > 0
        ? backend.reasons_human
        : Array.isArray(backend.reasons)
        ? backend.reasons
        : backend.reason
        ? [String(backend.reason)]
        : [];

    const criteria = backend.criteria_results ?? {};
    const mapped: NoticeEligibilityResult = {
      noticeId: String(id),
      eligibility: eligibility,
      checkedAt: new Date().toISOString(),
      reasons: reasonsList,
      reasons_human: backend.reasons_human ?? reasonsList,
      criteria_results: {
        pass: Array.isArray(criteria.pass) ? criteria.pass : [],
        fail: Array.isArray(criteria.fail) ? criteria.fail : [],
        verify: Array.isArray(criteria.verify) ? criteria.verify : [],
      },
      missing_info: Array.isArray(backend.missing_info) ? backend.missing_info : [],
      suitable: typeof backend.suitable === "boolean" ? backend.suitable : undefined,
      reason_codes: Array.isArray(backend.reason_codes) ? backend.reason_codes : [],
      raw: backend,
    };

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
