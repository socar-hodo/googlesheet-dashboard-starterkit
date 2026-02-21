# 경남울산사업팀 매출 대시보드

## What This Is

경남울산사업팀의 Google Sheets 데이터(Daily/Weekly 시트)를 실시간으로 읽어 매출 현황과 이용 분석을 한눈에 보여주는 웹 대시보드. 팀원 전체가 일별·주차별 매출, 손익, 이용시간, 이용건수, 가동률을 목표 대비 실적과 기간 비교로 확인할 수 있다.

## Core Value

**오늘 매출이 목표 대비 어디에 있는지, 지난 주/지난 달 대비 어떻게 변하고 있는지를 한 페이지에서 즉시 파악할 수 있어야 한다.**

## Requirements

### Validated

- ✓ Next.js 16 App Router 기반 웹 앱 구조 — existing
- ✓ Google Sheets API v4 서비스 계정 연동 (`lib/sheets.ts`) — existing
- ✓ Sheets 미설정 시 mock 데이터 폴백 — existing
- ✓ NextAuth.js Google OAuth + 개발용 Credentials 인증 — existing
- ✓ 이메일 화이트리스트 접근 제어 — existing
- ✓ 다크/라이트 테마 전환 — existing
- ✓ 사이드바 + 헤더 반응형 레이아웃 — existing

### Active

- [ ] Daily 시트 데이터 파싱 (일별 매출, 손익, 이용시간, 이용건수, 가동률 + 매월 목표)
- [ ] Weekly 시트 데이터 파싱 (주차별 매출, 손익, 이용시간, 이용건수, 가동률)
- [ ] Daily/Weekly 탭 전환 단일 페이지 대시보드
- [ ] 핵심 KPI 카드 (매출, 손익, 가동률, 이용건수) — 목표 대비 달성률 표시
- [ ] 매출 추이 차트 — 일별/주차별 실적 vs 목표 라인
- [ ] 손익 추이 차트 — 일별/주차별 수익/손실 트렌드
- [ ] 가동률 차트 — 기간별 가동률 시각화
- [ ] 기간 비교 (이번 주 vs 지난 주, 이번 달 vs 지난 달)
- [ ] 페이지 접속/새로고침 시 Google Sheets 실시간 데이터 반영
- [ ] 기존 DashboardData 타입을 팀 데이터 구조로 교체

### Out of Scope

- 데이터 편집/입력 기능 — 시트 직접 편집, 대시보드는 읽기 전용
- 알림/Push 기능 — v1은 조회만, 푸시는 과도한 복잡도
- 다른 팀/지역 데이터 — 경남울산사업팀 전용, 멀티테넌시 불필요
- 자동 새로고침 (주기적 polling) — 페이지 접속 시 fetch로 충분

## Context

- 기존 코드베이스: Google Sheets 연동 대시보드 스타터킷이 구축되어 있음
- 현재 타입 (`KpiData`, `MonthlyRevenue`, `CategoryDistribution`, `RecentOrder`)은 범용 예시 — 팀 데이터 구조로 완전 교체 필요
- Sheets 구조: `daily` 시트 (일자 | 매출 | 손익 | 이용시간 | 이용건수 | 가동률 | 매월목표), `weekly` 시트 (주차 | 매출 | 손익 | 이용시간 | 이용건수 | 가동률)
- 팀원 전체 사용 — 복잡한 필터/설정보다 즉시 읽히는 시각화가 중요
- 금액 단위: ₩ 만원 (기존 `₩${(amount / 10000).toLocaleString()}만` 패턴 유지)

## Constraints

- **Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts, shadcn/ui — 기존 스택 그대로 유지
- **Data Source**: Google Sheets API v4 (서비스 계정) — 시트 2개 (daily, weekly)
- **Read-only**: 대시보드는 데이터 조회만, 쓰기 없음
- **Single Page**: Daily/Weekly는 탭으로 전환, 라우트 분리 없음
- **Authentication**: 기존 NextAuth 구조 유지

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 기존 스타터킷 위에 구축 | 인증/레이아웃/Sheets 연동 이미 완성 | — Pending |
| Daily/Weekly 탭 전환 (단일 페이지) | 두 시트를 별도 라우트로 분리보다 비교가 쉬움 | — Pending |
| 타입 완전 교체 (기존 범용 타입 제거) | 스타터킷 예시 타입은 팀 데이터와 무관 | — Pending |
| 페이지 접속 시 fetch (no polling) | 팀원이 열 때 최신 데이터, 상시 polling 불필요 | — Pending |

---
*Last updated: 2026-02-21 after initialization*
