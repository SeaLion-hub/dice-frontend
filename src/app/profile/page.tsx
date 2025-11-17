"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Save, User, Mail } from "lucide-react";

import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryInvalidation } from "@/hooks/useQueryInvalidation";
import {
  ALL_ALLOWED_KEYWORDS,
  ALLOWED_GRADES,
  GENDER_OPTIONS,
  MILITARY_OPTIONS,
  createEmptyLanguageScores,
  TESTS,
} from "@/lib/profileConfig";
import type { LanguageScores, TestKey } from "@/lib/profileConfig";
import { useMajors } from "@/hooks/useMajors";
import type { ProfileFormValues } from "@/types/profile";
import { ProfileKeywordSelector } from "@/components/profile/ProfileKeywordSelector";
import { ProfileBasicFields } from "@/components/profile/ProfileBasicFields";
import { ProfileAdditionalFields } from "@/components/profile/ProfileAdditionalFields";
import { ProfileLanguageFields } from "@/components/profile/ProfileLanguageFields";
import BottomNav from "@/components/nav/BottomNav";
import { useApiError } from "@/hooks/useApiError";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const ALLOWED_KEYWORD_SET = new Set(ALL_ALLOWED_KEYWORDS);

interface UserMe {
  id: string;
  email: string;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  gender?: (typeof GENDER_OPTIONS)[number]["value"] | null;
  age: number | null;
  major: string | null;
  college: string | null;
  grade: number | null;
  keywords: string[] | null;
  military_service: (typeof MILITARY_OPTIONS)[number]["value"] | null;
  income_bracket: number | null;
  gpa: number | null;
  language_scores: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

function sanitizeKeywords(keywords: string[]): string[] {
  if (!keywords) return [];
  const unique = new Set<string>();
  keywords.forEach((kw) => {
    const trimmed = kw.trim();
    if (ALLOWED_KEYWORD_SET.has(trimmed)) {
      unique.add(trimmed);
    }
  });
  return Array.from(unique);
}

function buildLanguageScoresFromProfile(
  input: Record<string, number> | null | undefined
): LanguageScores {
  const base = createEmptyLanguageScores();
  if (!input) return base;
  (Object.keys(base) as TestKey[]).forEach((key) => {
    const score = input[key];
    if (score != null && !Number.isNaN(Number(score))) {
      base[key] = { enabled: true, score: String(score) };
    }
  });
  return base;
}

function extractLanguageScores(data: LanguageScores): Record<string, number> {
  const result: Record<string, number> = {};
  (Object.keys(data) as TestKey[]).forEach((key) => {
    const { enabled, score } = data[key];
    if (!enabled) return;
    const numeric = Number(String(score).replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(numeric) && String(score).trim() !== "") {
      result[key] = numeric;
    }
  });
  return result;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, logout, user } = useAuthStore();
  const { getErrorMessage } = useApiError();

