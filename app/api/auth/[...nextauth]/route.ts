// NextAuth.js v5 API 라우트 핸들러
// /api/auth/* 경로의 모든 요청을 NextAuth가 처리합니다
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
