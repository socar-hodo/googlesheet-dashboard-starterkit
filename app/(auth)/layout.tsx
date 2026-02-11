import type { ReactNode } from "react";

// 인증 페이지용 센터 정렬 레이아웃
// 로그인 카드가 화면 중앙에 위치합니다
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {children}
    </div>
  );
}
