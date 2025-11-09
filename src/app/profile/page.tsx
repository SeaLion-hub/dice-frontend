"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Save, User, Mail } from "lucide-react";

import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALLOWED_GRADES,
  ALL_ALLOWED_KEYWORDS,
  GENDER_OPTIONS,
  INCOME_OPTIONS,
  KEYWORDS_TREE,
  MILITARY_OPTIONS,
  PARENTS_WITHOUT_DETAIL,
  TESTS,
  TOP_LEVEL_KEYWORDS,
  createEmptyLanguageScores,
  type LanguageScores,
  type TestKey,
} from "@/lib/profileConfig";
import { useMajors } from "@/hooks/useMajors";

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
  grade: number | null;
  keywords: string[] | null;
  military_service: (typeof MILITARY_OPTIONS)[number]["value"] | null;
  income_bracket: number | null;
  gpa: number | null;
  language_scores: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

type ProfileFormData = {
  gender: (typeof GENDER_OPTIONS)[number]["value"];
  age: string;
  grade: (typeof ALLOWED_GRADES)[number];
  college: string;
  major: string;
  military_service: (typeof MILITARY_OPTIONS)[number]["value"];
  income_bracket: string;
  gpa: string;
  keywords: string[];
  languageScores: LanguageScores;
};

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

  const form = useForm<ProfileFormData>({
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

  const selectedCollege = form.watch("college");
  const keywords = form.watch("keywords");
  const languageScores = form.watch("languageScores");

  const majorsOfSelectedCollege = React.useMemo(() => {
    if (!selectedCollege) return [];
    const found = majorsData.find((item) => item.college === selectedCollege);
    return found?.majors ?? [];
  }, [majorsData, selectedCollege]);

  React.useEffect(() => {
    if (!selectedCollege) return;
    const currentMajor = form.getValues("major");
    if (currentMajor && !majorsOfSelectedCollege.includes(currentMajor)) {
      form.setValue("major", "", { shouldValidate: true });
    }
  }, [selectedCollege, majorsOfSelectedCollege, form]);

  React.useEffect(() => {
    if (profile === undefined) return;

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
      return;
    }

    const sanitizedKeywords = sanitizeKeywords(profile.keywords || []);
    const languageScoresFromProfile = buildLanguageScoresFromProfile(
      profile.language_scores
    );
    const gradeString = ALLOWED_GRADES.includes(
      String(profile.grade ?? "1") as (typeof ALLOWED_GRADES)[number]
    )
      ? (String(profile.grade) as (typeof ALLOWED_GRADES)[number])
      : "1";
    const ageString = profile.age != null ? String(profile.age) : "";

    form.reset({
      gender: profile.gender ?? "prefer_not_to_say",
      age: ageString,
      grade: gradeString,
      college: form.getValues("college"),
      major: profile.major ?? "",
      military_service: profile.military_service ?? "",
      income_bracket:
        profile.income_bracket != null ? String(profile.income_bracket) : "",
      gpa: profile.gpa != null ? String(profile.gpa) : "",
      keywords: sanitizedKeywords,
      languageScores: languageScoresFromProfile,
    });
  }, [profile, form]);

  React.useEffect(() => {
    if (!profile || !profile.major || majorsData.length === 0) return;
    const currentCollege = form.getValues("college");
    if (currentCollege) return;
    const matched = majorsData.find((item) =>
      item.majors.includes(profile.major ?? "")
    );
    if (matched) {
      form.setValue("college", matched.college);
    }
  }, [profile, majorsData, form]);

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

  const [keywordModalParent, setKeywordModalParent] = React.useState<string | null>(null);

  const toggleKeyword = React.useCallback(
    (keyword: string) => {
      const set = new Set(form.getValues("keywords"));
      if (set.has(keyword)) {
        set.delete(keyword);
      } else {
        set.add(keyword);
      }
      const next = Array.from(set);
      form.setValue("keywords", next, { shouldValidate: true });
      if (next.length > 0) {
        form.clearErrors("keywords");
      }
    },
    [form]
  );

  const openKeywordModal = (parent: string) => {
    const children = KEYWORDS_TREE[parent] ?? [];
    const noDetail =
      children.length === 0 || PARENTS_WITHOUT_DETAIL.includes(parent);
    if (noDetail) {
      toggleKeyword(parent);
      return;
    }
    setKeywordModalParent(parent);
  };

  const closeKeywordModal = () => setKeywordModalParent(null);

  const onSubmit = (data: ProfileFormData) => {
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
      grade: gradeNum,
      keywords: sanitizedKeywords,
    };

    if (data.gender && data.gender !== "prefer_not_to_say") {
      payload.gender = data.gender;
    }

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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gender">성별</Label>
                <select
                  id="gender"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  {...form.register("gender")}
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="age">나이</Label>
                <Input
                  id="age"
                  inputMode="numeric"
                  placeholder="예: 23"
                  {...form.register("age", {
                    required: "나이를 입력해주세요",
                    validate: (value) => {
                      const num = Number(value);
                      if (Number.isNaN(num)) return "숫자로 입력해주세요";
                      if (num < 15 || num > 100)
                        return "나이는 15~100 사이여야 합니다";
                      return true;
                    },
                  })}
                />
                {form.formState.errors.age && (
                  <FieldError message={form.formState.errors.age.message} />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="college">단과대학</Label>
                <select
                  id="college"
                  disabled={majorsLoading}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                  {...form.register("college")}
                  onChange={(event) => {
                    form.setValue("college", event.target.value, { shouldValidate: true });
                    form.setValue("major", "", { shouldValidate: true });
                  }}
                >
                  <option value="">{majorsLoading ? "불러오는 중..." : "선택하세요"}</option>
                  {majorsData.map((item) => (
                    <option key={item.college} value={item.college}>
                      {item.college}
                    </option>
                  ))}
                </select>
                {form.formState.errors.college && (
                  <FieldError message={form.formState.errors.college.message} />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="grade">학년</Label>
                <select
                  id="grade"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  {...form.register("grade")}
                >
                  {ALLOWED_GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}학년
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="major">전공</Label>
                <select
                  id="major"
                  disabled={!selectedCollege}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                  {...form.register("major")}
                >
                  <option value="">{selectedCollege ? "전공 선택" : "먼저 단과대를 선택"}</option>
                  {majorsOfSelectedCollege.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
                {form.formState.errors.major && (
                  <FieldError message={form.formState.errors.major.message} />
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <Label htmlFor="income_bracket">소득 분위 (선택)</Label>
                <select
                  id="income_bracket"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  {...form.register("income_bracket")}
                >
                  <option value="">선택 안 함</option>
                  {INCOME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="gpa">학점 (선택)</Label>
                <Input
                  id="gpa"
                  inputMode="decimal"
                  placeholder="예: 3.75"
                  {...form.register("gpa", {
                    validate: (value) => {
                      if (!value) return true;
                      const num = Number(value);
                      if (Number.isNaN(num)) return "숫자로 입력해주세요";
                      if (num < 0 || num > 4.5) return "0.00~4.50 범위여야 합니다";
                      return true;
                    },
                  })}
                />
                {form.formState.errors.gpa && (
                  <FieldError message={form.formState.errors.gpa.message} />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">관심 키워드</Label>
                <span className="text-xs text-gray-500">대분류를 선택해 세부 키워드를 선택하세요</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {TOP_LEVEL_KEYWORDS.map((parent) => {
                  const active = keywords.includes(parent);
                  return (
                    <button
                      type="button"
                      key={parent}
                      onClick={() => openKeywordModal(parent)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {parent}
                    </button>
                  );
                })}
              </div>

              <SelectedKeywordsPreview
                keywords={keywords}
                onRemove={(kw) => toggleKeyword(kw)}
              />

              {form.formState.errors.keywords && (
                <FieldError message={form.formState.errors.keywords.message} />
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">어학 점수 (선택)</Label>
              <div className="space-y-3">
                {TESTS.map(({ key, label }) => {
                  const enabled = languageScores[key]?.enabled ?? false;
                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-2 rounded-md border border-gray-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Controller
                          name={`languageScores.${key}.enabled` as const}
                          control={form.control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              {...{ ...field, value: undefined }}
                              checked={field.value}
                            />
                          )}
                        />
                        <span>{label}</span>
                      </div>

                      <Controller
                        name={`languageScores.${key}.score` as const}
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="점수 입력"
                            className="sm:w-40"
                            disabled={!enabled}
                          />
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

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

      <Modal
        open={!!keywordModalParent}
        title={keywordModalParent ?? ""}
        onClose={closeKeywordModal}
      >
        {keywordModalParent && (
          <KeywordModalContent
            parent={keywordModalParent}
            keywords={keywords}
            onToggleAll={() => {
              const children = KEYWORDS_TREE[keywordModalParent] ?? [];
              const allSelected =
                children.length > 0 &&
                children.every((child) => keywords.includes(child));
              if (allSelected) {
                const filtered = keywords.filter((kw) => !children.includes(kw));
                form.setValue("keywords", filtered, { shouldValidate: true });
              } else {
                const merged = new Set(keywords.concat(children));
                form.setValue("keywords", Array.from(merged), {
                  shouldValidate: true,
                });
              }
            }}
            onToggleOne={(child) => toggleKeyword(child)}
          />
        )}
      </Modal>
    </main>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

function SelectedKeywordsPreview({
  keywords,
  onRemove,
}: {
  keywords: string[];
  onRemove: (keyword: string) => void;
}) {
  if (!keywords || keywords.length === 0) {
    return <p className="text-xs text-gray-500">선택된 키워드가 없습니다.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
        >
          {keyword}
          <button
            type="button"
            onClick={() => onRemove(keyword)}
            className="text-xs text-blue-600 hover:text-blue-800"
            aria-label={`${keyword} 제거`}
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}

function KeywordModalContent({
  parent,
  keywords,
  onToggleAll,
  onToggleOne,
}: {
  parent: string;
  keywords: string[];
  onToggleAll: () => void;
  onToggleOne: (child: string) => void;
}) {
  const children = KEYWORDS_TREE[parent] ?? [];
  const allSelected =
    children.length > 0 && children.every((child) => keywords.includes(child));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{parent} 세부 키워드</h3>
        {children.length > 0 && (
          <button
            type="button"
            onClick={onToggleAll}
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
          >
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
        )}
      </div>

      {children.length === 0 ? (
        <p className="text-xs text-gray-500">세부 키워드가 없습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {children.map((child) => {
            const selected = keywords.includes(child);
            return (
              <button
                key={child}
                type="button"
                onClick={() => onToggleOne(child)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {child}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            닫기
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

