"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { width: 32, height: 20 },
  md: { width: 48, height: 29 },
  lg: { width: 64, height: 38 },
} as const;

type LogoProps = {
  size?: keyof typeof sizeMap;
  showText?: boolean;
  className?: string;
};

export function Logo({ size = "sm", showText = false, className }: LogoProps) {
  const { width, height } = sizeMap[size];
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-hidden={!showText}
    >
      <Image
        src="/logo.png"
        alt="DICE"
        width={width}
        height={height}
        className="shrink-0"
        sizes="(max-width: 768px) 32px, 48px"
        priority
      />
      {showText && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          DICE
        </span>
      )}
    </span>
  );
}
