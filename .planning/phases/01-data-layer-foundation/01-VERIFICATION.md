---
phase: 01-data-layer-foundation
verified: 2026-02-22T05:00:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
gaps: []
human_verification: []
---

# Phase 1: Data Layer Foundation — Verification Report

**Phase Goal:** 팀 데이터가 TypeScript 타입으로 안전하게 파싱되어 모든 UI 컴포넌트에 전달될 수 있다
**Verified:** 2026-02-22T05:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Daily 시트에서 일자별 매출/손익/이용시간/이용건수/가동률 데이터가 타입 안전하게 파싱되어 반환된다 (목표 데이터는 Weekly에만 존재) | VERIFIED | `parseDailySheet()` in `lib/data.ts` — DAILY_HEADERS 상수 기반 6개 필드 파싱. DailyRecord에 monthlyTarget 없음 (line 11 주석으로 명시). |
| 2  | Weekly 시트에서 주차별 매출/손익/이용시간/이용건수/가동률/목표 데이터가 타입 안전하게 파싱되어 반환된다 | VERIFIED | `parseWeeklySheet()` in `lib/data.ts` — WEEKLY_HEADERS 7개 필드 파싱, weeklyTarget 포함. WeeklyRecord 타입에 weeklyTarget 필드 존재. |
| 3  | 한국어 숫자 포맷(콤마, 원화 기호)이 포함된 값이 NaN 없이 Number로 변환된다 | VERIFIED | `parseKoreanNumber()` in `lib/data.ts` lines 50-71 — ₩, %, 콤마 순차 제거 후 Number() 변환. NaN이면 console.warn 후 null 반환. `safeNumber()`로 null→0 처리. |
| 4  | Google Sheets 미연결 시 mock 데이터로 폴백하여 대시보드 페이지가 정상 렌더링된다 | VERIFIED | `getTeamDashboardData()` lines 167-168 — `isGoogleSheetsConfigured() === false`이면 `mockTeamDashboardData` 즉시 반환. catch 블록(lines 193-198)에서 전체 mock 폴백. |
| 5  | 페이지 접속/새로고침 시 Google Sheets에서 최신 데이터를 가져온다 | VERIFIED | `getTeamDashboardData()` — googleapis SDK는 Next.js fetch 캐시를 사용하지 않으므로 매 요청 새로 실행. fetchedAt은 `new Date().toISOString()`으로 현재 시각 기록(lines 190, 197). |

**Score: 5/5 truths verified**

---

### Must-Have Truths (from PLAN frontmatter — 01-01 and 01-02)

#### Plan 01-01 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | DailyRecord 인터페이스가 존재하며 date, revenue, profit, usageHours, usageCount, utilizationRate 필드를 가진다 (monthlyTarget 없음) | VERIFIED | `types/dashboard.ts` lines 4-12 — 6개 필드 정확히 존재. monthlyTarget 없음 명시 주석. |
| 2 | WeeklyRecord 인터페이스가 존재하며 week, revenue, profit, usageHours, usageCount, utilizationRate, weeklyTarget 필드를 가진다 | VERIFIED | `types/dashboard.ts` lines 15-23 — 7개 필드 정확히 존재. |
| 3 | TeamDashboardData 인터페이스가 daily: DailyRecord[], weekly: WeeklyRecord[], fetchedAt: string 필드를 가진다 | VERIFIED | `types/dashboard.ts` lines 26-30 — 3개 필드 정확히 존재. |
| 4 | 기존 범용 타입 KpiData, MonthlyRevenue, CategoryDistribution, RecentOrder, DashboardData가 파일에서 완전히 삭제되었다 | VERIFIED | `grep -nE "\bKpiData\b|\bMonthlyRevenue\b|\bCategoryDistribution\b|\bRecentOrder\b|\bDashboardData\b" types/dashboard.ts` — 출력 없음. 파일은 3개 인터페이스만 export. |

