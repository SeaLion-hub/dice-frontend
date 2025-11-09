import { useQuery } from "@tanstack/react-query";

export interface CollegeMajorsItem {
  college: string;
  majors: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function normalizeMajorsResponse(input: any): CollegeMajorsItem[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    if (input.every((item) => typeof item === "object" && item != null && "college" in item && "majors" in item)) {
      return input.map((item) => ({
        college: String(item.college ?? ""),
        majors: Array.isArray(item.majors) ? item.majors.map(String) : [],
      }));
    }

    if (input.every((item) => typeof item === "string")) {
      return [{ college: "전체 단과대", majors: input as string[] }];
    }
  }

  if (typeof input === "object") {
    const entries = Object.entries(input);
    if (entries.every(([_, value]) => Array.isArray(value))) {
      return entries.map(([college, majors]) => ({
        college: String(college),
        majors: (majors as any[]).map(String),
      }));
    }
  }

  return [];
}

async function fetchMajors(): Promise<CollegeMajorsItem[]> {
  const res = await fetch(`${API_BASE}/meta/majors`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch majors metadata");
  }
  const raw = await safeJson(res);
  const data = raw?.items ?? raw;
  return normalizeMajorsResponse(data);
}

export function useMajors() {
  return useQuery({
    queryKey: ["majors"],
    queryFn: fetchMajors,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
