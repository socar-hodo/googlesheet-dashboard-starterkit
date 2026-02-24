---
phase: 04-data-table-polish
verified: 2026-02-24T11:00:00Z
status: human_needed
score: 9/10 must-haves verified
re_verification: false
human_verification:
  - test: "Daily 탭 테이블에서 GPM 음수(적자) 시 빨간색 텍스트 표시 확인"
    expected: "GPM이 음수일 때 text-red-600으로 렌더링된다"
    why_human: "GPM 추이 색상 로직은 delta가 음수일 때 red를 적용하지만, GPM 자체가 음수인 경우 별도 처리가 없다 — 실제 데이터로 브라우저 확인 필요"
  - test: "Daily 탭 sticky 헤더 동작 — 테이블 스크롤 시 헤더 고정 여부 확인"
    expected: "테이블 스크롤 시 날짜/매출/GPM 등 헤더 행이 화면 상단에 고정된다"
    why_human: "sticky top-0 CSS는 코드에 존재하나 overflow-x-auto 컨테이너 내 동작은 CSS 계층 조합 문제로 브라우저 확인 필요"
---

# Phase 4: Data Table Polish Verification Report

**Phase Goal:** 상세 데이터를 테이블로 확인하고, 합계/평균 요약과 마지막 업데이트 시각을 볼 수 있다
**Verified:** 2026-02-24T11:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Daily 탭에서 날짜/매출/이용시간/이용건수/가동률 컬럼 테이블이 표시된다 | VERIFIED | data-table.tsx L87-93: TableHead 날짜/매출/GPM/GPM 추이/이용시간/이용건수/가동률 (7컬럼, 손익 대신 GPM으로 전환) |
| 2  | Weekly 탭에서 주차/매출/이용시간/이용건수/가동률/목표 컬럼 테이블이 표시된다 | VERIFIED | data-table.tsx L159-167: 주차/매출/GPM/GPM 추이/이용시간/이용건수/가동률/목표 (8컬럼) |
| 3  | 테이블 하단에 합계 행과 평균 행이 굵은 글씨와 진한 배경으로 구분되어 표시된다 | VERIFIED | data-table.tsx L111 & L121: `font-bold bg-muted/60` TableRow — 합계/평균 2행 구현됨 |
| 4  | 홀짝수 행 배경색 교체(striped)로 가독성이 확보된다 | VERIFIED | data-table.tsx L98, L172: `index % 2 === 1 ? 'bg-muted/30' : ''` 조건부 스타일 |
| 5  | 스크롤 시 헤더가 화면 상단에 고정(sticky)된다 | UNCERTAIN | data-table.tsx L85, L158: `sticky top-0 bg-background z-10` 적용됨 — overflow-x-auto 컨테이너 내 실제 동작은 브라우저 확인 필요 |
| 6  | 대시보드 상단에 마지막 데이터 업데이트 시각이 표시된다 | VERIFIED | update-timestamp.tsx 구현 + page.tsx L38-40: `div.flex.justify-end > UpdateTimestamp fetchedAt={data.fetchedAt}` |
| 7  | 타임스탬프가 상대 시간과 절대 시간을 동시에 표시한다 | VERIFIED | update-timestamp.tsx L65-70: `마지막 업데이트: {relativeTime} ({absoluteTime})` 형식 |
| 8  | page.tsx에 DataTable과 DataTableSkeleton이 Suspense로 감싸져 렌더링된다 | VERIFIED | page.tsx L53-55: `Suspense key={"table-${activeTab}"} fallback={DataTableSkeleton} > DataTable data tab` |
| 9  | 데이터가 없을 때 빈 화면이 아닌 한국어 안내 메시지가 표시된다 | VERIFIED | data-table.tsx L217, L222: "일별 데이터가 없습니다." / "주차별 데이터가 없습니다." 처리됨 |
| 10 | GPM 음수 적자 셀이 시각적으로 구분된다 | UNCERTAIN | GPM 추이 하락은 text-red-600 적용(L62), 그러나 GPM 자체 음수값에 대한 빨간색 처리는 없음 — 브라우저 확인 필요 |

