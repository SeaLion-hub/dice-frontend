// src/hooks/useColleges.ts
import { useQuery } from "@tanstack/react-query";

export interface College {
  college_key: string;
  name: string;
  url: string;
  color?: string;
  icon?: string;
}

interface CollegesResponse {
  items: College[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export function useColleges() {
  return useQuery<College[]>({
    queryKey: ["colleges"],
    queryFn: async () => {
      const url = `${API_BASE}/colleges`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch colleges");
      }
      const data: CollegesResponse = await res.json();
      return data.items || [];
    },
    staleTime: 1000 * 60 * 60, // 1시간
  });
}

