"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Bot, Search } from "lucide-react";
import FuzzyText from "@/components/FuzzyText"; // ← 실제 위치에 맞춰주세요

// ✅ 애니메이션 Variants를 이 파일 안에서 직접 정의
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ====================== NAVBAR ====================== */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">DICE</span>
          </Link>

          <Button asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </header>

      {/* ====================== HERO ====================== */}
      <section className="w-full flex flex-col items-center text-center py-16 px-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
          {/* 브랜드(보조 비주얼) */}
          <div className="text-primary-dark">
            <FuzzyText
              fontSize="clamp(2rem, 8vw, 6rem)"
              baseIntensity={0.16}
              hoverIntensity={1.0}
            >
              DICE
            </FuzzyText>
          </div>

          {/* 핵심 가치 제안 */}
          <h1 className="font-extrabold tracking-[-0.04em] text-primary-dark text-balance leading-tight text-5xl md:text-6xl">
            놓치지 마세요, 
            <br className="sm:hidden" />
            중요한 기회를
          </h1>

          {/* 설명 */}
          <p className="text-base leading-relaxed text-muted-foreground text-balance max-w-2xl">
            대학의 모든 공지사항을 한 곳에서 확인하고, AI가 맞춤형으로
            추천해드립니다. 장학금, 인턴십, 공모전 등 중요한 기회를 절대
            놓치지 마세요.
          </p>

          {/* CTA */}
          <Button
            size="lg"
            className="shadow-lg shadow-primary/30"
            asChild
          >
            <Link href="/login">지금 기회 확인하기</Link>
          </Button>
        </div>
      </section>

      {/* ====================== FEATURES ====================== */}
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="w-full pb-16 px-4"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="sr-only">DICE의 주요 기능</h2>
          <div className="grid w-full gap-4 md:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-primary-dark">
                  AI 맞춤 추천
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  학과, 학년, 관심 분야를 반영해서 나에게 맞는 공지와 기회를
                  자동으로 골라줍니다.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Search className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-primary-dark">
                  자동 수집
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  여러 사이트에 흩어진 공지사항을 자동으로 크롤링하고 한 화면에
                  모아서 보여줍니다.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold text-primary-dark">
                  마감일 알림
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  중요한 마감일을 놓치지 않도록 푸시 알림과 개인 캘린더 연동까지
                  지원합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* ====================== PRODUCT PREVIEW ====================== */}
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="w-full pb-20 px-4"
      >
        <div className="mx-auto max-w-6xl flex flex-col items-center text-center gap-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-primary-dark">
              실제로 이렇게 보여요 👀
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              맞춤 추천, 마감 임박 알림, 학과별 공지 통합까지.
              DICE가 당신 대신 모아드립니다.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 w-full">
            {/* 모바일 스타일 카드 */}
            <div className="mx-auto w-full max-w-[22rem] rounded-xl border border-border bg-background shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  맞춤 추천
                </span>
                <span>오늘</span>
              </div>

              <div className="p-4 text-left space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="text-xs font-semibold text-primary-dark mb-1">
                    장학금 · 마감 2일 전
                  </div>
                  <div className="text-sm font-semibold text-foreground leading-snug">
                    공과대 재학생 대상 학업우수 장학금 신청 안내
                  </div>
                  <div className="text-[0.8rem] text-muted-foreground leading-relaxed mt-1">
                    직전 학기 평균 3.7 이상 재학생 지원 가능
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="text-xs font-semibold text-primary mb-1">
                    인턴십
                  </div>
                  <div className="text-sm font-semibold text-foreground leading-snug">
                    데이터 엔지니어 인턴 (AI Lab)
                  </div>
                  <div className="text-[0.8rem] text-muted-foreground leading-relaxed mt-1">
                    전공: 컴퓨터/소프트웨어, 학년: 3학년 이상
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="text-xs font-semibold text-primary mb-1">
                    공모전
                  </div>
                  <div className="text-sm font-semibold text-foreground leading-snug">
                    캠퍼스 혁신 아이디어 챌린지
                  </div>
                  <div className="text-[0.8rem] text-muted-foreground leading-relaxed mt-1">
                    대상 상금 200만 원 • 팀 지원 가능
                  </div>
                </div>
              </div>
            </div>

            {/* 데스크탑 스타일 카드 */}
            <div className="mx-auto w-full max-w-[32rem] rounded-xl border border-border bg-background shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-muted/30 text-[0.7rem] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="truncate text-foreground/80">
                  dice.app/unified-board
                </span>
                <span className="opacity-0">•</span>
              </div>

              <div className="p-4 text-left text-sm leading-relaxed">
                <div className="flex items-start justify-between border-b border-border/60 pb-3 mb-3">
                  <div>
                    <div className="text-[0.7rem] font-medium text-primary-dark">
                      공지 · 컴퓨터공학과
                    </div>
                    <div className="font-semibold text-foreground">
                      2025년 1학기 복수전공 신청 안내
                    </div>
                    <div className="text-[0.75rem] text-muted-foreground">
                      신청 기간: 12.10 ~ 12.17, 온라인 제출
                    </div>
                  </div>
                  <span className="text-[0.7rem] text-muted-foreground whitespace-nowrap">
                    방금
                  </span>
                </div>

                <div className="flex items-start justify-between border-b border-border/60 pb-3 mb-3">
                  <div>
                    <div className="text-[0.7rem] font-medium text-primary-dark">
                      취업지원센터
                    </div>
                    <div className="font-semibold text-foreground">
                      겨울방학 실무형 부트캠프 모집
                    </div>
                    <div className="text-[0.75rem] text-muted-foreground">
                      선착순 30명 · 수료증 발급
                    </div>
                  </div>
                  <span className="text-[0.7rem] text-muted-foreground whitespace-nowrap">
                    1시간 전
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[0.7rem] font-medium text-primary-dark">
                      장학팀
                    </div>
                    <div className="font-semibold text-foreground">
                      저소득층 학업 장려 장학금
                    </div>
                    <div className="text-[0.75rem] text-muted-foreground">
                      제출 서류: 성적 증명서, 소득 증빙
                    </div>
                  </div>
                  <span className="text-[0.7rem] text-muted-foreground whitespace-nowrap">
                    어제
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ====================== SOCIAL PROOF ====================== */
      /* tip: bg + border-top 유지 */}
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="w-full pb-24 px-4 bg-background/60 backdrop-blur-md border-t border-border/40"
      >
        <div className="mx-auto max-w-6xl flex flex-col items-center text-center gap-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-primary-dark">
              학생들이 이미 쓰고 있어요 💬
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              "나만 손해보는 거 아냐?"라는 불안을 줄여주고
              실제 가치를 증명해주는 구간입니다.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 w-full">
            <Card className="bg-background/80 border-primary/20 shadow-lg">
              <CardContent className="p-6 text-left space-y-3">
                <p className="text-[0.9rem] leading-relaxed text-foreground font-medium">
                  "DICE 덕분에 놓칠 뻔했던 장학금 신청했어요. 진짜로 등록금
                  줄었습니다."
                </p>
                <p className="text-[0.8rem] text-muted-foreground">
                  전자공학부 23학번 · 김○○
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/80 border-primary/20 shadow-lg">
              <CardContent className="p-6 text-left space-y-3">
                <p className="text-[0.9rem] leading-relaxed text-foreground font-medium">
                  "공지 보려고 학교 사이트 5군데 돌아다닐 필요가 없어요.
                  딱 중요한 것만 한 번에."
                </p>
                <p className="text-[0.8rem] text-muted-foreground">
                  컴퓨터과학과 21학번 · 이○○
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* ====================== FOOTER ====================== */}
      <footer className="border-t border-border/40 bg-background/80 text-foreground px-4 py-10">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
          {/* 브랜드 / 미션 */}
          <div className="space-y-2">
            <div className="text-lg font-semibold text-primary-dark">
              DICE
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              대학생이 절대 놓치면 안 되는 기회들을 한 곳에 모으는
              공지 어그리게이터 &amp; 알림 비서.
            </p>
          </div>

          {/* 링크들 */}
          <div className="text-sm text-muted-foreground flex flex-col gap-2">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              이용약관
            </Link>
            <a
              href="mailto:hello@dice.app"
              className="hover:text-foreground transition-colors"
            >
              문의: hello@dice.app
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground md:text-right">
            <div>© 2025 DICE</div>
            <div className="text-[0.7rem]">All rights reserved.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
