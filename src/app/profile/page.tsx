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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// 타입 정의
type GenderType = "male" | "female" | "prefer_not_to_say";
type MilitaryServiceType = "completed" | "pending" | "exempt" | "n/a";

interface UserMe {
  id: string;
  email: string;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  gender: GenderType;
  age: number;
  major: string;
  grade: number;
  keywords: string[];
  military_service: MilitaryServiceType | null;
  income_bracket: number | null;
  gpa: number | null;
  language_scores: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface ProfileFormData {
  gender: GenderType;
  age: number;
  major: string;
  grade: number;
  keywords: string[];
  military_service: MilitaryServiceType | "";
  income_bracket: number | "";
  gpa: number | "";
}

const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "prefer_not_to_say", label: "응답하지 않음" },
] as const;

const MILITARY_OPTIONS = [
  { value: "", label: "선택 안 함" },
  { value: "completed", label: "이행(전역)" },
  { value: "pending", label: "이행 예정" },
  { value: "exempt", label: "면제" },
  { value: "n/a", label: "해당 없음" },
] as const;

const INCOME_OPTIONS = Array.from({ length: 11 }).map((_, i) => ({
  value: String(i),
  label: `${i}분위`,
}));

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, logout, user } = useAuthStore();

  // 로그인 확인
  React.useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // 사용자 정보 조회
  const { data: userMe } = useQuery<UserMe>({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch user info");
      return res.json();
    },
    enabled: !!token,
  });

  // 프로필 조회
  const { data: profile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 404) {
          return null; // 프로필이 없을 수 있음
        }
        throw new Error("Failed to fetch profile");
      }
      return res.json();
    },
    enabled: !!token,
  });

  // 폼 초기화
  const form = useForm<ProfileFormData>({
    defaultValues: {
      gender: "prefer_not_to_say",
      age: 20,
      major: "",
      grade: 1,
      keywords: [],
      military_service: "",
      income_bracket: "",
      gpa: "",
    },
  });

  // 프로필 데이터가 로드되면 폼에 설정
  React.useEffect(() => {
    if (profile) {
      form.reset({
        gender: profile.gender,
        age: profile.age,
        major: profile.major,
        grade: profile.grade,
        keywords: profile.keywords || [],
        military_service: profile.military_service || "",
        income_bracket: profile.income_bracket ?? "",
        gpa: profile.gpa ?? "",
      });
    }
  }, [profile, form]);

  // 프로필 업데이트
  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const payload = {
        gender: data.gender,
        age: data.age,
        major: data.major,
        grade: data.grade,
        keywords: data.keywords,
        military_service: data.military_service || null,
        income_bracket: data.income_bracket || null,
        gpa: data.gpa || null,
        language_scores: null, // 간단화를 위해 제외
      };

      const res = await fetch("/api/auth/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      alert("프로필이 업데이트되었습니다.");
    },
    onError: (error: Error) => {
      alert(`프로필 업데이트 실패: ${error.message}`);
    },
  });

  // 로그아웃
  const handleLogout = () => {
    if (confirm("로그아웃하시겠습니까?")) {
      logout();
      router.push("/login");
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    // 키워드 검증
    if (!data.keywords || data.keywords.length === 0) {
      form.setError("keywords", {
        type: "validate",
        message: "키워드를 최소 1개 이상 입력해주세요",
      });
      return;
    }
    updateProfile.mutate(data);
  };

  if (!token) {
    return null;
  }

  return (
    <main className="mx-auto mb-20 max-w-2xl px-4 py-6 animate-in fade-in duration-300">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">설정</h1>

      {/* 사용자 정보 */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5" />
          사용자 정보
        </h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{userMe?.email || user?.email || "이메일 정보 없음"}</span>
          </div>
        </div>
      </section>

      {/* 프로필 수정 */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">프로필 수정</h2>

        {isLoadingProfile ? (
          <div className="text-sm text-gray-500">프로필을 불러오는 중...</div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 성별 */}
            <div>
              <Label htmlFor="gender">성별</Label>
              <select
                id="gender"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                {...form.register("gender", { required: "성별을 선택해주세요" })}
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.gender && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.gender.message}
                </p>
              )}
            </div>

            {/* 나이 */}
            <div>
              <Label htmlFor="age">나이</Label>
              <Input
                id="age"
                type="number"
                min={15}
                max={100}
                {...form.register("age", {
                  valueAsNumber: true,
                  required: "나이를 입력해주세요",
                  min: { value: 15, message: "나이는 15세 이상이어야 합니다" },
                  max: { value: 100, message: "나이는 100세 이하여야 합니다" },
                })}
              />
              {form.formState.errors.age && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.age.message}
                </p>
              )}
            </div>

            {/* 전공 */}
            <div>
              <Label htmlFor="major">전공</Label>
              <Input
                id="major"
                {...form.register("major", {
                  required: "전공을 입력해주세요",
                })}
              />
              {form.formState.errors.major && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.major.message}
                </p>
              )}
            </div>

            {/* 학년 */}
            <div>
              <Label htmlFor="grade">학년</Label>
              <select
                id="grade"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                {...form.register("grade", {
                  valueAsNumber: true,
                  required: "학년을 선택해주세요",
                })}
              >
                {[1, 2, 3, 4, 5, 6].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}학년
                  </option>
                ))}
              </select>
              {form.formState.errors.grade && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.grade.message}
                </p>
              )}
            </div>

            {/* 병역 */}
            <div>
              <Label htmlFor="military_service">병역 (선택)</Label>
              <select
                id="military_service"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                {...form.register("military_service")}
              >
                {MILITARY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 소득 분위 */}
            <div>
              <Label htmlFor="income_bracket">소득 분위 (선택)</Label>
              <select
                id="income_bracket"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                {...form.register("income_bracket", {
                  setValueAs: (value) => (value === "" ? "" : Number(value)),
                })}
              >
                {INCOME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 학점 */}
            <div>
              <Label htmlFor="gpa">학점 (선택)</Label>
              <Input
                id="gpa"
                type="number"
                step="0.01"
                min={0}
                max={4.5}
                placeholder="0.00 ~ 4.50"
                {...form.register("gpa", {
                  valueAsNumber: true,
                  min: { value: 0, message: "학점은 0 이상이어야 합니다" },
                  max: { value: 4.5, message: "학점은 4.5 이하여야 합니다" },
                })}
              />
              {form.formState.errors.gpa && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.gpa.message}
                </p>
              )}
            </div>

            {/* 키워드 */}
            <div>
              <Label htmlFor="keywords">
                관심 키워드 (필수) - 쉼표로 구분 (예: #학사, #장학)
              </Label>
              <Input
                id="keywords"
                placeholder="#학사, #장학"
                value={form.watch("keywords").join(", ")}
                onChange={(e) => {
                  const keywords = e.target.value
                    .split(",")
                    .map((k) => k.trim())
                    .filter((k) => k.length > 0);
                  form.setValue("keywords", keywords);
                }}
              />
              {form.formState.errors.keywords && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.keywords.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                현재 선택된 키워드: {form.watch("keywords").join(", ") || "없음"}
              </p>
            </div>

            {/* 저장 버튼 */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateProfile.isPending ? "저장 중..." : "프로필 저장"}
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* 로그아웃 */}
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

