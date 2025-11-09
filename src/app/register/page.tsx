"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, FormProvider } from "react-hook-form";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

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

const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "prefer_not_to_say", label: "응답하지 않음" },
] as const;

const ALLOWED_GRADES = ["1", "2", "3", "4", "5", "6"] as const;

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

/* =========================================
 * 4단계 키워드: 대분류(‘#기타’ 제거) → 소분류
 * ========================================= */
const KEYWORDS_TREE: Record<string, string[]> = {
  "#학사": [
    "#소속변경", "#ABEEK", "#신입생", "#S/U", "#교직과정",
    "#휴학", "#복학", "#수강신청", "#졸업", "#등록금",
    "#교과목", "#전공과목", "#다전공", "#기타",
  ],
  "#장학": [
    "#가계곤란", "#국가장학", "#근로장학", "#성적우수",
    "#생활비", "#기타",
  ],
  "#취업": [
    "#채용", "#인턴십", "#현장실습", "#강사", "#조교",
    "#채용설명회", "#취업특강", "#창업", "#기타",
  ],
  "#행사": [
    "#특강", "#워크숍", "#세미나", "#설명회", "#포럼",
    "#지원", "#교육", "#프로그램", "#기타",
  ],
  "#공모전/대회": [
    "#공모전", "#경진대회", "#디자인", "#숏폼", "#영상",
    "#아이디어", "#논문", "#학생설계전공", "#마이크로전공", "#기타",
  ],
  "#국제교류": [
    "#교환학생", "#파견", "#campusasia", "#글로벌",
    "#단기", "#하계", "#동계", "#어학연수", "#해외봉사",
    "#일본", "#미국", "#기타",
  ],
  "#일반": [],
};

// 세부 없이 바로 토글로 선택할 대분류(모달 열지 않음)
const PARENTS_WITHOUT_DETAIL = ["#일반"];

const TOP_LEVEL_KEYWORDS = Object.keys(KEYWORDS_TREE);
const ALL_ALLOWED_KEYWORDS = TOP_LEVEL_KEYWORDS.reduce<string[]>(
  (acc, p) => acc.concat(p, KEYWORDS_TREE[p]),
  []
);

/** 어학 시험 옵션 */
const TESTS = [
  { key: "toeic", label: "영어 · TOEIC" },
  { key: "toefl", label: "영어 · TOEFL" },
  { key: "ielts", label: "영어 · IELTS" },
  { key: "jlpt", label: "일본어 · JLPT" },
  { key: "hsk", label: "중국어 · HSK" },
] as const;
type TestKey = (typeof TESTS)[number]["key"];

type LanguageScores = Record<
  TestKey,
  { enabled: boolean; score: string }
>;

type ProfileInputs = {
  // 기본 정보(필수)
  gender: typeof GENDER_OPTIONS[number]["value"];
  age: string;
  grade: (typeof ALLOWED_GRADES)[number];
  college: string;
  major: string;

  // 상세 정보(선택)
  military_service: typeof MILITARY_OPTIONS[number]["value"];
  income_bracket: string;
  gpa: string;
  languageScores: LanguageScores;

  // 키워드(필수)
  keywords: string[];
};

type CollegeMajorsItem = { college: string; majors: string[] };

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

/** /meta/majors 응답 유연 파서 */
function normalizeMajorsResponse(input: any): CollegeMajorsItem[] {
  if (!input) return [];
  if (Array.isArray(input) && input.every((x) => typeof x?.college === "string" && Array.isArray(x?.majors))) {
    return input as CollegeMajorsItem[];
  }
  if (!Array.isArray(input) && typeof input === "object") {
    const entries = Object.entries(input);
    if (entries.every(([_, v]) => Array.isArray(v))) {
      return entries.map(([college, majors]) => ({
        college,
        majors: (majors as any[]).map(String),
      }));
    }
  }
  if (Array.isArray(input) && input.every((x) => typeof x === "string")) {
    return [{ college: "전체 단과대", majors: input as string[] }];
  }
  return [];
}

/* =========================================
 * 데이터 로딩(TanStack Query)
 * ========================================= */
async function fetchMajors(): Promise<CollegeMajorsItem[]> {
  const res = await fetch(`${API_BASE}/meta/majors`, { cache: "no-store" });
  const raw = await safeJson(res);
  return normalizeMajorsResponse(raw?.items ?? raw);
}

