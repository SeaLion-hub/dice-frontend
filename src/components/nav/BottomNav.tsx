"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, User } from "lucide-react";

export default function BottomNav() {
  const path = usePathname();

  const isActive = (p: string) => path.startsWith(p);
  const cls = (active: boolean) =>
    `flex flex-col items-center gap-1 text-xs ${
      active ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-screen-md grid-cols-3 py-3">
        <Link href="/notices" className="flex min-h-[44px] flex-col items-center justify-center gap-1" aria-label="홈">
          <div className={cls(isActive("/notices"))}>
            <Home size={20} />
            홈
          </div>
        </Link>

        <Link href="/calendar" className="flex min-h-[44px] flex-col items-center justify-center gap-1" aria-label="캘린더">
          <div className={cls(isActive("/calendar"))}>
            <Calendar size={20} />
            캘린더
          </div>
        </Link>

        <Link href="/profile" className="flex min-h-[44px] flex-col items-center justify-center gap-1" aria-label="프로필">
          <div className={cls(isActive("/profile"))}>
            <User size={20} />
            프로필
          </div>
        </Link>
      </div>
    </nav>
  );
}
