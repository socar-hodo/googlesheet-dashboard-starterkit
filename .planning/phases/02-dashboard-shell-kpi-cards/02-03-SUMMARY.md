---
phase: 02-dashboard-shell-kpi-cards
plan: "03"
subsystem: ui
tags: [next.js, server-component, suspense, searchparams, dynamic-rendering]

# Dependency graph
requires:
  - phase: 02-dashboard-shell-kpi-cards-02-02
    provides: KpiCards, KpiCard, KpiCardsSkeleton, TabNav 컴포넌트
  - phase: 01-data-layer-foundation
    provides: getTeamDashboardData(), DailyRecord, WeeklyRecord, TeamDashboardData 타입
provides:
  - 대시보드 메인 페이지 (searchParams 기반 탭 분기, force-dynamic)
  - Phase 2 전체 통합 완성 (탭 전환 + KPI 카드 + 로딩 스켈레턴)
  - lib/data.ts 2단 헤더 파싱 수정 (buildMergedColumnIndex)
affects:
  - phase-03-charts
  - phase-04-orders-table
  - phase-05-cleanup

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component에서 searchParams를 Promise<{tab?:string}>으로 await 처리 (Next.js 16)"
    - "export const dynamic = 'force-dynamic' — 탭 전환 시 서버 재페칭 보장"
    - "Suspense key={activeTab} — 탭 전환마다 스켈레턴 재마운트"
    - "TabNav(useSearchParams) → Suspense fallback=null 래핑"

key-files:
  created: []
  modified:
    - app/(dashboard)/dashboard/page.tsx
    - lib/data.ts

key-decisions:
  - "Next.js 16에서 searchParams는 Promise — await 필수, 타입도 Promise<{tab?:string}> 선언"
  - "TabNav는 useSearchParams() 사용 Client Component이므로 Suspense boundary 안에 배치, fallback=null"
  - "KpiCards Suspense에 key={activeTab} 설정 — 탭 전환 시 컴포넌트 리셋으로 스켈레턴 재표시"
  - "lib/data.ts 2단 헤더(병합 셀) 파싱 수정 — buildMergedColumnIndex로 빈 문자열 헤더 앞 값 전파"

patterns-established:
  - "Dashboard page: searchParams → activeTab → data fetch → Suspense 렌더링 패턴"
  - "탭 분기 렌더링: Suspense key prop으로 탭 전환 시 자동 스켈레턴 리셋"

requirements-completed: [TAB-02, TAB-03, UX-01]

# Metrics
duration: 5min
completed: 2026-02-24
---

# Phase 2 Plan 03: 대시보드 page.tsx 교체 + Phase 2 통합 완성 Summary

**searchParams 기반 Daily/Weekly 탭 분기, force-dynamic 캐시 비활성화, Suspense key 스켈레턴 리셋을 page.tsx에 통합 완성하고 브라우저 검증 통과**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-24T00:00:00Z
- **Completed:** 2026-02-24T00:05:00Z
- **Tasks:** 2 (Task 1 auto + Task 1b deviation + Task 2 checkpoint)
- **Files modified:** 2

## Accomplishments

- `app/(dashboard)/dashboard/page.tsx`를 `getTeamDashboardData()` + searchParams 탭 분기로 완전 교체
- `export const dynamic = 'force-dynamic'` 설정으로 탭 전환 시 서버 재페칭 보장
- `Suspense key={activeTab}` 패턴으로 탭 전환 시 KpiCardsSkeleton 재표시 (UX-01 완성)
- `lib/data.ts` 2단 헤더 파싱 버그 수정 (`buildMergedColumnIndex`) — Google Sheets 병합 셀 대응
- Phase 2 전체 브라우저 검증 통과 (Daily/Weekly 탭, URL 공유, 다크모드)

## Task Commits

Each task was committed atomically:

1. **Task 1: 대시보드 page.tsx 교체 및 빌드 검증** - `f100d5f` (feat)
2. **Task 1b: lib/data.ts 2단 헤더 파싱 수정** - `c7c41c8` (fix — auto-deviation Rule 1)
3. **Task 2: Phase 2 전체 기능 브라우저 검증** - checkpoint approved

**Plan metadata:** (이 커밋)

## Files Created/Modified

- `app/(dashboard)/dashboard/page.tsx` — searchParams Promise await, force-dynamic, TabNav/KpiCards Suspense 통합
- `lib/data.ts` — buildMergedColumnIndex 함수 추가, 2단 헤더 빈 셀 전파 파싱 수정

## Decisions Made

- **Next.js 16 searchParams Promise 타입:** `type SearchParams = Promise<{ tab?: string }>` 선언 후 await로 처리 — Next.js 16 App Router의 searchParams가 async로 변경된 것에 대응
- **TabNav Suspense 래핑:** `useSearchParams()` 사용 Client Component는 반드시 Suspense boundary 안에 배치해야 SSR에서 오류 없음, fallback=null로 깜빡임 없이 처리
- **Suspense key 전략:** `key={activeTab}`으로 탭 전환 시 Suspense 트리를 완전 리셋 → 스켈레턴이 항상 재표시됨 (UX-01 요구사항)
- **2단 헤더 파싱:** Google Sheets에서 병합 셀을 내보내면 하위 행에 빈 문자열이 채워짐 → buildMergedColumnIndex로 앞 값을 전파하여 컬럼 인덱스 정확히 구성

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] lib/data.ts 2단 헤더(병합 셀) 파싱 오류 수정**
- **Found during:** Task 1 (빌드 후 실행 검증)
- **Issue:** Google Sheets 2단 헤더에서 병합된 셀의 하위 행이 빈 문자열로 내보내짐 — 기존 buildColumnIndex가 빈 헤더를 무시해 컬럼 인덱스 누락
- **Fix:** `buildMergedColumnIndex` 함수 추가 — 헤더 행 순회 시 빈 문자열이면 이전 값을 전파, 하위 헤더와 조합하여 정확한 컬럼명 생성
- **Files modified:** `lib/data.ts`
- **Verification:** `npm run build` 성공, 파싱 로직 단위 확인
- **Committed in:** `c7c41c8` (별도 fix 커밋)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** 실제 Google Sheets 2단 헤더 대응에 필수적인 수정. 스코프 초과 없음.

## Issues Encountered

- lib/data.ts의 2단 헤더 파싱이 Google Sheets 병합 셀 내보내기 형식을 처리하지 못해 컬럼 인덱스가 불완전하게 생성되는 문제 발생 → Rule 1 자동 수정으로 해결

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 전체 완성: TabNav, KpiCard, KpiCards, KpiCardsSkeleton, 대시보드 page.tsx 모두 구현 완료
- Phase 3 (차트 컴포넌트) 진행 가능
- lib/data.ts의 2단 헤더 파싱이 수정되어 실제 Google Sheets 연동 시에도 정확한 컬럼 매핑 기대 가능
- 잠재적 관심사: 실제 Google Sheets API 연동 시 시트 탭명, 헤더 구조 검증 필요 (Phase 1 블로커 항목 유지)

---
*Phase: 02-dashboard-shell-kpi-cards*
*Completed: 2026-02-24*

## Self-Check: PASSED

- FOUND: `.planning/phases/02-dashboard-shell-kpi-cards/02-03-SUMMARY.md`
- FOUND: commit `f100d5f` (feat(02-03): page.tsx 교체)
- FOUND: commit `c7c41c8` (fix(data): 2단 헤더 파싱 수정)