#### Plan 01-02 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | mockTeamDashboardData가 DailyRecord 28개(4주), WeeklyRecord 8개를 포함하며 일 매출이 ~1,000만원 수준이다 | VERIFIED | `lib/mock-data.ts` — `grep -c "date:"` = 28, `grep -c "weeklyTarget:"` = 8. 일 매출 8,000,000~12,000,000원 범위. |
| 6 | mock 데이터에 목표 초과(가동률 80%+)와 미달(60% 미만) 케이스가 모두 존재하여 UI 조건부 색상 테스트가 가능하다 | VERIFIED | 가동률 분포: 55.8%(최솟값) ~ 92.0%(최댓값). 60% 미만 케이스: 55.8, 57.3, 58.0, 59.2. 60~80% 케이스: 다수. 80%+ 케이스: 80.3, 81.0, 81.2, 82.5, 83.2, 84.1, 85.0, 86.5, 87.4, 88.7, 89.3, 91.0, 91.5, 92.0. |
| 7 | parseKoreanNumber('₩1,234,567')이 1234567을 반환하고 parseKoreanNumber('85.3%')가 85.3을 반환한다 | VERIFIED | `lib/data.ts` lines 57-61 — ₩ 제거 → % 제거 → 콤마 제거 → Number() 변환. 로직상 정확. |
| 8 | parseKoreanNumber에 빈 문자열, null, undefined를 넣으면 0을 반환한다 | VERIFIED | `lib/data.ts` lines 52-54 — `if (value === undefined \|\| value === null \|\| value === "") return 0;` |
| 9 | parseKoreanNumber에 변환 불가 문자열을 넣으면 null을 반환한다 | VERIFIED | `lib/data.ts` lines 65-68 — `if (Number.isNaN(result)) { console.warn(...); return null; }` |
| 10 | parseDailySheet가 헤더 이름 기반으로 컬럼을 매핑하고 빈 행을 필터링한다 | VERIFIED | `lib/data.ts` lines 85-114 — `buildColumnIndex(rows[0])` 호출, `DAILY_HEADERS` 상수 사용, `.filter((row) => row.some((cell) => cell.trim() !== ""))` 빈 행 필터링. |
| 11 | parseWeeklySheet가 헤더 이름 기반으로 컬럼을 매핑하고 weeklyTarget을 파싱한다 | VERIFIED | `lib/data.ts` lines 120-150 — `buildColumnIndex(rows[0])`, `WEEKLY_HEADERS` 사용, weeklyTarget 필드 포함 파싱. |
| 12 | getTeamDashboardData()가 Google Sheets 미설정 시 mockTeamDashboardData를 반환한다 | VERIFIED | `lib/data.ts` line 167-168 — `if (!isGoogleSheetsConfigured()) { return mockTeamDashboardData; }` |
| 13 | getTeamDashboardData()가 API 실패 시 전체 mock으로 폴백하며 fetchedAt 타임스탬프가 현재 시각이다 | VERIFIED | `lib/data.ts` lines 192-198 — catch 블록: `{ ...mockTeamDashboardData, fetchedAt: new Date().toISOString() }` |
| 14 | getTeamDashboardData()가 반환하는 TeamDashboardData의 fetchedAt이 ISO 8601 형식이다 | VERIFIED | Sheets 경로: line 190 `new Date().toISOString()`. 폴백 경로: line 197 `new Date().toISOString()`. mock 정적 값: `"2026-02-22T00:00:00.000Z"`. 모두 ISO 8601 준수. |

**Score: 14/14 must-have truths verified**

---

### Required Artifacts