function useMajors() {
  return useQuery({
    queryKey: ["majors"],
    queryFn: fetchMajors,
    staleTime: 1000 * 60 * 60 * 24, // 24h 캐시
  });
}

/* =========================================
 * 모달 컴포넌트 (키워드 상세 선택)
 * ========================================= */
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
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

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
  const profileForm = useForm<ProfileInputs>({
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
      languageScores: {
        toeic: { enabled: false, score: "" },
        toefl: { enabled: false, score: "" },
        ielts: { enabled: false, score: "" },
        jlpt: { enabled: false, score: "" },
        hsk: { enabled: false, score: "" },
      },
    },
    mode: "onTouched",
  });

  // 단과대/전공
  const { data: majorsData = [], isLoading: majorsLoading } = useMajors();
  const colleges = useMemo(() => majorsData.map((i) => i.college), [majorsData]);
  const selectedCollege = profileForm.watch("college");
  const majorsOfSelectedCollege = useMemo(() => {
    const found = majorsData.find((i) => i.college === selectedCollege);
    return found?.majors ?? [];
  }, [majorsData, selectedCollege]);

  // 키워드 모달 상태
  const [keywordModalParent, setKeywordModalParent] = useState<string | null>(null);
  const openKeywordModal = (parent: string) => {
    const children = KEYWORDS_TREE[parent] ?? [];
    const noDetail =
      children.length === 0 || PARENTS_WITHOUT_DETAIL.includes(parent);

    if (noDetail) {
      const set = new Set(profileForm.getValues("keywords"));
      set.has(parent) ? set.delete(parent) : set.add(parent);
      profileForm.setValue("keywords", Array.from(set), { shouldValidate: true });
      return; // 모달 열지 않음
    }
    setKeywordModalParent(parent);
  };
  const closeKeywordModal = () => setKeywordModalParent(null);

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
        console.error("Profile update failed:", respJson || respText);
        let detailMsg = "프로필 저장에 실패했습니다.";
        const d = respJson;
        if (d?.detail) {
          if (typeof d.detail === "string") detailMsg = d.detail;
          else if (Array.isArray(d.detail)) {
            const firstError = d.detail[0];
            const fieldName =
              firstError?.loc?.[firstError.loc.length - 1] ?? "필드";
            const reason = firstError?.msg ?? "유효하지 않은 값";
            detailMsg = `입력 오류 (${fieldName}): ${reason}`;
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

  // 단계별 프론트 유효성
  const validateStep2 = async () => {
    const { gender, age, grade, college, major } = profileForm.getValues();
    let valid = true;
    if (!gender) {
      profileForm.setError("gender", { type: "validate", message: "성별을 선택해주세요." });
      valid = false;
    }
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 15 || ageNum > 100) {
      profileForm.setError("age", {
        type: "validate",
        message: "나이는 15~100 사이의 숫자로 입력해주세요.",
      });
      valid = false;
    }
    if (!grade || Number.isNaN(Number(grade)) || Number(grade) < 1 || Number(grade) > 6) {
      profileForm.setError("grade", {
        type: "validate",
        message: "학년은 1~6 사이에서 선택해주세요.",
      });
      valid = false;
    }
    if (!college) {
      profileForm.setError("college", { type: "validate", message: "단과대를 선택해주세요." });
      valid = false;
    }
    if (!major) {
      profileForm.setError("major", { type: "validate", message: "전공을 선택해주세요." });
      valid = false;
    }
    return valid;
  };

  const validateStep3 = async () => {
    const { gpa, income_bracket } = profileForm.getValues();
    let valid = true;
    if (gpa) {
      const gpaNum = Number(gpa);
      if (Number.isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.5) {
        profileForm.setError("gpa", {
          type: "validate",
          message: "GPA는 0.00~4.50 사이의 값이어야 합니다.",
        });
        valid = false;
      }
    }
    if (income_bracket !== "") {
      const inc = Number(income_bracket);
      if (Number.isNaN(inc) || inc < 0 || inc > 10) {
        profileForm.setError("income_bracket", {
          type: "validate",
          message: "소득 분위는 0~10 사이에서 선택해주세요.",
        });
        valid = false;
      }
    }
    return valid;
  };

  const validateStep4 = async () => {
    const { keywords } = profileForm.getValues();
    if (!keywords || keywords.length < 1) {
      profileForm.setError("keywords", {
        type: "validate",
        message: "관심 키워드를 최소 1개 이상 선택해주세요.",
      });
      return false;
    }
    return true;
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
                <label className="block text-sm text-gray-700 font-medium mb-1">이메일</label>
                <input
                  type="email"
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="you@yonsei.ac.kr"
                  {...accountForm.register("email", { required: "이메일을 입력해주세요." })}
                />
                <FieldError message={accountForm.formState.errors.email?.message} />
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">비밀번호</label>
                <input
                  type="password"
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
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
                <label className="block text-sm text-gray-700 font-medium mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="다시 입력"
                  {...accountForm.register("passwordConfirm", {
                    required: "비밀번호를 다시 입력해주세요.",
                    minLength: { value: 8, message: "8자 이상 입력해주세요." },
                  })}
                />
                <FieldError message={accountForm.formState.errors.passwordConfirm?.message} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {loading ? "처리 중..." : "다음으로"}
              </button>
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
            <FormProvider {...profileForm}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  profileForm.clearErrors();
                  if (await validateStep2()) setStep(3);
                }}
                className="space-y-4"
              >
                {/* 성별 */}
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">성별 (필수)</label>
                  <select
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    {...profileForm.register("gender", { required: "성별을 선택해주세요." })}
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <FieldError message={profileForm.formState.errors.gender?.message} />
                </div>

                {/* 나이 */}
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">나이 (필수)</label>
                  <input
                    type="number"
                    min={15}
                    max={100}
                    inputMode="numeric"
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="예: 23"
                    {...profileForm.register("age", { required: "나이를 입력해주세요." })}
                  />
                  <FieldError message={profileForm.formState.errors.age?.message} />
                </div>

                {/* 학년 */}
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">학년 (필수)</label>
                  <select
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    {...profileForm.register("grade", { required: "학년을 선택해주세요." })}
                  >
                    {ALLOWED_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}학년
                      </option>
                    ))}
                  </select>
                  <FieldError message={profileForm.formState.errors.grade?.message} />
                </div>

                {/* 단과대 */}
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">단과대학 (필수)</label>
                  <select
                    disabled={majorsLoading}
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-100"
                    {...profileForm.register("college", { required: "단과대를 선택해주세요." })}
                    onChange={(e) => {
                      profileForm.setValue("college", e.target.value);
                      profileForm.setValue("major", "");
                    }}
                  >
                    <option value="">
                      {majorsLoading ? "불러오는 중..." : "선택하세요"}
                    </option>
                    {colleges.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <FieldError message={profileForm.formState.errors.college?.message} />
                </div>

                {/* 전공 */}
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">전공 (필수)</label>
                  <select
                    disabled={!selectedCollege}
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-100"
                    {...profileForm.register("major", { required: "전공을 선택해주세요." })}
                  >
                    <option value="">
                      {selectedCollege ? "전공 선택" : "먼저 단과대를 선택"}
                    </option>
                    {majorsOfSelectedCollege.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <FieldError message={profileForm.formState.errors.major?.message} />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    이전
                  </button>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    다음
                  </button>
                </div>
              </form>
            </FormProvider>
          </>
        )}

        {/* ---------- 3단계: 상세 정보(선택) ---------- */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center">3단계: 상세 정보</h1>
            <FormProvider {...profileForm}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  profileForm.clearErrors();
                  if (await validateStep3()) setStep(4);
                }}
                className="space-y-4"
              >
                {/* GPA */}
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">학점(GPA) (선택)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="예: 3.75"
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    {...profileForm.register("gpa")}
                  />
                  <FieldError message={profileForm.formState.errors.gpa?.message} />
                </div>

                {/* 병역 / 소득 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 font-medium mb-1">병역 (선택)</label>
                    <select
                      className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      {...profileForm.register("military_service")}
                    >
                      {MILITARY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 font-medium mb-1">소득 분위 (선택)</label>
                    <select
                      className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      {...profileForm.register("income_bracket")}
                    >
                      <option value="">선택 안 함</option>
                      {INCOME_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={profileForm.formState.errors.income_bracket?.message} />
                  </div>
                </div>

                {/* 어학 점수 */}
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-2">어학 점수 (선택)</label>
                  <div className="space-y-2">
                    {TESTS.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-3">
                        <Controller
                          name={`languageScores.${key}.enabled` as const}
                          control={profileForm.control}
                          render={({ field }) => (
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                checked={field.value}
                                ref={field.ref}
                              />
                              <span className="text-sm text-gray-800">{label}</span>
                            </label>
                          )}
                        />
                        <Controller
                          name={`languageScores.${key}.score` as const}
                          control={profileForm.control}
                          render={({ field }) => (
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="점수 입력"
                              className="flex-1 rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-100"
                              disabled={
                                !profileForm.watch(`languageScores.${key}.enabled` as const)
                              }
                              {...field}
                            />
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    이전
                  </button>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    다음
                  </button>
                </div>
              </form>
            </FormProvider>
          </>
        )}

        {/* ---------- 4단계: 키워드(필수) ---------- */}
        {step === 4 && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center">4단계: 키워드 설정</h1>
            <FormProvider {...profileForm}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  profileForm.clearErrors();
                  if (await validateStep4()) await submitProfileToServer();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-2">
                    관심 키워드 (필수 · 최소 1개)
                  </label>

                  {/* 대분류 버튼들 */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {TOP_LEVEL_KEYWORDS.map((parent) => (
                      <button
                        type="button"
                        key={parent}
                        onClick={() => openKeywordModal(parent)}
                        className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {parent}
                      </button>
                    ))}
                  </div>

                  {/* 선택된 키워드 미리보기 */}
                  <SelectedKeywordsPreview
                    keywords={profileForm.watch("keywords")}
                    onRemove={(kw) => {
                      const current = profileForm.getValues("keywords");
                      profileForm.setValue(
                        "keywords",
                        current.filter((k) => k !== kw),
                        { shouldValidate: true }
                      );
                    }}
                  />

                  <FieldError message={profileForm.formState.errors.keywords?.message} />
                </div>

                {/* 버튼: 이전 / 완료 */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    이전
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    {loading ? "저장 중..." : "완료하고 시작하기"}
                  </button>
                </div>
              </form>
            </FormProvider>

            {/* 세부 키워드 모달 */}
            <Modal
              open={!!keywordModalParent}
              title={`${keywordModalParent ?? ""} 세부 키워드 선택`}
              onClose={closeKeywordModal}
            >
              {keywordModalParent && (
                <KeywordModalContent
                  parent={keywordModalParent}
                  keywords={profileForm.watch("keywords")}
                  onToggleAll={() => {
                    const children = KEYWORDS_TREE[keywordModalParent] ?? [];
                    const allSelected =
                      children.length > 0 &&
                      children.every((c) =>
                        profileForm.getValues("keywords").includes(c)
                      );
                    if (allSelected) {
                      profileForm.setValue(
                        "keywords",
                        profileForm
                          .getValues("keywords")
                          .filter((k) => !children.includes(k)),
                        { shouldValidate: true }
                      );
                    } else {
                      const set = new Set(profileForm.getValues("keywords"));
                      children.forEach((c) => set.add(c));
                      profileForm.setValue("keywords", Array.from(set), {
                        shouldValidate: true,
                      });
                    }
                  }}
                  onToggleOne={(child) => {
                    if (!ALL_ALLOWED_KEYWORDS.includes(child)) return;
                    const set = new Set(profileForm.getValues("keywords"));
                    set.has(child) ? set.delete(child) : set.add(child);
                    profileForm.setValue("keywords", Array.from(set), {
                      shouldValidate: true,
                    });
                  }}
                />
              )}
            </Modal>
          </>
        )}
      </div>
    </main>
  );
}

/* =========================================
 * 하위 UI 컴포넌트
 * ========================================= */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function SelectedKeywordsPreview({
  keywords,
  onRemove,
}: {
  keywords: string[];
  onRemove: (kw: string) => void;
}) {
  if (!keywords || keywords.length === 0) {
    return <p className="text-xs text-gray-500">선택된 키워드가 없습니다.</p>;
    }
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((k) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
        >
          {k}
          <button
            type="button"
            onClick={() => onRemove(k)}
            className="text-xs text-blue-600 hover:text-blue-800"
            aria-label={`${k} 제거`}
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
    children.length > 0 && children.every((c) => keywords.includes(c));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-800">{parent} · 세부 키워드</div>
        {children.length > 0 && (
          <button
            type="button"
            onClick={onToggleAll}
            className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-100"
          >
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
        )}
      </div>

      {children.length === 0 ? (
        <div className="text-xs text-gray-500">세부 키워드가 없습니다.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {children.map((child) => {
            const selected = keywords.includes(child);
            return (
              <button
                type="button"
                key={child}
                onClick={() => onToggleOne(child)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
                aria-pressed={selected}
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
