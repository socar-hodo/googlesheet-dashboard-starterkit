# 경남울산사업팀 매출 대시보드

## What This Is

경남울산사업팀의 Google Sheets 데이터(Daily/Weekly 시트)를 실시간으로 읽어 매출 현황과 이용 분석을 한눈에 보여주는 웹 대시보드. 팀원 전체가 일별·주차별 매출, GPM, 이용시간, 이용건수, 가동률을 목표 대비 실적과 기간 비교로 확인할 수 있다.

## Core Value

**오늘 매출이 목표 대비 어디에 있는지, 지난 주/지난 달 대비 어떻게 변하고 있는지를 한 페이지에서 즉시 파악할 수 있어야 한다.**

## Current Milestone: v1.1 분석 도구 강화

**Goal:** 기간 필터링, 데이터 내보내기, KPI 스파크라인으로 대시보드 분석 활용도를 높인다.

**Target features:**
- 기간 선택기 (이번 주/지난 주/이번 달/지난 달 토글)
- CSV/Excel 내보내기
- KPI 카드 미니 스파크라인 차트

## Requirements

### Validated

- ✓ Next.js 16 App Router 기반 웹 앱 구조 — existing
- ✓ Google Sheets API v4 서비스 계정 연동 (`lib/sheets.ts`) — existing
- ✓ Sheets 미설정 시 mock 데이터 폴백 — existing
- ✓ NextAuth.js Google OAuth + 개발용 Credentials 인증 — existing
- ✓ 이메일 화이트리스트 접근 제어 — existing
- ✓ 다크/라이트 테마 전환 — existing
- ✓ 사이드바 + 헤더 반응형 레이아웃 — existing
- ✓ Daily 시트 데이터 파싱 (일별 매출, GPM, 이용시간, 이용건수, 가동률) — v1.0
- ✓ Weekly 시트 데이터 파싱 (주차별 매출, GPM, 이용시간, 이용건수, 가동률) — v1.0
- ✓ Daily/Weekly 탭 전환 단일 페이지 대시보드 (URL searchParams) — v1.0
- ✓ KPI 카드 5개 — 목표 대비 달성률, 프로그레스 바, 기간 비교 델타, 조건부 색상 — v1.0
- ✓ 매출 추이 차트 (ComposedChart: Bar + 조건부 Line) — v1.0
- ✓ 손익/GPM 추이 차트 (BarChart + Cell 양음수 색상) — v1.0
- ✓ 가동률 차트 (LineChart + ReferenceLine y=80) — v1.0
- ✓ 이용건수/이용시간 차트 (이중 YAxis ComposedChart) — v1.0
- ✓ 데이터 테이블 (Daily/Weekly, 합계/평균 요약 행) — v1.0
- ✓ 업데이트 타임스탬프 (상대+절대 시간 표시) — v1.0
- ✓ 레거시 스타터킷 컴포넌트 완전 제거 — v1.0

### Active

- [ ] 기간 선택기 (이번 주/지난 주/이번 달/지난 달 토글) — v1.1
- [ ] CSV/Excel 내보내기 — v1.1
- [ ] KPI 카드 미니 스파크라인 차트 — v1.1

### Out of Scope

- 데이터 편집/입력 기능 — 시트 직접 편집, 대시보드는 읽기 전용
- 알림/Push 기능 — v1은 조회만, 푸시는 과도한 복잡도
- 다른 팀/지역 데이터 — 경남울산사업팀 전용, 멀티테넌시 불필요
- 자동 새로고침 (주기적 polling) — 페이지 접속 시 fetch로 충분
- 사용자 지정 날짜 범위 필터 — v1 범위 초과

## Context

- **Shipped v1.0** (2026-02-27): 5 phases, 13 plans, ~3,120 LOC TypeScript
- Tech stack: Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui, Recharts, NextAuth.js v5 beta, Google Sheets API v4
- Sheets 구조: `일별` 시트 (날짜 | 매출 | GPM | 이용시간 | 이용건수 | 가동률), `주차별` 시트 (주차 | 매출 | GPM | 이용시간 | 이용건수 | 가동률)
- 헤더 이름 기반 컬럼 매핑 적용 — 시트 컬럼 순서 변경에도 파싱 안정적
- 팀원 전체 사용 — 복잡한 필터/설정보다 즉시 읽히는 시각화가 중요

## Constraints

- **Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts, shadcn/ui — 기존 스택 유지
- **Data Source**: Google Sheets API v4 (서비스 계정) — 시트 2개 (일별, 주차별)
- **Read-only**: 대시보드는 데이터 조회만, 쓰기 없음
- **Single Page**: Daily/Weekly는 탭으로 전환, 라우트 분리 없음
- **Authentication**: 기존 NextAuth 구조 유지

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 기존 스타터킷 위에 구축 | 인증/레이아웃/Sheets 연동 이미 완성 | ✓ Good — 초기 설정 비용 없이 바로 기능 개발 |
| Daily/Weekly 탭 전환 (단일 페이지) | 두 시트를 별도 라우트로 분리보다 비교가 쉬움 | ✓ Good — URL searchParams로 공유/북마크 가능 |
| 타입 완전 교체 (기존 범용 타입 제거) | 스타터킷 예시 타입은 팀 데이터와 무관 | ✓ Good — 팀 도메인 전용 타입으로 명확성 향상 |
| 페이지 접속 시 fetch (no polling) | 팀원이 열 때 최신 데이터, 상시 polling 불필요 | ✓ Good — API 호출 최소화, 서버 비용 절감 |
| 헤더 이름 기반 컬럼 매핑 | 인덱스 고정 파싱은 시트 구조 변경에 취약 | ✓ Good — buildColumnIndex로 유연한 파싱 |
| Recharts SVG 색상 하드코딩 | CSS 변수가 SVG fill/stroke에 직접 적용 불가 | ✓ Good — getChartColors(isDark) 패턴으로 테마 분기 |
| 손익 → GPM 전환 (Phase 4) | 손익 절대값보다 GPM 비율이 팀 분석에 더 유용 | ✓ Good — 시트 파싱 구조도 단순화 |

---
*Last updated: 2026-02-27 after v1.1 milestone started*