**Score:** 8/10 자동 검증 완료 (2개 브라우저 확인 필요)

---

### Required Artifacts

| Artifact | Expected | Lines | Status | Details |
|----------|----------|-------|--------|---------|
| `components/dashboard/data-table.tsx` | DataTable Server Component — Daily/Weekly 탭별 테이블 렌더링, 요약 행 포함 | 226 (min 80) | VERIFIED | named export `DataTable`, DailyTable/WeeklyTable 내부 함수 포함 |
| `components/dashboard/data-table-skeleton.tsx` | DataTableSkeleton — 로딩 중 스켈레톤 플레이스홀더 | 16 (min 15) | VERIFIED | named export `DataTableSkeleton`, 헤더 1행 + 8행 스켈레톤 |
| `components/dashboard/update-timestamp.tsx` | UpdateTimestamp Client Component — 상대/절대 시간 포맷팅 표시 | 73 (min 40) | VERIFIED | "use client", named export `UpdateTimestamp`, getRelativeTime/getAbsoluteTime 로컬 함수 포함 |
| `app/(dashboard)/dashboard/page.tsx` | DataTable + UpdateTimestamp 통합된 대시보드 메인 페이지 | 58 | VERIFIED | DataTable, DataTableSkeleton, UpdateTimestamp 3개 import + Suspense 통합 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/dashboard/data-table.tsx` | `types/dashboard.ts` | `import DailyRecord, WeeklyRecord, TeamDashboardData` | WIRED | data-table.tsx L2: `import type { TeamDashboardData, DailyRecord, WeeklyRecord } from '@/types/dashboard'` |
| `components/dashboard/data-table.tsx` | `components/ui/table.tsx` | shadcn Table 컴포넌트 사용 | WIRED | data-table.tsx L3-10: `from '@/components/ui/table'` — Table, TableHeader, TableBody, TableRow, TableHead, TableCell 모두 import 및 사용 |
| `components/dashboard/update-timestamp.tsx` | `app/(dashboard)/dashboard/page.tsx` | `fetchedAt` prop 전달 | WIRED | page.tsx L39: `<UpdateTimestamp fetchedAt={data.fetchedAt} />` |
| `app/(dashboard)/dashboard/page.tsx` | `components/dashboard/data-table.tsx` | import DataTable + DataTableSkeleton, Suspense 감싸기 | WIRED | page.tsx L10-11: import 확인, L53-55: Suspense `key={"table-${activeTab}"}` fallback DataTableSkeleton |
| `app/(dashboard)/dashboard/page.tsx` | `components/dashboard/update-timestamp.tsx` | import UpdateTimestamp, fetchedAt prop 전달 | WIRED | page.tsx L12: import 확인, L38-40: div.flex.justify-end > UpdateTimestamp |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| TABLE-01 | 04-01, 04-03 | Daily 탭에서 일자별 전체 데이터를 테이블로 표시 (날짜, 매출, **손익**, 이용시간, 이용건수, 가동률) | SATISFIED (with deviation) | 테이블 구현됨. 단, "손익" 컬럼은 GPM + GPM 추이로 대체됨 — 04-03 post-checkpoint에서 사용자 승인된 의도적 개선. 나머지 컬럼(날짜, 매출, 이용시간, 이용건수, 가동률)은 모두 구현됨 |
| TABLE-02 | 04-01, 04-03 | Weekly 탭에서 주차별 전체 데이터를 테이블로 표시 | SATISFIED | WeeklyTable 구현됨 (8컬럼: 주차/매출/GPM/GPM 추이/이용시간/이용건수/가동률/목표) |
| TABLE-03 | 04-01, 04-03 | 테이블 하단에 전체 합계 및 평균 요약 행을 표시 | SATISFIED | data-table.tsx: 합계 행(L111) + 평균 행(L121), `font-bold bg-muted/60` 스타일, 0나누기 방어(len > 0) |
| UX-03 | 04-02, 04-03 | 대시보드 상단에 마지막 데이터 업데이트 타임스탬프를 표시 | SATISFIED | update-timestamp.tsx: "마지막 업데이트: N시간 전 (YYYY. MM. DD. HH:mm)" 형식, page.tsx L37-40: 상단 우측(flex justify-end) 배치 |

**Note on TABLE-01 deviation:** REQUIREMENTS.md의 TABLE-01은 "손익" 컬럼을 명시하나, 04-03 플랜 post-checkpoint에서 GPM(매출이익률 %)으로 전환이 결정되고 사용자 브라우저 검증에서 approved됨. REQUIREMENTS.md의 해당 항목 텍스트는 업데이트되지 않았으나 체크박스는 완료([x]) 처리됨. 요구사항의 본질(이익 지표 표시)은 충족됨.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `update-timestamp.tsx` | 62 | `return null` | INFO | 의도적 hydration 안전 패턴 — SSR에서 null 반환 후 클라이언트 마운트 후 실제 렌더. 스텁 아님 |

---

### Human Verification Required

#### 1. sticky 헤더 동작 확인

**Test:** `npm run dev` 실행 후 `/dashboard` 접속, Daily 탭에서 충분한 행이 있을 때 세로 스크롤
**Expected:** 날짜/매출/GPM 등 헤더 행이 화면 상단에 고정된 채 데이터 행만 스크롤됨
**Why human:** `sticky top-0`은 코드상 존재하나, `overflow-x-auto` div 컨테이너 내부에 있어 CSS stacking context 문제로 sticky가 무효화될 수 있음 — 브라우저 렌더링으로만 확인 가능

#### 2. GPM 음수 시각 구분 확인

**Test:** 실제 데이터(또는 mock-data)에 GPM 음수가 있는 경우, Daily 테이블에서 해당 셀 확인
**Expected:** GPM이 음수인 경우(매출보다 손익이 클 때) 시각적으로 구분되어 표시됨
**Why human:** 코드상 GPM 추이 하락에는 text-red-600이 적용되지만 GPM 값 자체의 음수 처리 조건이 없음 — 실제 음수 데이터로만 확인 가능

---

### Build Status

빌드 결과: **PASSED**
```
Route (app)
├ ƒ /dashboard
├ ƒ /login
└ ○ /
TypeScript 에러: 0건
```

### Commit Verification

| Commit | Description | Status |
|--------|-------------|--------|
| `7d1b58a` | feat(04-01): DataTable Server Component 구현 | EXISTS |
| `8cc0940` | feat(04-01): DataTableSkeleton 구현 | EXISTS |
| `a648973` | feat(04-02): UpdateTimestamp Client Component 구현 | EXISTS |
| `acb6512` | feat(04-03): page.tsx에 DataTable + UpdateTimestamp 통합 | EXISTS |
| `a18e761` | feat(04-03): 손익 → GPM 전환 및 시트 파싱 구조 개선 | EXISTS |
| `25265b4` | fix: 콘솔 경고 9개 수정 | EXISTS |

---

### Gaps Summary

자동 검증에서 **차단 갭은 없음**. 전체 아티팩트가 존재하고, 실질적이며(스텁 없음), 연결됨.

두 가지 불확실 항목이 있으며 브라우저 확인이 필요하다:

1. **sticky 헤더**: `overflow-x-auto` 래퍼와 `sticky top-0` 조합이 브라우저에서 올바르게 작동하는지 — CSS만으로 검증 불가.

2. **GPM 음수 처리**: GPM 추이 색상(하락 시 빨간색)은 구현됐으나 GPM 값 자체가 음수일 때의 별도 시각 처리가 코드상 없음. 원래 플랜의 "손익 음수 빨간색 텍스트" 요구사항이 GPM 전환 이후 명확히 대응되지 않음.

TABLE-01 요구사항의 "손익" 컬럼이 GPM으로 대체된 것은 사용자 승인된 의도적 결정이며, 요구사항의 본질(이익 지표 가시화)은 충족됨. REQUIREMENTS.md 텍스트 업데이트는 Phase 5(final polish)에서 처리 가능.

---

_Verified: 2026-02-24T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
