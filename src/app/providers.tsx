"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

// 전역 Provider: React Query 등 클라이언트 전역 컨텍스트를 감싸줌
export default function Providers({ children }: { children: ReactNode }) {
  // QueryClient는 한 번만 생성되어야 해서 useState로 lazy init
  const [client] = useState(() => new QueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
