// NextAuth.js v5 설정
// Google Provider + 이메일 화이트리스트 인증
// Google 키가 없으면 개발용 Credentials 로그인으로 자동 전환
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

/** Google OAuth 환경변수가 설정되었는지 확인 */
function isGoogleOAuthConfigured(): boolean {
  return !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

/** 환경변수에서 허용된 이메일 목록을 파싱 */
function getAllowedEmails(): string[] {
  const emails = process.env.ALLOWED_EMAILS ?? "";
  return emails
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/** 사용할 프로바이더 목록 구성 */
function getProviders(): Provider[] {
  // Google OAuth가 설정되어 있으면 Google Provider 사용
  if (isGoogleOAuthConfigured()) {
    return [Google];
  }

  // 미설정 시 개발용 Credentials Provider (이메일/비밀번호 없이 바로 로그인)
  return [
    Credentials({
      name: "개발 모드 로그인",
      credentials: {
        email: {
          label: "이메일",
          type: "email",
          placeholder: "dev@example.com",
        },
      },
      async authorize(credentials) {
        // 개발 모드: 이메일만 입력하면 바로 로그인
        const email = credentials?.email as string;
        if (!email) return null;

        return {
          id: "dev-user-1",
          name: email.split("@")[0],
          email: email,
          image: null,
        };
      },
    }),
  ];
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: getProviders(),
  pages: {
    signIn: "/login",  // 커스텀 로그인 페이지
    error: "/login",   // 에러 발생 시에도 로그인 페이지로 리다이렉트
  },
  session: {
    strategy: "jwt", // Credentials Provider 사용 시 JWT 필수
  },
  callbacks: {
    /** 로그인 시 이메일 화이트리스트 검증 */
    signIn({ user }) {
      const allowed = getAllowedEmails();
      // ALLOWED_EMAILS가 비어있으면 모든 계정 허용 (개발 편의)
      if (allowed.length === 0) return true;
      return allowed.includes(user.email ?? "");
    },
    /** 세션에 사용자 정보 포함 */
    session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
