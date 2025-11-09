"use client";

import type { ReactNode } from "react";
import BottomNav from "@/components/nav/BottomNav";

export default function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

