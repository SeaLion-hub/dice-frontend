"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ALL_ALLOWED_KEYWORDS, createEmptyLanguageScores } from "@/lib/profileConfig";
import type { TestKey } from "@/lib/profileConfig";
import { useMajors } from "@/hooks/useMajors";
import type { ProfileFormValues } from "@/types/profile";
import { ProfileBasicFields } from "@/components/profile/ProfileBasicFields";
import { ProfileAdditionalFields } from "@/components/profile/ProfileAdditionalFields";
import { ProfileKeywordSelector } from "@/components/profile/ProfileKeywordSelector";
import { ProfileLanguageFields } from "@/components/profile/ProfileLanguageFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/profile/FieldError";

/* =========================================
 * 환경 설정
 * ========================================= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/* =========================================
 * 상수/타입
 * ========================================= */
type RegisterInputs = {
  email: string;
  password: string;
  passwordConfirm: string;
};

/* =========================================
 * 유틸
 * ========================================= */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const safeJson = async (res: Response) => {
  try {
    const t = await res.text();
    return JSON.parse(t);
  } catch {
    return null;
  }
};

/* =========================================
 * 메인 페이지
 * ========================================= */
export default function RegisterPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <RegisterInner />
    </QueryClientProvider>
  );
}

function RegisterInner() {
  const router = useRouter();
  // 단계: 1~4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // ---------- 1단계: 계정 ----------
  const accountForm = useForm<RegisterInputs>({
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
    },
    mode: "onTouched",
  });

  // ---------- 2~4단계: 프로필 ----------
  const profileForm = useForm<ProfileFormValues>({
    defaultValues: {
      gender: "prefer_not_to_say",
      age: "",
      grade: "1",
      college: "",
      major: "",
      military_service: "",
      income_bracket: "",
      gpa: "",
      keywords: [],
      languageScores: createEmptyLanguageScores(),
    },
    mode: "onTouched",
  });

  // 단과대/전공
  const { data: majorsData = [], isLoading: majorsLoading } = useMajors();

  // ---------- handlers ----------
  const handleSubmitAccount = accountForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      if (values.password !== values.passwordConfirm) {
        accountForm.setError("passwordConfirm", {
          type: "validate",
          message: "비밀번호가 서로 일치하지 않습니다.",
        });
        return;
      }
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        const detail =
          (data && (data.detail || data.message)) ??
          "계정을 생성할 수 없습니다. 이미 존재하는 이메일인지 확인해주세요.";
        throw new Error(detail);
      }
      setStep(2);
    } catch (err: any) {
      accountForm.setError("email", {
        type: "server",
        message: err?.message ?? "알 수 없는 오류가 발생했습니다.",
      });
    } finally {
      setLoading(false);
    }
  });

  const submitProfileToServer = async () => {
    setLoading(true);
    try {
      const acc = accountForm.getValues();
      const p = profileForm.getValues();

      // 1) 로그인
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(
          (loginData && (loginData.detail || loginData.message)) ??
          "로그인 토큰 발급에 실패했습니다."
        );
      }
      const token = loginData.access_token;
      if (!token) throw new Error("서버가 access_token을 보내지 않았습니다.");

      // 2) language_scores 숫자만 추출
      const language_scores: Record<string, number> = {};
      (Object.keys(p.languageScores) as TestKey[]).forEach((k) => {
        const { enabled, score } = p.languageScores[k];
        if (!enabled) return;
        const num = Number(String(score).replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(num) && String(score).trim() !== "") {
          language_scores[k] = num;
        }
      });

      // 3) keywords 안전 필터링(화이트리스트 + 중복 제거)
      const allowed = new Set(ALL_ALLOWED_KEYWORDS);
      const keywords = Array.from(
        new Set((p.keywords || []).filter((k) => allowed.has(k)))
      );

      // 4) payload 생성 + 정규화
      const ageNum = Number.parseInt(p.age, 10);
      const gradeNum = Number.parseInt(String(p.grade), 10);

      const payload: any = {
        // gender: 백엔드 Enum에 없는 값은 보내지 않음
        ...(p.gender && p.gender !== "prefer_not_to_say" ? { gender: p.gender } : {}),
        age: ageNum,
        major: p.major,
        grade: gradeNum,
        keywords,
      };

      // optional 필드는 빈문자면 아예 빼서 null 취급 받도록
      if (p.military_service) {
        payload.military_service = p.military_service;
      }

      const inc = p.income_bracket === "" ? null : Number(p.income_bracket);
      if (inc !== null && !Number.isNaN(inc)) payload.income_bracket = inc;

      const gpaNumRaw = p.gpa?.trim();
      if (gpaNumRaw) {
        const g = Number(gpaNumRaw);
        if (!Number.isNaN(g)) payload.gpa = Number(g.toFixed(2));
      }

      if (Object.keys(language_scores).length > 0)
        payload.language_scores = language_scores;

      // 5) 최종 전송
      const profileRes = await fetch(`${API_BASE}/auth/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // 6) 에러 상세 보기(422 디버깅 편의)
      const respText = await profileRes.text();
      let respJson: any = null;
      try {
        respJson = JSON.parse(respText);
      } catch {}

      if (!profileRes.ok) {
        // Avoid noisy error overlay; only warn in dev
        if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
          console.warn("Profile update failed:", respJson ?? respText);
        }

        // Build a robust, human-friendly message from various backend shapes
        let detailMsg = "프로필 저장에 실패했습니다.";
        const d: any = respJson;
        const detail = d?.detail ?? d?.message ?? d?.error ?? d?.errors;

        if (detail) {
          if (typeof detail === "string") {
            detailMsg = detail;
          } else if (Array.isArray(detail) && detail.length > 0) {
            const first = detail[0] ?? {};
            const loc = Array.isArray(first?.loc) ? first.loc : [];
            const fieldName = loc.length > 0 ? String(loc[loc.length - 1]) : (first?.field ?? "필드");
            const reason = first?.msg ?? first?.message ?? (typeof first === "string" ? first : JSON.stringify(first));
            detailMsg = `입력 오류 (${fieldName}): ${reason}`;
          } else if (typeof detail === "object") {
            // Pydantic v2 single error object or a field->messages map
            if (detail?.msg || detail?.message) {
              const loc = Array.isArray(detail?.loc) ? detail.loc : [];
              const fieldName = loc.length > 0 ? String(loc[loc.length - 1]) : "필드";
              const reason = detail?.msg ?? detail?.message;
              detailMsg = `입력 오류 (${fieldName}): ${reason}`;
            } else {
              const entries = Object.entries(detail as Record<string, unknown>);
              if (entries.length > 0) {
                const [key, val] = entries[0];
                const reason = Array.isArray(val) ? String(val[0]) : String(val);
                detailMsg = `입력 오류 (${key}): ${reason}`;
              }
            }
          }
        }

        throw new Error(detailMsg);
      }

      // 성공
      localStorage.setItem("DICE_TOKEN", token);
      router.replace("/notices");
    } catch (err: any) {
      profileForm.setError("keywords", {
        type: "server",
        message: err?.message ?? "알 수 없는 오류가 발생했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
   * 렌더
   * ========================================= */
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-6">
      <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg border border-gray-200">
        {/* 브랜딩/단계 */}
        <div className="mb-4 text-center">
          <div className="text-sm font-semibold tracking-wide text-blue-600">DICE</div>
          <div className="text-xs text-gray-500 mt-1">
            {step}단계 (총 4단계)
          </div>
          {/* 진행바 */}
          <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* ---------- 1단계: 계정 ---------- */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center">회원가입</h1>
            <p className="text-sm text-gray-500 mb-6 text-center">계정을 만들어주세요.</p>

            <form onSubmit={handleSubmitAccount} className="space-y-4">
              {/* 이메일 */}
              <div>
                <Label htmlFor="register-email">이메일</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@yonsei.ac.kr"
                  {...accountForm.register("email", { required: "이메일을 입력해주세요." })}
                />
                <FieldError message={accountForm.formState.errors.email?.message} />
              </div>

              {/* 비밀번호 */}
              <div>
                <Label htmlFor="register-password">비밀번호</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="8자 이상"
                  {...accountForm.register("password", {
                    required: "비밀번호를 입력해주세요.",
                    minLength: { value: 8, message: "8자 이상 입력해주세요." },
                  })}
                />
                <FieldError message={accountForm.formState.errors.password?.message} />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <Label htmlFor="register-password-confirm">비밀번호 확인</Label>
                <Input
                  id="register-password-confirm"
                  type="password"
                  placeholder="다시 입력"
                  {...accountForm.register("passwordConfirm", {
                    required: "비밀번호를 다시 입력해주세요.",
                    minLength: { value: 8, message: "8자 이상 입력해주세요." },
                  })}
                />
                <FieldError message={accountForm.formState.errors.passwordConfirm?.message} />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "처리 중..." : "다음으로"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              이미 계정이 있으신가요?{" "}
              <a href="/login" className="font-medium text-blue-600 hover:underline">
                로그인하기
              </a>
            </p>
          </>
        )}

        {/* ---------- 2단계: 기본 정보(필수) ---------- */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center">2단계: 기본 정보</h1>
            <p className="text-sm text-gray-600 mb-4 text-center">
              맞춤 공지 추천을 위해 최소 정보를 입력해주세요.
            </p>
            <FormProvider {...profileForm}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  profileForm.clearErrors();
                  const valid = await profileForm.trigger([
                    "gender",
                    "age",
                    "grade",
                    "college",
                    "major",
                  ]);
                  if (valid) setStep(3);
                }}
                className="space-y-4"
              >
                <ProfileBasicFields form={profileForm} majors={majorsData} majorsLoading={majorsLoading} />

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>
                    이전
                  </Button>
                  <Button type="submit" className="w-full">
                    다음
                  </Button>
                </div>
              </form>
            </FormProvider>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center">3단계: 상세 정보</h1>
            <p className="text-sm text-gray-600 mb-4 text-center">
              선택 정보지만 입력하면 맞춤 추천의 정확도가 높아집니다.
            </p>
            <FormProvider {...profileForm}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(4);
                }}
                className="space-y-4"
              >
                <ProfileAdditionalFields form={profileForm} />

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setStep(2)}>
                    이전
                  </Button>
                  <Button type="submit" className="w-full">
                    다음
                  </Button>
                </div>
              </form>
            </FormProvider>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center">4단계: 키워드 설정</h1>
            <p className="text-sm text-gray-600 mb-4 text-center">
              관심 키워드를 선택하면 맞춤 추천의 정확도가 향상됩니다.
            </p>
            <FormProvider {...profileForm}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const currentKeywords = profileForm.getValues("keywords") ?? [];
                  if (currentKeywords.length === 0) {
                    profileForm.setError("keywords", {
                      type: "validate",
                      message: "키워드를 최소 1개 이상 선택해주세요.",
                    });
                    return;
                  }
                  await submitProfileToServer();
                }}
                className="space-y-4"
              >
                <ProfileKeywordSelector form={profileForm} />
                <ProfileLanguageFields form={profileForm} />

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setStep(3)}>
                    이전
                  </Button>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "제출 중..." : "가입 완료"}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </>
        )}
      </div>
    </main>
  );
}
