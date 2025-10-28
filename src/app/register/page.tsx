"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// ------------------------------------------------------
// 선택 키워드/학년 옵션
// ------------------------------------------------------
const ALLOWED_KEYWORDS = [
  "학사",
  "장학",
  "행사",
  "취업",
  "국제교류",
  "공모전/대회",
  "일반",
];

const ALLOWED_GRADES = ["1", "2", "3", "4", "5", "6"];

type RegisterInputs = {
  email: string;
  password: string;
  passwordConfirm: string;
};

type ProfileInputs = {
  grade: string;   // UI에선 string으로 관리
  major: string;
  gpa: string;     // "3.75" 등 숫자만 입력
  toeic: string;   // "850" 등 숫자만 입력
  keywords: string[];
};

export default function RegisterPage() {
  const router = useRouter();

  // 1단계: 계정 생성
  const [account, setAccount] = useState<RegisterInputs>({
    email: "",
    password: "",
    passwordConfirm: "",
  });

  // 2단계: 프로필
  const [profile, setProfile] = useState<ProfileInputs>({
    grade: "",
    major: "",
    gpa: "",
    toeic: "",
    keywords: [],
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 안전 JSON 파서
  const safeJson = async (res: Response) => {
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  // 1단계 제출: 계정 생성
  const handleRegisterAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (account.password !== account.passwordConfirm) {
      setLoading(false);
      setErrorMsg("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
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
      console.error("register error:", err);
      setErrorMsg(err.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2단계 제출: 프로필 저장 + 토큰 발급 후 이동
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1) 로그인하여 토큰 획득
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
      });

      if (!loginRes.ok) {
        const data = await safeJson(loginRes);
        throw new Error(
          (data && (data.detail || data.message)) ??
            "로그인 토큰 발급에 실패했습니다."
        );
      }

      const loginData = await loginRes.json();
      const token = loginData.access_token;
      if (!token) throw new Error("서버가 access_token을 보내지 않았습니다.");

      // 2) 프로필 업서트
      // 숫자/nullable 정리: grade, gpa, toeic
      const payload = {
        grade: profile.grade ? parseInt(profile.grade, 10) : null,
        major: profile.major || null,
        // GPA는 숫자(예: "3.75")만 받도록 간소화
        gpa: profile.gpa ? parseFloat(profile.gpa) : null,
        toeic: profile.toeic
          ? parseInt(profile.toeic.replace(/[^0-9]/g, ""), 10)
          : null,
        keywords: profile.keywords,
      };

      const profileRes = await fetch(`${API_BASE}/auth/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!profileRes.ok) {
        const data = await safeJson(profileRes);
        let detailMsg = "프로필 저장에 실패했습니다.";

        if (data && data.detail) {
          if (typeof data.detail === "string") {
            detailMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            const firstError = data.detail[0];
            const fieldName = firstError?.loc?.[1] ?? "필드";
            const reason = firstError?.msg ?? "유효하지 않은 값";
            detailMsg = `입력 오류 (${fieldName}): ${reason}`;
          }
        }
        throw new Error(detailMsg);
      }

      // 3) 토큰 저장 후 이동
      localStorage.setItem("DICE_TOKEN", token);
      router.replace("/notices");
    } catch (err: any) {
      console.error("profile save error:", err);
      setErrorMsg(err.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 키워드 토글
  const handleToggleKeyword = (keyword: string) => {
    setProfile((prev) => {
      const exists = prev.keywords.includes(keyword);
      return {
        ...prev,
        keywords: exists
          ? prev.keywords.filter((k) => k !== keyword)
          : [...prev.keywords, keyword],
      };
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-6">
      <div className="w-full max-w-sm bg-white rounded-xl p-8 shadow-lg border border-gray-200">
        {/* 상단 브랜딩 + 단계 표시 */}
        <div className="mb-4 text-center">
          <div className="text-sm font-semibold tracking-wide text-blue-600">
            DICE
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {step === 1 ? "1단계 (총 2단계)" : "2단계 (총 2단계)"}
          </div>
        </div>

        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center">회원가입</h1>
            <p className="text-sm text-gray-500 mb-6 text-center">
              학교 공지를 더 똑똑하게 받으려면 계정을 만들어주세요.
            </p>

            <form onSubmit={handleRegisterAccount} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="you@yonsei.ac.kr"
                  value={account.email}
                  onChange={(e) =>
                    setAccount((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="8자 이상"
                  value={account.password}
                  onChange={(e) =>
                    setAccount((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="다시 입력"
                  value={account.passwordConfirm}
                  onChange={(e) =>
                    setAccount((prev) => ({
                      ...prev,
                      passwordConfirm: e.target.value,
                    }))
                  }
                />
              </div>

              {errorMsg && (
                <div className="text-sm text-red-600 whitespace-pre-line">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {loading ? "처리 중..." : "다음으로"}
              </button>
            </form>

            {/* 로그인 링크 */}
            <p className="text-center text-sm text-gray-500 mt-4">
              이미 계정이 있으신가요?{" "}
              <a href="/login" className="font-medium text-blue-600 hover:underline">
                로그인하기
              </a>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center">
              프로필 정보 입력
            </h1>
            <p className="text-sm text-gray-500 mb-6 text-center">
              관심있는 공지를 우선적으로 보여줄 수 있게 기본 정보를 알려주세요.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* 학년 */}
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">
                  학년 (선택)
                </label>
                <select
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  value={profile.grade}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, grade: e.target.value }))
                  }
                >
                  <option value="">선택 안 함</option>
                  {ALLOWED_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}학년
                    </option>
                  ))}
                </select>
              </div>

              {/* 전공 */}
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">
                  전공 / 소속 단과대 (선택)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="예: 컴퓨터공학 (자유 입력)"
                  value={profile.major}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, major: e.target.value }))
                  }
                />
              </div>

              {/* GPA / TOEIC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">
                    학점(GPA) (선택)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="예: 3.75"
                    value={profile.gpa}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, gpa: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">
                    토익 (선택)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="예: 850"
                    value={profile.toeic}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, toeic: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* 키워드 */}
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-2">
                  관심 키워드 (선택)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALLOWED_KEYWORDS.map((keyword) => {
                    const isSelected = profile.keywords.includes(keyword);
                    return (
                      <button
                        type="button"
                        key={keyword}
                        onClick={() => handleToggleKeyword(keyword)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {keyword}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div className="text-sm text-red-600 whitespace-pre-line">
                  {errorMsg}
                </div>
              )}

              {/* 버튼: 이전 / 완료 */}
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
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  {loading ? "저장 중..." : "완료하고 시작하기"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