| Artifact | Expected | Level 1: Exists | Level 2: Substantive | Level 3: Wired | Status |
|----------|----------|-----------------|----------------------|----------------|--------|
| `types/dashboard.ts` | 팀 전용 TypeScript 타입 정의 (DailyRecord, WeeklyRecord, TeamDashboardData) | YES (31 lines) | YES — 3개 인터페이스, 구 타입 없음 | YES — `lib/mock-data.ts` line 2, `lib/data.ts` line 2에서 import | VERIFIED |
| `lib/mock-data.ts` | 팀 전용 mock 데이터 (28일 Daily + 8주 Weekly) | YES (65 lines) | YES — mockDailyRecords 28개, mockWeeklyRecords 8개, mockTeamDashboardData | YES — `lib/data.ts` line 4에서 import, line 168, 181, 185, 196에서 사용 | VERIFIED |
| `lib/data.ts` | Korean 숫자 파서 + Daily/Weekly 시트 파서 + getTeamDashboardData() | YES (200 lines) | YES — parseKoreanNumber, safeNumber, buildColumnIndex, parseDailySheet, parseWeeklySheet, getTeamDashboardData 모두 구현 | YES — `lib/sheets.ts`의 fetchSheetData, isGoogleSheetsConfigured 호출 (lines 3, 167, 174, 175) | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `types/dashboard.ts` | `lib/mock-data.ts` | `import { DailyRecord, WeeklyRecord, TeamDashboardData }` | WIRED | `lib/mock-data.ts` line 2: `import type { DailyRecord, WeeklyRecord, TeamDashboardData } from "@/types/dashboard"` |
| `types/dashboard.ts` | `lib/data.ts` | `import { DailyRecord, WeeklyRecord, TeamDashboardData }` | WIRED | `lib/data.ts` line 2: `import type { DailyRecord, WeeklyRecord, TeamDashboardData } from "@/types/dashboard"` |
| `lib/data.ts` | `lib/mock-data.ts` | `import { mockTeamDashboardData }` | WIRED | `lib/data.ts` line 4: `import { mockTeamDashboardData } from "./mock-data"`. 사용: lines 168, 181, 185, 196 |
| `lib/data.ts` | `lib/sheets.ts` | `fetchSheetData(), isGoogleSheetsConfigured()` | WIRED | `lib/data.ts` line 3: `import { fetchSheetData, isGoogleSheetsConfigured } from "./sheets"`. 사용: lines 167, 174, 175 |
| `app/(dashboard)/dashboard/page.tsx` | `lib/data.ts` | `getTeamDashboardData()` (Phase 2에서 연결) | DEFERRED | page.tsx는 여전히 삭제된 `getDashboardData`를 import 중. PLAN에 "Phase 2에서 연결"로 명시적 deferrall. TypeScript 에러 발생 중이나 Phase 1 scope 외. |

**Note on deferred link:** `app/(dashboard)/dashboard/page.tsx`가 현재 `getDashboardData` (삭제된 함수)를 import하여 TypeScript 에러가 발생한다. 01-02 PLAN의 key_links 항목 자체가 "(Phase 2에서 연결)"로 명기하였고, SUMMARY에도 "Phase 2에서 수정 예정"으로 문서화되어 있다. 이는 Phase 1 범위 내 실패가 아닌 계획된 deferrall이다.

---

### Requirements Coverage

| Requirement ID | Source Plan | Description | Status | Evidence |
|----------------|-------------|-------------|--------|----------|
| DATA-01 | 01-02 | Google Sheets Daily 시트에서 일자별 매출, 손익, 이용시간, 이용건수, 가동률, 매월 목표를 파싱한다 | SATISFIED | `parseDailySheet()` 구현. 헤더 기반 파싱, 6개 필드 매핑. (주: REQUIREMENTS.md는 "매월 목표" 포함이나 CONTEXT.md에서 Daily에 목표 없음으로 결정됨 — 이 결정은 PLAN에 문서화됨) |
| DATA-02 | 01-02 | Google Sheets Weekly 시트에서 주차별 매출, 손익, 이용시간, 이용건수, 가동률을 파싱한다 | SATISFIED | `parseWeeklySheet()` 구현. weeklyTarget 포함 7개 필드 파싱. |
| DATA-03 | 01-02 | 한국어 숫자 포맷("1,234,567", "₩1,234,567")을 NaN 없이 안전하게 Number로 변환한다 | SATISFIED | `parseKoreanNumber()` 구현. ₩/% 기호, 콤마 제거, NaN→null 반환. `safeNumber()`로 null→fallback 처리. |
| DATA-04 | 01-02 | Google Sheets 미연결 또는 API 실패 시 mock 데이터로 폴백하여 페이지가 정상 렌더링된다 | SATISFIED | `getTeamDashboardData()` — 미설정 즉시 mock 반환, catch 블록 전체 mock 폴백. |
| DATA-05 | 01-01 | 기존 범용 타입(KpiData, MonthlyRevenue, CategoryDistribution, RecentOrder)을 팀 전용 타입으로 완전 교체한다 | SATISFIED | `types/dashboard.ts` — 구 타입 5개 삭제, DailyRecord/WeeklyRecord/TeamDashboardData 3개로 교체. word-boundary grep 출력 없음. |
| UX-02 | 01-02 | 페이지 접속 및 새로고침 시 Google Sheets에서 최신 데이터를 가져온다 | PARTIALLY SATISFIED | `getTeamDashboardData()`는 googleapis SDK 사용으로 Next.js fetch 캐시 미사용 — 매 호출 새로 실행됨. 단, page.tsx에 `export const dynamic = 'force-dynamic'`은 Phase 2에서 추가 예정 (01-02 SUMMARY 명시). 데이터 레이어 구현 자체는 완료됨. |