  const {
    data: userMe,
    isError: isUserMeError,
    error: userMeError,
  } = useQuery<UserMe>({
    // Include token so switching accounts refetches instead of reusing cache
    queryKey: ["user", "me", token],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let errorMessage = "사용자 정보를 불러오는데 실패했습니다.";
        try {
          const errorData = await res.json();
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        const error = new Error(errorMessage);
        (error as any).status = res.status;
        throw error;
      }
      return res.json();
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
  } = useQuery<UserProfile | null>({
    // Include token to avoid showing another account's cached profile
    queryKey: ["user", "profile", token],
    queryFn: async () => {
      const res = await fetch("/api/auth/me/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        let errorMessage = "프로필을 불러오는데 실패했습니다.";
        try {
          const errorData = await res.json();
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        const error = new Error(errorMessage);
        (error as any).status = res.status;
        throw error;
      }
      return res.json();
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2분간 캐시 유지
  });

  const {
    data: majorsData = [],
    isLoading: majorsLoading,
  } = useMajors();

  const form = useForm<ProfileFormValues>({
    mode: "onTouched",
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
  });

  const isFormDirty = form.formState.isDirty;

  const lastHydratedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    lastHydratedRef.current = null;
  }, [token]);

  React.useEffect(() => {
    if (profile === undefined) return;

    const signature = profile
      ? `${profile.user_id}-${profile.updated_at ?? "no-updated-at"}-${majorsData.length}-${majorsLoading}`
      : `empty-${majorsData.length}-${majorsLoading}`;

    const defaults: ProfileFormValues = {
      gender: "prefer_not_to_say",
      age: "",
      grade: "1",
      college: "",
      major: "",
      military_service: "",
      income_bracket: "",
      gpa: "",
      keywords: [] as string[],
      languageScores: createEmptyLanguageScores(),
    };

    if (profile === null) {
      // 프로필이 없으면 기본값으로 초기화
      if (lastHydratedRef.current !== signature) {
        form.reset(defaults, { 
          keepDefaultValues: false,
          keepErrors: false,
          keepDirty: false,
        });
        lastHydratedRef.current = signature;
      }
      return;
    }

    // 프로필이 있으면 프로필 값으로 폼 초기화
    const sanitizedKeywords = sanitizeKeywords(profile.keywords || []);
    const languageScoresFromProfile = buildLanguageScoresFromProfile(profile.language_scores);
    const gradeString = ALLOWED_GRADES.includes(
      String(profile.grade ?? "1") as (typeof ALLOWED_GRADES)[number]
    )
      ? (String(profile.grade) as (typeof ALLOWED_GRADES)[number])
      : "1";
    const ageString = profile.age != null ? String(profile.age) : "";

    // college 필드: 프로필에 저장된 값이 있으면 사용, 없으면 전공으로부터 추론
    // majors가 로드되지 않았어도 프로필에 저장된 college 값은 사용 가능
    let derivedCollege = profile.college ?? "";
    if (!derivedCollege && profile.major && !majorsLoading && majorsData.length > 0) {
      // 전공으로부터 단과대 찾기 (정확한 매칭)
      const collegeFromMajor = majorsData.find((item) => 
        item.majors.some(m => m.toLowerCase() === profile.major?.toLowerCase())
      )?.college;
      if (collegeFromMajor) {
        derivedCollege = collegeFromMajor;
      }
    }

    const expectedValues: ProfileFormValues = {
      gender: (profile.gender ?? "prefer_not_to_say") as (typeof GENDER_OPTIONS)[number]["value"],
      age: ageString,
      grade: gradeString,
      college: derivedCollege,
      major: profile.major ?? "",
      military_service: (profile.military_service ?? "") as (typeof MILITARY_OPTIONS)[number]["value"] | "",
      income_bracket: profile.income_bracket != null ? String(profile.income_bracket) : "",
      gpa: profile.gpa != null ? String(profile.gpa) : "",
      keywords: sanitizedKeywords,
      languageScores: languageScoresFromProfile,
    };

    // 시그니처가 변경되었을 때만 리셋 (프로필이 업데이트되었거나 처음 로드될 때)
    if (lastHydratedRef.current !== signature) {
      console.log('[Profile] Resetting form with profile values:', {
        profileData: {
          gender: profile.gender,
          college: profile.college,
          major: profile.major,
          military_service: profile.military_service,
          income_bracket: profile.income_bracket,
          gpa: profile.gpa,
        },
        formValues: {
          gender: expectedValues.gender,
          college: expectedValues.college,
          major: expectedValues.major,
          military_service: expectedValues.military_service,
          income_bracket: expectedValues.income_bracket,
          gpa: expectedValues.gpa,
        },
        majorsLoading: majorsLoading,
        majorsDataLength: majorsData.length,
      });
      
      // form.reset()을 강제로 호출하여 모든 필드를 업데이트
      form.reset(expectedValues, { 
        keepDefaultValues: false,
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });
      
      lastHydratedRef.current = signature;
    }
  }, [profile, majorsData, majorsLoading, form]);

  // 프로필 데이터가 로드되었는지 확인하는 디버깅용 useEffect
  React.useEffect(() => {
    if (profile) {
      console.log('[Profile] Profile data loaded:', {
        gender: profile.gender,
        college: profile.college,
        major: profile.major,
        military_service: profile.military_service,
        income_bracket: profile.income_bracket,
        gpa: profile.gpa,
        keywords: profile.keywords,
      });
    }
  }, [profile]);

  React.useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // 해시가 있으면 해당 필드로 스크롤
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          // 포커스 가능한 요소가 있으면 포커스
          const focusable = element.querySelector('input, select, textarea, button');
          if (focusable && focusable instanceof HTMLElement) {
            focusable.focus();
          }
        }, 300);
      }
    }
  }, [isProfileLoading]);

  const { invalidateUserProfile, invalidateAllNotices } = useQueryInvalidation();

  const updateProfile = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/auth/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error?.message || error?.error || "Failed to update profile");
      }

      return res.json();
    },
    onSuccess: () => {
      // 프로필 업데이트 시 관련된 모든 쿼리 무효화
      invalidateUserProfile();
      invalidateAllNotices();
      // 성공 메시지 표시 (alert 대신 토스트 사용 권장)
      const successMessage = "프로필이 업데이트되었습니다.";
      // 간단한 알림 (나중에 토스트 라이브러리로 교체 가능)
      if (typeof window !== "undefined") {
        const notification = document.createElement("div");
        notification.className = "fixed top-4 right-4 z-50 rounded-lg bg-green-500 px-4 py-2 text-white shadow-lg";
        notification.textContent = successMessage;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error) || "프로필 업데이트에 실패했습니다.";
      // 에러 메시지 표시
      if (typeof window !== "undefined") {
        const notification = document.createElement("div");
        notification.className = "fixed top-4 right-4 z-50 rounded-lg bg-red-500 px-4 py-2 text-white shadow-lg";
        notification.textContent = errorMessage;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.remove();
        }, 5000);
      }
    },
  });

  const handleLogout = () => {
    if (typeof window !== "undefined" && window.confirm("로그아웃하시겠습니까?")) {
      logout();
      document.cookie =
        "DICE_TOKEN=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
      router.push("/login");
    }
  };

  const onSubmit = (data: ProfileFormValues) => {
    const sanitizedKeywords = sanitizeKeywords(data.keywords);
    if (sanitizedKeywords.length === 0) {
      form.setError("keywords", {
        type: "validate",
        message: "키워드를 최소 1개 이상 선택해주세요",
      });
      return;
    }

    if (!data.major) {
      form.setError("major", {
        type: "validate",
        message: "전공을 선택해주세요",
      });
      return;
    }

    if (!data.college) {
      form.setError("college", {
        type: "validate",
        message: "단과대를 선택해주세요",
      });
      return;
    }

    const ageNum = Number.parseInt(data.age, 10);
    if (Number.isNaN(ageNum) || ageNum < 15 || ageNum > 100) {
      form.setError("age", {
        type: "validate",
        message: "나이는 15~100 사이의 숫자로 입력해주세요",
      });
      return;
    }

    const gradeNum = Number.parseInt(data.grade, 10);
    if (Number.isNaN(gradeNum)) {
      form.setError("grade", {
        type: "validate",
        message: "학년을 선택해주세요",
      });
      return;
    }

    const language_scores = extractLanguageScores(data.languageScores);

    // 기존 프로필 값과 병합 (기존 값이 있으면 유지, 없으면 새 값 사용)
    const payload: Record<string, unknown> = {
      age: ageNum,
      major: data.major,
      college: data.college,
      grade: gradeNum,
      keywords: sanitizedKeywords,
      gender: data.gender ?? (profile?.gender ?? "prefer_not_to_say"),
    };

    // 선택 필드는 값이 있으면 업데이트, 없으면 기존 값 유지
    if (data.military_service) {
      payload.military_service = data.military_service;
    } else if (profile?.military_service) {
      // 기존 값이 있으면 유지
      payload.military_service = profile.military_service;
    }

    if (data.income_bracket !== "") {
      const incomeNum = Number(data.income_bracket);
      if (!Number.isNaN(incomeNum)) {
        payload.income_bracket = incomeNum;
      }
    } else if (profile?.income_bracket != null) {
      // 기존 값이 있으면 유지
      payload.income_bracket = profile.income_bracket;
    }

    if (data.gpa.trim() !== "") {
      const gpaNum = Number(data.gpa);
      if (!Number.isNaN(gpaNum)) {
        payload.gpa = Number(gpaNum.toFixed(2));
      }
    } else if (profile?.gpa != null) {
      // 기존 값이 있으면 유지
      payload.gpa = profile.gpa;
    }

    // language_scores는 객체이므로 기존 값과 병합
    if (Object.keys(language_scores).length > 0) {
      payload.language_scores = language_scores;
    } else if (profile?.language_scores && Object.keys(profile.language_scores).length > 0) {
      // 기존 값이 있으면 유지
      payload.language_scores = profile.language_scores;
    }

    updateProfile.mutate(payload);
  };

  // 프로필 완성도 계산
  const calculateProfileCompleteness = React.useCallback((profile: UserProfile | null): {
    percentage: number;
    missingFields: string[];
    completedFields: string[];
  } => {
    if (!profile) {
      return { percentage: 0, missingFields: [], completedFields: [] };
    }

    const requiredFields: Array<{ key: keyof UserProfile; label: string }> = [
      { key: "age", label: "나이" },
      { key: "major", label: "전공" },
      { key: "college", label: "단과대" },
      { key: "grade", label: "학년" },
      { key: "keywords", label: "관심 키워드" },
    ];

    const optionalFields: Array<{ key: keyof UserProfile; label: string }> = [
      { key: "military_service", label: "병역 여부" },
      { key: "income_bracket", label: "소득 분위" },
      { key: "gpa", label: "학점" },
      { key: "language_scores", label: "어학 점수" },
    ];

    const completedRequired = requiredFields.filter((field) => {
      const value = profile[field.key];
      if (field.key === "keywords") {
        return Array.isArray(value) && value.length > 0;
      }
      return value != null && value !== "";
    });

    const completedOptional = optionalFields.filter((field) => {
      const value = profile[field.key];
      if (field.key === "language_scores") {
        return value != null && typeof value === "object" && Object.keys(value).length > 0;
      }
      return value != null && value !== "";
    });

    const missingRequired = requiredFields
      .filter((field) => {
        const value = profile[field.key];
        if (field.key === "keywords") {
          return !Array.isArray(value) || value.length === 0;
        }
        return value == null || value === "";
      })
      .map((f) => f.label);

    const missingOptional = optionalFields
      .filter((field) => {
        const value = profile[field.key];
        if (field.key === "language_scores") {
          return value == null || typeof value !== "object" || Object.keys(value).length === 0;
        }
        return value == null || value === "";
      })
      .map((f) => f.label);

    // 완성도 계산: 필수 70%, 선택 30%
    const requiredScore = (completedRequired.length / requiredFields.length) * 70;
    const optionalScore = (completedOptional.length / optionalFields.length) * 30;
    const percentage = Math.round(requiredScore + optionalScore);

    return {
      percentage,
      missingFields: [...missingRequired, ...missingOptional],
      completedFields: [
        ...completedRequired.map((f) => f.label),
        ...completedOptional.map((f) => f.label),
      ],
    };
  }, []);

  const completeness = React.useMemo(() => calculateProfileCompleteness(profile ?? null), [profile, calculateProfileCompleteness]);

  if (!token) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24 animate-in fade-in duration-300">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">설정</h1>
        {userMe && (
          <p className="mt-1 text-sm text-gray-600">
            {userMe.email}
          </p>
        )}
      </header>

      {/* 에러 상태 표시 */}
      {isUserMeError && (
        <div 
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          <p className="mb-2 font-semibold">사용자 정보를 불러오는데 실패했습니다.</p>
          <p className="text-xs">{getErrorMessage(userMeError)}</p>
        </div>
      )}

      {isProfileError && (
        <div 
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          <p className="mb-2 font-semibold">프로필을 불러오는데 실패했습니다.</p>
          <p className="text-xs">{getErrorMessage(profileError)}</p>
        </div>
      )}

      {/* 프로필 완성도 섹션 */}
      {isProfileLoading ? (
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        </section>
      ) : profile ? (
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5" aria-hidden="true" />
            프로필 완성도
          </h2>
          
          <div className="space-y-4">
            {/* 프로그레스 바 */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">완성도</span>
                <span className={`font-semibold ${
                  completeness.percentage >= 80 ? "text-green-600" :
                  completeness.percentage >= 50 ? "text-amber-600" :
                  "text-red-600"
                }`}>
                  {completeness.percentage}%
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all duration-500 ${
                    completeness.percentage >= 80 ? "bg-green-500" :
                    completeness.percentage >= 50 ? "bg-amber-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${completeness.percentage}%` }}
                  aria-label={`${completeness.percentage}% 완성`}
                />
              </div>
            </div>

            {/* 부족한 항목 안내 */}
            {completeness.missingFields.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 text-sm font-semibold text-amber-900">입력이 필요한 항목</div>
                <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
                  {completeness.missingFields.map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 완성도에 따른 안내 */}
            {completeness.percentage < 100 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <div className="font-semibold mb-1">
                  {completeness.percentage >= 80
                    ? "거의 완성되었어요! 🎉"
                    : completeness.percentage >= 50
                    ? "조금만 더 채워주세요"
                    : "프로필을 더 채워주세요"}
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {completeness.percentage >= 80
                    ? "프로필이 완성되면 더 정확한 맞춤 추천을 받을 수 있어요."
                    : "프로필을 완성할수록 AI가 더 정확하게 적합한 공지를 추천해드려요."}
                </p>
              </div>
            )}

            {completeness.percentage === 100 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <div className="font-semibold">프로필이 완성되었어요! 🎉</div>
                <p className="text-xs text-green-700 mt-1">
                  완성된 프로필로 더 정확한 맞춤 추천을 받고 계세요.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">프로필 수정</h2>

        {isProfileLoading ? (
          <div className="space-y-4" role="status" aria-label="프로필 로딩 중">
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProfileBasicFields form={form} majors={majorsData} majorsLoading={majorsLoading} />
            <ProfileAdditionalFields form={form} />
            <ProfileKeywordSelector form={form} />
            <ProfileLanguageFields form={form} />

            <Button
              type="submit"
              className="w-full"
              disabled={updateProfile.isPending || !isFormDirty}
              aria-label={updateProfile.isPending ? "저장 중" : "프로필 저장"}
            >
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {updateProfile.isPending ? "저장 중..." : isFormDirty ? "프로필 저장" : "변경사항 없음"}
            </Button>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-red-900">계정 관리</h2>
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full"
          aria-label="로그아웃"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          로그아웃
        </Button>
      </section>

      {/* 하단 네비게이터 바 */}
      <BottomNav />
    </main>
  );
}


