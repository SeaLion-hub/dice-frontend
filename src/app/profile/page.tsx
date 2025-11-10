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

  const {
    data: userMe,
  } = useQuery<UserMe>({
    // Include token so switching accounts refetches instead of reusing cache
    queryKey: ["user", "me", token],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user info");
      return res.json();
    },
    enabled: !!token,
  });

  const {
    data: profile,
    isLoading: isProfileLoading,
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
        throw new Error("Failed to fetch profile");
      }
      return res.json();
    },
    enabled: !!token,
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

  const lastHydratedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    lastHydratedRef.current = null;
  }, [token]);

  React.useEffect(() => {
    if (profile === undefined) return;

    // majors 정보가 아직 로딩 중이면 기존 값 유지
    if (majorsLoading) return;

    const signature = profile
      ? `${profile.user_id}-${profile.updated_at ?? "no-updated-at"}-${majorsData.length}`
      : `empty-${majorsData.length}`;

    if (lastHydratedRef.current === signature) {
      return;
    }

    if (profile === null) {
      form.reset({
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
      });
      lastHydratedRef.current = signature;
      return;
    }

    const sanitizedKeywords = sanitizeKeywords(profile.keywords || []);
    const languageScoresFromProfile = buildLanguageScoresFromProfile(profile.language_scores);
    const gradeString = ALLOWED_GRADES.includes(
      String(profile.grade ?? "1") as (typeof ALLOWED_GRADES)[number]
    )
      ? (String(profile.grade) as (typeof ALLOWED_GRADES)[number])
      : "1";
    const ageString = profile.age != null ? String(profile.age) : "";

      const derivedCollege =
        profile.college ??
        majorsData.find((item) => item.majors.includes(profile.major ?? ""))?.college ??
        form.getValues("college") ??
        "";

    form.reset({
      gender: profile.gender ?? "prefer_not_to_say",
      age: ageString,
      grade: gradeString,
      college: derivedCollege,
      major: profile.major ?? "",
      military_service: profile.military_service ?? "",
      income_bracket:
        profile.income_bracket != null ? String(profile.income_bracket) : "",
      gpa: profile.gpa != null ? String(profile.gpa) : "",
      keywords: sanitizedKeywords,
      languageScores: languageScoresFromProfile,
    });

    lastHydratedRef.current = signature;
  }, [profile, majorsData, majorsLoading, form]);

  React.useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

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
        throw new Error(error?.error || "Failed to update profile");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      // Refresh personalized and related caches after profile change
      queryClient.invalidateQueries({ queryKey: ["recommended"] });
      queryClient.invalidateQueries({ queryKey: ["notice", "eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      alert("프로필이 업데이트되었습니다.");
    },
    onError: (error: Error) => {
      alert(`프로필 업데이트 실패: ${error.message}`);
    },
  });

  const handleLogout = () => {
    if (confirm("로그아웃하시겠습니까?")) {
      logout();
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

    const payload: Record<string, unknown> = {
      age: ageNum,
      major: data.major,
      college: data.college,
      grade: gradeNum,
      keywords: sanitizedKeywords,
      gender: data.gender ?? "prefer_not_to_say",
    };

    if (data.military_service) {
      payload.military_service = data.military_service;
    }

    if (data.income_bracket !== "") {
      const incomeNum = Number(data.income_bracket);
      if (!Number.isNaN(incomeNum)) {
        payload.income_bracket = incomeNum;
      }
    }

    if (data.gpa.trim() !== "") {
      const gpaNum = Number(data.gpa);
      if (!Number.isNaN(gpaNum)) {
        payload.gpa = Number(gpaNum.toFixed(2));
      }
    }

    if (Object.keys(language_scores).length > 0) {
      payload.language_scores = language_scores;
    }

    updateProfile.mutate(payload);
  };

  if (!token) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-32 animate-in fade-in duration-300">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">설정</h1>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5" />
          사용자 정보
        </h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{userMe?.email || user?.email || "이메일 정보 없음"}</span>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">프로필 수정</h2>

        {isProfileLoading ? (
          <div className="text-sm text-gray-500">프로필을 불러오는 중...</div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProfileBasicFields form={form} majors={majorsData} majorsLoading={majorsLoading} />
            <ProfileAdditionalFields form={form} />
            <ProfileKeywordSelector form={form} />
            <ProfileLanguageFields form={form} />

            <Button
              type="submit"
              className="w-full"
              disabled={updateProfile.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateProfile.isPending ? "저장 중..." : "프로필 저장"}
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
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </section>
    </main>
  );
}


