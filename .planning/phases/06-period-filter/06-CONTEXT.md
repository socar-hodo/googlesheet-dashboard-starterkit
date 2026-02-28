# Phase 6: Period Filter - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning
**Source:** /gsd:discuss-phase 6

<domain>
## Phase Boundary

기간 선택기 UI를 대시보드에 추가하고, 클라이언트 사이드에서 전체 Sheets 데이터를 필터링해 KPI 카드, 차트 4종, 데이터 테이블에 반영한다. URL searchParams로 기간 상태를 저장해 공유/새로고침 시 유지된다.

</domain>

<decisions>
## Implementation Decisions

### 필터링 방식
- **클라이언트 사이드 필터링** — Sheets API는 기존대로 전체 데이터 한 번 로드, React 상태로 기간 필터링
- 서버 재페칭 없음 — 기존 서버 컴포넌트 구조 변경 최소화
- 필터 로직은 클라이언트 컴포넌트(현재 dashboard-tabs.tsx 등)에서 처리

### Daily 탭 기간 옵션
- 4개 토글: **이번 주 / 지난 주 / 이번 달 / 지난 달**
- 기본값: 이번 달 (또는 전체 — 기존 동작 유지)

### Weekly 탭 기간 옵션
- 2개 토글: **이번 달 / 지난 달**
- Weekly는 주차별 데이터라 월 단위 필터가 자연스러움

### UI 위치
- **대시보드 탭 오른쪽** (헤더 오른쪽에 버튼 그룹)
- 탭 전환 버튼(Daily/Weekly)과 같은 줄, 오른쪽 정렬
- shadcn/ui Button 컴포넌트 (variant="outline", 활성 시 variant="default") 사용

### URL 상태 저장
- URL searchParams에 period 파라미터 추가 (예: ?tab=daily&period=this-month)
- 기존 탭 searchParams(?tab=) 패턴과 동일하게 처리

### Loading UX
- 필터 변경 시 데이터가 즉시 클라이언트에서 필터링되므로 별도 로딩 상태 불필요
- 단, 초기 페이지 로드 시 기존 스켈레튼 그대로 유지

### Claude's Discretion
- 기간 계산 로직 구현 (이번 주 = 월~일, 이번 달 = 1일~말일 등 한국 기준)
- Daily 탭 기본 기간 (전체 vs 이번 달)
- 데이터가 없는 기간 선택 시 빈 상태 처리

</decisions>

<specifics>
## Specific Ideas

- Daily 탭 "이번 주": 현재 주의 월요일부터 오늘까지 (ISO 주차 기준)
- Daily 탭 "이번 달": 현재 월 1일부터 오늘까지
- Weekly 탭 "이번 달": 시작일이 현재 월에 속하는 주차들
- 기간 버튼 UI: `<div className="flex gap-1">` 안에 shadcn Button 나열
- 기존 `DashboardTabs` 클라이언트 컴포넌트에 period state 추가

</specifics>

<deferred>
## Deferred Ideas

- 사용자 지정 날짜 범위 (달력 피커) — v2 요구사항
- Daily 탭의 "전체" 옵션 (현재 동작) — 필요 시 추가 검토

</deferred>

---

*Phase: 06-period-filter*
*Context gathered: 2026-03-01 via /gsd:discuss-phase 6*
