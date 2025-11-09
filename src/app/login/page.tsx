// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNoticePreferences } from "@/hooks/useNoticePreferences";

// 환경 변수에서 API 베이스를 읽습니다.
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type LoginInputs = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useNoticePreferences();
  const [form, setForm] = useState<LoginInputs>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const safeJson = async (res: Response) => {
    try {
      const t = await res.text();
      return JSON.parse(t);
    } catch {
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // JSON 형식으로 로그인 요청
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await safeJson(res);

        // 사람이 읽을 수 있는 에러 메시지 구성
        const errorContent = data && (data.detail || data.message || data.error);
        let detail: string;

        if (typeof errorContent === "string") {
          detail = errorContent;
        } else if (errorContent) {
          try {
            detail = JSON.stringify(errorContent);
          } catch {
            detail = "로그인에 실패했습니다.";
          }
        } else {
          detail = `로그인 실패 (${res.status})`;
        }

        throw new Error(detail);
      }

      const data = await res.json();
      const accessToken: string | undefined =
        data?.access_token || data?.token || data?.accessToken;

      if (!accessToken) {
        throw new Error("서버에서 access_token을 받지 못했습니다.");
      }

      // 1) LocalStorage 저장 (기존 로직)
      setToken(accessToken);

      // 2) [추가] API 라우트가 읽을 수 있도록 쿠키 설정
      //    - 이름: DICE_TOKEN
      //    - 유효기간: 1일 (86400초)
      //    - 전체 경로 적용
      //    - SameSite=Lax (기본 보안)
      //    - HTTPS 환경이면 Secure 플래그도 부여
      const attrs = [
        `path=/`,
        `max-age=86400`,
        `samesite=lax`,
        ...(typeof window !== "undefined" && window.location.protocol === "https:"
          ? ["secure"]
          : []),
      ].join("; ");
      document.cookie = `DICE_TOKEN=${accessToken}; ${attrs}`;

      // 로그인 후 이동
      router.replace("/notices");
    } catch (err: any) {
      console.error("login error:", err);
      setErrorMsg(err?.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-6">
      <div className="w-full max-w-sm bg-white rounded-xl p-8 shadow-md border border-gray-200">
        <h1 className="text-2xl font-semibold mb-2 text-center">DICE 로그인</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          이메일과 비밀번호를 입력하여 계속하세요.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">
              이메일
            </label>
            <input
              type="email"
              required
              className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              placeholder="you@yonsei.ac.kr"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
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
              className="w-full rounded-lg bg-white px-3 py-2 text-sm border border-gray-300 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
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
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 mt-6">
          아직 계정이 없나요?{" "}
          <button
            type="button"
            className="text-blue-600 hover:underline font-medium"
            onClick={() => router.push("/register")}
          >
            회원가입
          </button>
        </div>
      </div>
    </main>
  );
}
