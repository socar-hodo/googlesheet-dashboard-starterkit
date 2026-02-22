---
phase: 02-dashboard-shell-kpi-cards
plan: "02"
subsystem: ui
tags: [react, nextjs, tailwind, shadcn, kpi, tabs, typescript]

# Dependency graph
requires:
  - phase: 02-dashboard-shell-kpi-cards
    plan: "01"
    provides: shadcn Tabs/Progress 컴포넌트, KPI 계산/포맷팅 유틸리티 7개 함수
  - phase: 01-data-layer-foundation
    provides: DailyRecord/WeeklyRecord/TeamDashboardData 타입 정의

provides:
  - TabNav URL 탭 전환 Client Component (components/dashboard/tab-nav.tsx)
  - KpiCard 단일 KPI 카드 Server Component (components/dashboard/kpi-card.tsx)
  - KpiCards 5개 KPI 카드 그리드 Server Component (components/dashboard/kpi-cards.tsx)

affects:
  - 02-03 (대시보드 페이지 조립 시 TabNav + KpiCards를 조합)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Daily 탭 KPI: 달성률 없이 실적값 + 전일 비교 델타만 표시"
    - "Weekly 탭 KPI: 매출 카드만 weeklyTarget 대비 달성률 표시, 나머지는 델타만"
    - "URL 탭 상태: useSearchParams + router.replace로 scroll: false 탭 전환"
    - "날짜 정렬: localeCompare로 date 필드 오름차순, 마지막 항목이 최신"

key-files:
  created:
    - components/dashboard/tab-nav.tsx
    - components/dashboard/kpi-card.tsx
  modified:
    - components/dashboard/kpi-cards.tsx

key-decisions:
  - "Daily 탭에서 달성률/Progress 바 숨김 — DailyRecord에 목표값 없음 (Phase 1 결정 준수)"
  - "Weekly 탭에서 매출 카드만 weeklyTarget 대비 달성률 표시 — 타 KPI는 목표값 없음"
  - "KpiCards는 Server Component 유지 — 데이터 변환/렌더링만, 상호작용 없음"
  - "Progress value 상한 Math.min(achievementRate, 100) — 100% 초과 시 바가 넘치지 않도록"

patterns-established:
  - "KpiCard: achievementRate !== undefined 조건부 렌더링 — undefined와 0을 구분"
  - "KpiCards Daily: [...data.daily].sort 후 마지막 항목 추출 — 원본 배열 변경 없음"

requirements-completed: [TAB-01, TAB-02, KPI-01, KPI-02, KPI-03, KPI-04, KPI-05]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 02 Plan 02: TabNav + KpiCard + KpiCards Summary

**URL searchParams 기반 Daily/Weekly 탭 전환 Client Component와 달성률·델타를 표시하는 5개 KPI 카드 그리드 Server Component 구현**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T10:00:12Z
- **Completed:** 2026-02-22T10:03:02Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- TabNav: useSearchParams + router.replace로 URL ?tab= 상태 관리하는 Client Component 구현
- KpiCard: achievementRate 조건부로 달성률 텍스트 + Progress 바 표시하는 재사용 카드 컴포넌트 구현
- KpiCards: TeamDashboardData를 받아 Daily/Weekly 탭별 5개 KPI 카드를 xl:grid-cols-5 반응형 그리드로 렌더링

## Task Commits

Each task was committed atomically:

1. **Task 1: TabNav Client Component 구현** - `73259a4` (feat)
2. **Task 2: KpiCard 단일 카드 컴포넌트 구현** - `96e3b5b` (feat)
3. **Task 3: KpiCards 그리드 Server Component 구현** - `e4d2707` (feat)

## Files Created/Modified
- `components/dashboard/tab-nav.tsx` - Daily/Weekly 탭 전환 Client Component (use client, useSearchParams 사용)
- `components/dashboard/kpi-card.tsx` - 단일 KPI 카드 (달성률/Progress 바/델타 조건부 렌더링)
- `components/dashboard/kpi-cards.tsx` - 5개 KPI 카드 그리드 Server Component (기존 KpiData 기반 구현을 TeamDashboardData 기반으로 교체)

## Decisions Made
- Daily 탭에서 달성률/Progress 바 숨김: DailyRecord에 목표값 없음 (Phase 1 CONTEXT.md 결정 준수)
- Weekly 탭에서 매출 카드만 weeklyTarget 대비 달성률 표시: 손익/이용건수/가동률/이용시간은 목표값 없음
- Progress value 상한 Math.min(achievementRate, 100): 100% 초과 달성 시 Progress 바가 넘치지 않도록 방어

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 기존 `kpi-cards.tsx`가 구 `KpiData` 타입 기반이었으나 Plan에서 교체 대상으로 명시되어 있어 정상 교체 완료.
- TypeScript 전체 빌드에서 `page.tsx`, `category-chart.tsx`, `recent-orders-table.tsx`, `revenue-chart.tsx`에 Phase 1 타입 교체 관련 오류가 있으나, 이는 02-03에서 처리 예정인 기존 이슈로 이번 Plan 범위 외.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 02-03에서 import 가능한 상태:
  - `import { TabNav } from '@/components/dashboard/tab-nav'`
  - `import { KpiCard } from '@/components/dashboard/kpi-card'`
  - `import { KpiCards } from '@/components/dashboard/kpi-cards'`
- TabNav: useSearchParams() 사용으로 Suspense boundary 필요 — 02-03 page.tsx에서 처리 예정
- TypeScript: tab-nav.tsx, kpi-card.tsx, kpi-cards.tsx 모두 오류 없음 확인됨

---
*Phase: 02-dashboard-shell-kpi-cards*
*Completed: 2026-02-22*

## Self-Check: PASSED

- FOUND: components/dashboard/tab-nav.tsx
- FOUND: components/dashboard/kpi-card.tsx
- FOUND: components/dashboard/kpi-cards.tsx
- FOUND: .planning/phases/02-dashboard-shell-kpi-cards/02-02-SUMMARY.md
- Commit 73259a4: feat(02-02): TabNav Daily/Weekly 탭 전환 Client Component 구현
- Commit 96e3b5b: feat(02-02): KpiCard 단일 KPI 카드 컴포넌트 구현
- Commit e4d2707: feat(02-02): KpiCards 5개 KPI 카드 그리드 Server Component 구현
