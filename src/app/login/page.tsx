// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/profile/FieldError";
import { Logo } from "@/components/brand/Logo";

// 환경 변수에서 API 베이스를 읽습니다.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type LoginInputs = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuthStore(); // ✅ 변경
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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        const errorContent = data && (data.detail || data.message || data.error);
        let detail: string;

        if (typeof errorContent === "string") detail = errorContent;
        else if (errorContent) {
          try {
            detail = JSON.stringify(errorContent);
          } catch {
            detail = "로그인에 실패했습니다.";
          }
        } else detail = `로그인 실패 (${res.status})`;

        throw new Error(detail);
      }

      const data = await res.json();
      const accessToken: string | undefined =
        data?.access_token || data?.token || data?.accessToken;

      if (!accessToken) {
        throw new Error("서버에서 access_token을 받지 못했습니다.");
      }

      // ✅ 인증 토큰을 전용 스토어에 저장
      setToken(accessToken);

      // (선택) API 라우트가 읽을 수 있도록 쿠키에도 저장
      const attrs = [
        `path=/`,
        `max-age=86400`,
        `samesite=lax`,
        ...(typeof window !== "undefined" &&
        window.location.protocol === "https:"
          ? ["secure"]
          : []),
      ].join("; ");
      document.cookie = `DICE_TOKEN=${accessToken}; ${attrs}`;

      router.replace("/notices");
    } catch (err: any) {
      console.error("login error:", err);
      setErrorMsg(err?.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted text-foreground p-6">
      <div className="w-full max-w-sm bg-card rounded-xl p-8 shadow-md border border-border">
        <div className="flex justify-center mb-4">
          <Logo size="md" showText />
        </div>
        <h1 className="text-2xl font-semibold mb-2 text-center">로그인</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          이메일과 비밀번호를 입력하여 계속하세요.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="login-email">이메일</Label>
            <Input
              id="login-email"
              type="email"
              required
              placeholder="you@yonsei.ac.kr"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="login-password">비밀번호</Label>
            <Input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </div>

          {errorMsg && (
            <FieldError message={errorMsg} className="text-sm text-destructive whitespace-pre-line" />
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-6">
          아직 계정이 없나요?{" "}
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => router.push("/register")}
          >
            회원가입
          </button>
        </div>
      </div>
    </main>
  );
}
