export const LS_KEYS = {
  NOTICE_PREFS: "notice_prefs",
  NOTICES_VIEW_MODE: "dice_notices_view_mode",
  RECENT_SEARCHES: "dice_recent_searches",
} as const;

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
