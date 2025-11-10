import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BottomNav from "@/components/nav/BottomNav";

const LOGIN_REDIRECT_PARAM = "next";
const LOGIN_PATH = "/login";
const PROFILE_PATH = "/profile";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const tokenCookie =
    typeof cookieStore?.get === "function" ? cookieStore.get("DICE_TOKEN") : undefined;

  if (!tokenCookie || !tokenCookie.value) {
    const searchParams = new URLSearchParams({ [LOGIN_REDIRECT_PARAM]: PROFILE_PATH });
    redirect(`${LOGIN_PATH}?${searchParams.toString()}`);
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

