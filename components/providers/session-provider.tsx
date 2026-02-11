"use client";

// NextAuth SessionProvider를 래핑한 클라이언트 컴포넌트
// 클라이언트 컴포넌트에서 useSession 훅을 사용하기 위해 필요합니다
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
