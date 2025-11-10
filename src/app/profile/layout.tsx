import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BottomNav from "@/components/nav/BottomNav";

const LOGIN_REDIRECT_PARAM = "next";
const LOGIN_PATH = "/login";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const tokenCookie = cookies().get("DICE_TOKEN");

  if (!tokenCookie || !tokenCookie.value) {
    const searchParams = new URLSearchParams({ [LOGIN_REDIRECT_PARAM]: "/profile" });
    redirect(`${LOGIN_PATH}?${searchParams.toString()}`);
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