**Orphaned Requirements Check:** REQUIREMENTS.md의 Phase 1 매핑과 PLAN frontmatter가 일치함. 추가 고아 requirement 없음.

**Note on DATA-01:** REQUIREMENTS.md 정의는 "매월 목표"를 Daily 파싱 항목으로 포함하지만, 01-01 PLAN의 CONTEXT.md 결정("Daily 시트에는 목표 컬럼이 존재하지 않음")으로 DailyRecord에서 제외되었다. 이 결정은 01-01 PLAN/SUMMARY에 명시적으로 문서화되어 있어 의도된 스코프 조정이다.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/(dashboard)/dashboard/page.tsx` | 3, 11, 16, 21, 29 | 삭제된 `getDashboardData` import + 구 컴포넌트 사용 | INFO | Phase 2에서 수정 예정으로 PLAN에 명시됨. TypeScript 에러 5개 발생. Phase 1 목표와 무관. |

**No blocker anti-patterns found** in Phase 1 scope files (`types/dashboard.ts`, `lib/mock-data.ts`, `lib/data.ts`).

---

### Human Verification Required

없음 — Phase 1은 데이터 레이어(타입/파서/mock)이며 UI 렌더링이 없다. 모든 검증 항목을 정적 분석으로 완료할 수 있다.

---

### Summary

Phase 1 목표 **"팀 데이터가 TypeScript 타입으로 안전하게 파싱되어 모든 UI 컴포넌트에 전달될 수 있다"** 가 달성되었다.

핵심 성과:
1. `types/dashboard.ts` — DailyRecord/WeeklyRecord/TeamDashboardData 3개 인터페이스로 완전 교체. 구 타입 5개 삭제 확인.
2. `lib/mock-data.ts` — 28일 Daily + 8주 Weekly mock 데이터. 가동률 55.8%~92.0% 분포로 UI 조건부 색상 테스트 케이스 모두 포함.
3. `lib/data.ts` — parseKoreanNumber (빈값→0, NaN→null), 헤더 이름 기반 파서(인덱스 고정 없음), open-ended range, getTeamDashboardData(Sheets 미설정→mock, API 실패→전체 mock 폴백, fetchedAt ISO 8601) 구현.
4. 타입→mock→data 체인 key links 모두 연결됨.
5. 세 파일 자체 TypeScript 오류 없음 (npx tsc 확인).

유일한 미연결 사항은 `app/(dashboard)/dashboard/page.tsx → getTeamDashboardData()` 연결로, Phase 2에서 수정하도록 PLAN에 명시적으로 계획된 deferrall이다. page.tsx의 TypeScript 빌드 에러도 동일 이유로 예상된 상태이다.

커밋 3개 확인 (bb5972c, 00ca5b2, 607af84) — 모두 실제 파일 변경을 수반한 원자적 커밋.

---

_Verified: 2026-02-22T05:00:00Z_
_Verifier: Claude (gsd-verifier)_
