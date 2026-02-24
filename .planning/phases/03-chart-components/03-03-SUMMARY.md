---
phase: 03-chart-components
plan: "03"
subsystem: ui
tags: [recharts, next-themes, typescript, chart, dual-yaxis, referenceline]

# Dependency graph
requires:
  - phase: 03-01
    provides: chart-colors.ts, getChartColors() 헬퍼, ChartColorMode 인터페이스

provides:
  - utilization-trend-chart.tsx — CHART-03: LineChart + ReferenceLine(y=80 주황 점선)
  - usage-trend-chart.tsx — CHART-04: 이중 YAxis ComposedChart (이용건수 좌축/이용시간 우축)
affects:
  - 03-04 (ChartsSection에서 두 컴포넌트를 import하여 대시보드에 통합)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - LineChart + ReferenceLine(y=80) — 가동률 임계선 시각화 패턴
    - ComposedChart + YAxis×2 + yAxisId — 이중 Y축 이중 Bar 패턴

key-files:
  created:
    - components/dashboard/charts/utilization-trend-chart.tsx
    - components/dashboard/charts/usage-trend-chart.tsx
  modified: []

key-decisions:
  - "usage-trend-chart에 ComposedChart 사용 — BarChart도 가능하지만 RESEARCH.md Pattern 6과 일관성 유지"
  - "두 Bar 모두 yAxisId 명시 — Pitfall 3(Could not find yAxis 경고) 사전 방지"
  - ".next 캐시 오염(dev/types/cache-life.d.ts) 발생 → rm -rf .next 후 재빌드로 해결"

patterns-established:
  - "Pattern: ReferenceLine y={80} strokeDasharray='4 4' — 임계선 주황 점선 표준 구현"
  - "Pattern: yAxisId='left'/'right' 이중 YAxis — Bar/YAxis yAxisId 반드시 1:1 일치"

requirements-completed: [CHART-03, CHART-04, CHART-05]

# Metrics
duration: 4min
completed: 2026-02-24
---

# Phase 3 Plan 03: 가동률/이용 차트 Summary

**Recharts LineChart + ReferenceLine(y=80 주황 점선)으로 CHART-03, ComposedChart 이중 YAxis Bar로 CHART-04 구현 — 두 차트 모두 useTheme().resolvedTheme 기반 다크/라이트 테마 분기**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-24T02:29:46Z
- **Completed:** 2026-02-24T02:33:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- CHART-03: `UtilizationTrendChart` — LineChart + ReferenceLine(y=80, 주황 점선 strokeDasharray="4 4"), YAxis domain=[0,100], % 단위 툴팁
- CHART-04: `UsageTrendChart` — ComposedChart + YAxis×2(yAxisId="left"/"right"), Bar×2 각각 yAxisId 지정, Legend 포함
- 두 컴포넌트 모두 `getChartColors(resolvedTheme === 'dark')` 패턴으로 CHART-05 테마 요구사항 충족
- npm run build 성공

## Task Commits

Each task was committed atomically:

1. **Task 1: utilization-trend-chart.tsx — 가동률 라인 차트 + ReferenceLine (CHART-03)** - `576054e` (feat)
2. **Task 2: usage-trend-chart.tsx — 이용건수/이용시간 이중 YAxis 차트 (CHART-04)** - `f2ea7bb` (feat)

**Plan metadata:** (docs commit — see state update)

## Files Created/Modified

- `components/dashboard/charts/utilization-trend-chart.tsx` — CHART-03: 가동률 LineChart + y=80 ReferenceLine, Daily(M/D)/Weekly(주) 레이블 분기, 111줄
- `components/dashboard/charts/usage-trend-chart.tsx` — CHART-04: 이용건수/이용시간 이중 YAxis ComposedChart, Bar×2 + Legend, 117줄

## Decisions Made

- `ComposedChart` 사용 (usage-trend-chart): BarChart도 이중 YAxis 지원하나 RESEARCH.md Pattern 6과 일관성 유지
- yAxisId="left"/"right" 명시: Pitfall 3(yAxisId 불일치 콘솔 경고) 사전 방지, Bar 두 개 모두 yAxisId 지정
- `.next` 캐시 오염 발견: `dev/types/cache-life.d.ts` 누락 TypeScript 오류 → `rm -rf .next` 후 클린 빌드로 해결 (Rule 3 자동 처리)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] .next 캐시 오염으로 인한 TypeScript 빌드 오류 해결**
- **Found during:** Task 2 (usage-trend-chart 빌드 검증)
- **Issue:** `.next/lock` 파일 잠금 후 재시도 시 `.next/dev/types/cache-life.d.ts` 누락 TypeScript 컴파일 오류 발생
- **Fix:** `rm -rf .next` 후 클린 재빌드
- **Files modified:** 없음 (빌드 캐시 정리)
- **Verification:** npm run build 성공 확인
- **Committed in:** f2ea7bb 빌드 검증 완료 후 커밋

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking build issue)
**Impact on plan:** 빌드 캐시 정리만 필요, 코드 변경 없음. 계획 실행에 영향 없음.

## Issues Encountered

- `.next/lock` 파일 충돌: 다른 프로세스(개발 서버) 종료 후 lock 파일 잔존 → `rm -rf .next/lock` 후 재빌드로 해결
- `.next` 캐시 오염(TypeScript dev 타입 누락): 전체 `.next` 디렉토리 삭제 후 클린 빌드로 해결

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CHART-03(`UtilizationTrendChart`)과 CHART-04(`UsageTrendChart`) 준비 완료
- 03-04에서 `ChartsSection`이 4개 차트 컴포넌트를 import하여 대시보드에 통합 가능
- 03-02 완료 후 03-04에서 `RevenueTrendChart`, `ProfitTrendChart`와 함께 wiring 예정
- 두 컴포넌트 모두 `records: DailyRecord[] | WeeklyRecord[]`, `tab: 'daily' | 'weekly'` prop 인터페이스로 ChartsSection과 호환

---
*Phase: 03-chart-components*
*Completed: 2026-02-24*
