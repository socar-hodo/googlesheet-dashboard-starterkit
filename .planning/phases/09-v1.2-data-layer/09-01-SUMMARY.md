---
phase: 09-v1.2-data-layer
plan: "01"
subsystem: database
tags: [typescript, types, mock-data, dashboard]

# Dependency graph
requires:
  - phase: 08-sparkline
    provides: "기존 TeamDashboardData, DailyRecord, WeeklyRecord 인터페이스"
provides:
  - "CustomerTypeRow 타입 (고객 유형별 이용 건수 — 일별/주차별 공용)"
  - "RevenueBreakdownRow 타입 (매출 세분화 — 대여/PF/주행/부름/기타)"
  - "CostBreakdownRow 타입 (비용 분석 — 카테고리 합계 + 드릴다운 세부)"
  - "TeamDashboardData 확장 — 6개 신규 배열 필드"
  - "mockTeamDashboardData 확장 — 6개 빈 배열 플레이스홀더"
affects:
  - 09-02-PLAN (파서 구현 — CustomerTypeRow, RevenueBreakdownRow, CostBreakdownRow 의존)
  - 10-customer-type-analysis
  - 11-revenue-breakdown
  - 12-cost-analysis

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "0 플레이스홀더 패턴: 신규 데이터 레이어 추가 시 빈 배열로 mock 확장 → 기존 빌드 유지"
    - "타입 컨트랙트 우선: UI 단계보다 먼저 TypeScript 인터페이스 확립 → 후속 Plan들이 안전하게 의존"

key-files:
  created: []
  modified:
    - types/dashboard.ts
    - lib/mock-data.ts
    - lib/data.ts

key-decisions:
  - "lib/data.ts getTeamDashboardData 반환 객체에 6개 신규 필드를 빈 배열로 추가 — Plan 02 파서 구현 전까지 빈 배열 반환으로 타입 정합성 유지"

patterns-established:
  - "타입 컨트랙트 우선 (Plan 01) → 파서 구현 (Plan 02) → UI 단계 (Phase 10~12) 순서"

requirements-completed: [CTYPE-01, CTYPE-02, REV-01, REV-02, COST-01, COST-02]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 9 Plan 01: 타입 컨트랙트 및 Mock 데이터 정의 Summary

**TypeScript 인터페이스 3개 신규 정의 (CustomerTypeRow, RevenueBreakdownRow, CostBreakdownRow) + TeamDashboardData 6개 배열 필드 확장 + 기존 빌드 중단 없이 mock/data 레이어 업데이트**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T13:47:28Z
- **Completed:** 2026-03-01T13:50:37Z
- **Tasks:** 2 (+ 1 auto-fix deviation)
- **Files modified:** 3

## Accomplishments

- `types/dashboard.ts`에 고객유형/매출세분화/비용분석 3개 타입 export 추가 — Phase 10/11/12 UI 단계가 의존할 인터페이스 완성
- `TeamDashboardData`에 6개 신규 배열 필드 추가 (customerTypeDaily/Weekly, revenueBreakdownDaily/Weekly, costBreakdownDaily/Weekly)
- `lib/mock-data.ts` 확장 — 빈 배열 플레이스홀더로 기존 빌드 유지, Sheets 연결 후 실제 데이터로 자동 대체 예정
- `npm run build` 타입 오류 없이 통과, 기존 대시보드 기능 중단 없음

## Task Commits

각 Task별 원자적 커밋:

1. **Task 1: 타입 정의 — CustomerTypeRow, RevenueBreakdownRow, CostBreakdownRow, TeamDashboardData 확장** - `5029681` (feat)
2. **Task 2: Mock 데이터 확장 — 6개 빈 배열 플레이스홀더 추가** (+ Rule 1 auto-fix: lib/data.ts) - `021265f` (feat)

**Plan metadata:** (생성 예정)

## Files Created/Modified

- `types/dashboard.ts` - CustomerTypeRow, RevenueBreakdownRow, CostBreakdownRow 신규 타입 + TeamDashboardData 확장 (6개 배열 필드)
- `lib/mock-data.ts` - import에 3개 신규 타입 추가 + mockTeamDashboardData에 6개 빈 배열 필드 추가
- `lib/data.ts` - getTeamDashboardData 반환 객체에 6개 신규 필드 추가 (Rule 1 auto-fix)

## Decisions Made

- `lib/data.ts` 반환 객체에 6개 신규 필드를 빈 배열로 추가: Plan 02에서 실제 파서를 구현하기 전까지 타입 정합성 유지를 위해 빈 배열 반환. 기존 컨슈머(page.tsx)에 영향 없음.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] lib/data.ts TeamDashboardData 반환 객체 타입 오류 수정**

- **Found during:** Task 2 (Mock 데이터 확장 후 tsc --noEmit 실행 시)
- **Issue:** `getTeamDashboardData`의 `return { daily, weekly, fetchedAt }` 블록이 확장된 `TeamDashboardData` 인터페이스의 6개 신규 필드를 포함하지 않아 TypeScript 오류 발생 (`TS2740: Type '...' is missing the following properties`)
- **Fix:** 6개 신규 필드를 빈 배열(`[]`)로 반환 객체에 추가 — Plan 02 파서 구현 전까지 임시 빈 배열 반환
- **Files modified:** `lib/data.ts`
- **Verification:** `npx tsc --noEmit` 오류 없음, `npm run build` 통과
- **Committed in:** `021265f` (Task 2 커밋에 포함)

---

**Total deviations:** 1 auto-fixed (Rule 1 — 타입 오류)
**Impact on plan:** 필수 수정. TeamDashboardData 확장으로 인해 기존 반환 객체가 타입 계약을 위반한 것을 수정. 스코프 확대 없음.

## Issues Encountered

없음 — 모든 타입 오류는 예측 가능한 범위 내에서 발생하였고 즉시 수정됨.

## User Setup Required

없음 — 외부 서비스 설정 불필요.

## Next Phase Readiness

- **Plan 02 (파서 구현):** `CustomerTypeRow`, `RevenueBreakdownRow`, `CostBreakdownRow` 타입이 준비됨 — `lib/data.ts`에 파서 함수 추가 가능
- **Phase 10/11/12 (UI):** 타입 인터페이스 확정 — UI 컴포넌트에서 타입 안전하게 사용 가능
- **주의:** Google Sheets에 왕복_건수/부름_건수/편도_건수 컬럼이 없을 수 있음 — Plan 02에서 폴백(0) 처리 예정

---
*Phase: 09-v1.2-data-layer*
*Completed: 2026-03-01*
