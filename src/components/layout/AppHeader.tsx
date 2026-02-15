"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

type AppHeaderProps = {
  title?: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
        <Link href="/notices" className="flex items-center gap-2 min-h-[44px] min-w-[44px]">
          <Logo size="sm" showText />
        </Link>
        {title && (
          <h1 className="text-lg font-semibold text-foreground truncate max-w-[50%]">
            {title}
          </h1>
        )}
        {!title && <span aria-hidden className="flex-1" />}
      </div>
    </header>
  );
}
