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
import FuzzyText from "@/components/FuzzyText";

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
              baseIntensity={0.08}
              hoverIntensity={0.6}
            >
              DICE
            </FuzzyText>
          </div>

          <h1 className="font-extrabold tracking-[-0.04em] text-primary-dark text-balance leading-tight text-5xl md:text-6xl">
            대학 공지, 한 곳에
            <br className="sm:hidden" />
            맞춤으로
          </h1>

          <p className="text-base leading-relaxed text-muted-foreground text-balance max-w-2xl">
            장학금, 인턴십, 공모전. 학과·학년을 반영한 AI 추천과
            마감 알림까지.
          </p>

          <Button
            size="lg"
            className="shadow-lg shadow-primary/30"
            asChild
          >
            <Link href="/login">시작하기</Link>
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
                  마감 임박 푸시 알림과 캘린더 연동.
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
              이런 화면으로 보여요
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              맞춤 추천, 마감 알림, 학과별 공지 통합.
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
              사용자 후기
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              실제 사용자 후기 준비 중입니다.
            </p>
          </div>

          <div className="w-full max-w-md rounded-xl border border-dashed border-border bg-muted/30 px-8 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              베타 테스트 후기와 수집된 피드백을 곧 공유할 예정이에요.
            </p>
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
              대학 공지를 한 곳에. 맞춤 추천과 알림까지.
            </p>
          </div>

          {/* 링크들 */}
          <div className="text-sm text-muted-foreground flex flex-col gap-2">
            <span className="text-muted-foreground/70 cursor-default">
              개인정보처리방침 (준비 중)
            </span>
            <span className="text-muted-foreground/70 cursor-default">
              이용약관 (준비 중)
            </span>
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
