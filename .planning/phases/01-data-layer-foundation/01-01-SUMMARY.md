---
phase: 01-data-layer-foundation
plan: "01"
subsystem: database
tags: [typescript, types, dashboard, team-data]

# Dependency graph
requires: []
provides:
  - DailyRecord 인터페이스 (일자별 매출/손익/이용시간/이용건수/가동률)
  - WeeklyRecord 인터페이스 (주차별 매출/손익/이용시간/이용건수/가동률/주차목표)
  - TeamDashboardData 컨테이너 인터페이스 (daily, weekly, fetchedAt)
affects:
  - lib/mock-data.ts
  - lib/data.ts
  - lib/sheets.ts
  - app/(dashboard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "팀 전용 타입 정의: 범용 타입 대신 도메인 특화 인터페이스 사용"
    - "목표 필드 분리: weeklyTarget은 WeeklyRecord에만 존재, DailyRecord에는 없음"

key-files:
  created: []
  modified:
    - types/dashboard.ts

key-decisions:
  - "DailyRecord에 monthlyTarget 없음 — Daily 시트에는 목표 컬럼이 존재하지 않음 (CONTEXT.md 결정)"
  - "기존 범용 e-커머스 타입(KpiData, MonthlyRevenue, CategoryDistribution, RecentOrder, DashboardData) 완전 삭제"
  - "DailyRecord와 WeeklyRecord는 공유 베이스 타입 없이 완전히 독립된 인터페이스로 정의"

patterns-established:
  - "타입 계약 우선: mock-data.ts와 data.ts 작성 전에 types/dashboard.ts 교체 완료"
  - "한국어 주석: 코드 주석은 한국어, 필드명/인터페이스명은 영어"

requirements-completed: [DATA-05]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 1 Plan 01: 팀 전용 TypeScript 타입 정의 Summary

**경남울산사업팀 전용 DailyRecord/WeeklyRecord/TeamDashboardData 타입으로 기존 e-커머스 범용 타입 5개를 완전 교체**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T03:29:22Z
- **Completed:** 2026-02-22T03:30:55Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- 기존 범용 e-커머스 타입 5개(KpiData, MonthlyRevenue, CategoryDistribution, RecentOrder, DashboardData) 완전 삭제
- 경남울산사업팀 전용 DailyRecord 인터페이스 추가 (일자별 기록, monthlyTarget 없음)
- WeeklyRecord 인터페이스 추가 (주차별 기록, weeklyTarget 포함)
- TeamDashboardData 컨테이너 인터페이스 추가 (daily, weekly, fetchedAt)
- types/dashboard.ts 파일 자체에 TypeScript 컴파일 오류 없음

## Task Commits

각 태스크는 원자적으로 커밋됨:

1. **Task 1: 팀 전용 TypeScript 타입 정의로 완전 교체** - `bb5972c` (feat)

**Plan metadata:** (docs 커밋 예정)

## Files Created/Modified

- `types/dashboard.ts` - 기존 범용 타입 삭제, DailyRecord/WeeklyRecord/TeamDashboardData 인터페이스 정의

## Decisions Made

- DailyRecord에 monthlyTarget 없음 — CONTEXT.md 결정 반영 (Daily 시트에는 목표 컬럼이 존재하지 않음)
- 기존 범용 e-커머스 타입을 @deprecated로 유지하지 않고 한 번에 전부 삭제
- DailyRecord와 WeeklyRecord를 공유 베이스 타입 없이 독립된 인터페이스로 정의

## Deviations from Plan

없음 — 플랜대로 정확히 실행됨.

## Issues Encountered

없음.

## User Setup Required

없음 — 외부 서비스 설정 불필요.

## Next Phase Readiness

- types/dashboard.ts 타입 계약 확립 완료
- 다음 플랜(01-02)에서 lib/mock-data.ts를 DailyRecord/WeeklyRecord 기반으로 작성 가능
- 다음 플랜(01-03)에서 lib/data.ts를 TeamDashboardData 기반으로 작성 가능
- 기존 컴포넌트(app/(dashboard))에서 TypeScript 오류 발생 예상 — Phase 2에서 수정 예정

---
*Phase: 01-data-layer-foundation*
*Completed: 2026-02-22*
