"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Settings } from "lucide-react";

export default function BottomNav() {
  const path = usePathname();

  const isActive = (p: string) => path.startsWith(p);
  const cls = (active: boolean) =>
    `flex flex-col items-center gap-1 text-xs ${
      active ? "text-blue-600" : "text-gray-500"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-screen-md grid-cols-3 py-2">
        <Link href="/notices" className="flex flex-col items-center">
          <div className={cls(isActive("/notices"))}>
            <Home size={20} />
            홈
          </div>
        </Link>

        <Link href="/calendar" className="flex flex-col items-center">
          <div className={cls(isActive("/calendar"))}>
            <Calendar size={20} />
            캘린더
          </div>
        </Link>

        <Link href="/profile" className="flex flex-col items-center">
          <div className={cls(isActive("/profile"))}>
            <Settings size={20} />
            설정
          </div>
        </Link>
      </div>
    </nav>
  );
}
