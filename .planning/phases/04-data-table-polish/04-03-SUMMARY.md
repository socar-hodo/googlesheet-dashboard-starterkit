---
phase: 04-data-table-polish
plan: "03"
subsystem: ui
tags: [nextjs, react, server-component, suspense, table, gpm, recharts]

# Dependency graph
requires:
  - phase: 04-01
    provides: DataTable + DataTableSkeleton 컴포넌트
  - phase: 04-02
    provides: UpdateTimestamp Client Component
provides:
  - DataTable + UpdateTimestamp가 통합된 대시보드 메인 페이지 (page.tsx)
  - 손익 대신 GPM(매출이익률) 지표로 전환된 테이블/KPI/차트
  - 단순화된 시트 파싱 구조 (2단 헤더 → 단일 헤더, weekly A1부터 fetch)
affects:
  - 05-final-polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Suspense key={`table-${activeTab}`} 패턴 — 탭 전환 시 스켈레턴 재마운트
    - GPM 추이: 전 행 대비 %p 변화, 0.05%p 미만은 '-' 표시
    - 시트 파싱: rows[1] 단일 헤더 행 기준, weekly는 A1부터 fetch

key-files:
  created:
    - .planning/phases/04-data-table-polish/04-03-SUMMARY.md
  modified:
    - app/(dashboard)/dashboard/page.tsx
    - components/dashboard/data-table.tsx
    - components/dashboard/kpi-cards.tsx
    - components/dashboard/charts/profit-trend-chart.tsx
    - lib/data.ts

key-decisions:
  - "손익 절대값 대신 GPM(매출이익률 %) 표시 — 비율 지표가 규모 무관 비교 용이"
  - "GPM 추이: 0.05%p 임계값 이하 변화는 '-' 표시 — 노이즈 제거"
  - "GPM 추이 색상: 상승 녹색/하락 빨간색 (dark 모드 동일 패턴)"
  - "시트 파싱 구조 단순화: buildMergedColumnIndex 제거, rows[1] 단일 헤더 기준"
  - "weekly 시트 fetch: A3 → A1 (전체 행 포함)"

patterns-established:
  - "GPM 계산: revenue > 0 ? (profit / revenue) * 100 : 0"
  - "GPM 추이 임계값: Math.abs(delta) < 0.05 → '-' 반환"
  - "시트 헤더: rows[1] 기반 buildColumnIndex 단일 방식"

requirements-completed: [TABLE-01, TABLE-02, TABLE-03, UX-03]

# Metrics
duration: 15min
completed: 2026-02-24
---

# Phase 4 Plan 03: page.tsx 통합 Summary

**DataTable + UpdateTimestamp를 page.tsx에 Suspense로 통합, 손익 → GPM 지표 전환 및 시트 파싱 단순화로 Phase 4 완성**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-24T09:57:00Z
- **Completed:** 2026-02-24T10:12:01Z
- **Tasks:** 2 (+ 1 post-checkpoint GPM 전환 작업)
- **Files modified:** 5

## Accomplishments

- page.tsx에 DataTable, DataTableSkeleton (Suspense), UpdateTimestamp 통합 완료
- 사용자 브라우저 검증(approved) 통과
- 손익 절대값 컬럼/KPI/차트 → GPM(%) 지표로 전환 (전 행 대비 %p 추이 포함)
- lib/data.ts 시트 파싱 구조 단순화 (buildMergedColumnIndex 제거, weekly A1부터 fetch)

## Task Commits

각 태스크는 원자적으로 커밋됨:

1. **Task 1: page.tsx에 DataTable + UpdateTimestamp 통합** - `acb6512` (feat)
2. **Task 2: 브라우저 검증** - 사용자 approved (checkpoint, 커밋 없음)
3. **Post-checkpoint: 손익 → GPM 전환 및 시트 파싱 개선** - `a18e761` (feat)

**Plan metadata:** (이 커밋)

## Files Created/Modified

- `app/(dashboard)/dashboard/page.tsx` - DataTable, DataTableSkeleton (Suspense key=탭), UpdateTimestamp 추가
- `components/dashboard/data-table.tsx` - 손익 컬럼 → GPM + GPM 추이 컬럼 (7컬럼 Daily, 8컬럼 Weekly)
- `components/dashboard/kpi-cards.tsx` - 손익 KPI → GPM KPI (매출 대비 이익률 %)
- `components/dashboard/charts/profit-trend-chart.tsx` - 손익 추이 → GPM 추이 차트
- `lib/data.ts` - buildMergedColumnIndex 제거, 단일 헤더 파싱, weekly A1부터 fetch

## Decisions Made

- GPM 추이 임계값 0.05%p: 일별 데이터의 소수점 노이즈 방지 목적
- weekly 시트 fetch 범위를 A3 → A1으로 변경: 실제 시트 구조(1행 식별자 + 2행 헤더)에 맞춤
- buildMergedColumnIndex 제거: 실제 시트가 2단 헤더 구조가 아니어서 단순 buildColumnIndex 사용

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 시트 파싱 헤더 구조 불일치 수정**
- **Found during:** Post-checkpoint (브라우저 검증 이후)
- **Issue:** lib/data.ts가 2단 헤더(buildMergedColumnIndex)와 weekly A3 fetch를 사용했으나 실제 시트 구조가 다름
- **Fix:** buildMergedColumnIndex 제거, rows[1] 단일 헤더 기준으로 변경, weekly fetch A3→A1
- **Files modified:** lib/data.ts
- **Verification:** npm run build 성공
- **Committed in:** a18e761

**2. [Rule 1 - Bug] 손익 절대값 → GPM 비율 전환**
- **Found during:** Post-checkpoint (브라우저 검증 이후)
- **Issue:** 테이블/KPI/차트에서 손익 절대값이 규모 비교에 부적합
- **Fix:** GPM = profit/revenue*100 계산, 전 행 대비 %p 추이 표시
- **Files modified:** components/dashboard/data-table.tsx, components/dashboard/kpi-cards.tsx, components/dashboard/charts/profit-trend-chart.tsx
- **Verification:** npm run build 성공, 브라우저 검증 approved
- **Committed in:** a18e761

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** 시트 구조 파싱 정확성 및 비즈니스 지표 적절성 향상. 핵심 기능(DataTable + UpdateTimestamp 통합) 계획대로 완성.

## Issues Encountered

- 브라우저 검증 후 추가 GPM 전환 및 파싱 개선이 별도 커밋으로 처리됨 — 계획 범위 내 정제 작업

## User Setup Required

None - 외부 서비스 설정 불필요.

## Next Phase Readiness

- Phase 4 완료: DataTable (GPM 포함) + UpdateTimestamp + Charts + KPI Cards 전부 통합
- Phase 5 (Final Polish)로 진행 가능
- 실제 Google Sheets 연결 시 DAILY_HEADERS/WEEKLY_HEADERS 헤더명이 실제 시트 2행과 일치하는지 확인 필요

---
*Phase: 04-data-table-polish*
*Completed: 2026-02-24*
