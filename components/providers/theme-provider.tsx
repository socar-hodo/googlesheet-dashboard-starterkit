"use client";

// next-themes를 래핑한 클라이언트 컴포넌트
// 다크모드/라이트모드 전환을 위한 프로바이더입니다
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
