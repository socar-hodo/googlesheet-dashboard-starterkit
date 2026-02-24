# Phase 5: Cleanup + Migration - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

스타터킷에서 가져온 범용 컴포넌트 3개(revenue-chart, category-chart, recent-orders-table)를 삭제하고, 대시보드가 팀 전용 컴포넌트만으로 정상 동작하는 것을 빌드로 검증한다. 새 기능 추가나 리팩터링은 이 Phase의 범위가 아니다.

</domain>

<decisions>
## Implementation Decisions

### 삭제 범위
- `components/dashboard/revenue-chart.tsx` 삭제
- `components/dashboard/category-chart.tsx` 삭제
- `components/dashboard/recent-orders-table.tsx` 삭제
- `lib/` 파일(data.ts, sheets.ts 등)은 건드리지 않는다
- `components/ui/` shadcn 컴포넌트는 유지
- `lib/mock-data.ts`는 이미 팀 전용 타입만 사용 중 → 정리 불필요 (Claude 판단)

### Dead code 감사
- 타겟: 위 3개 컴포넌트 파일만
- 프로젝트 전체 dead code 감사는 하지 않는다
- TODO(Phase 5) 주석은 3개 파일 내에만 존재 → 파일 삭제 시 자동 해결
- 다른 파일에 TODO(Phase 5) 주석이 발견되면 주석 줄만 제거, 코드 블록은 유지

### 빌드 검증
- `npm run build` 한 번 실행으로 검증
- 실패 시: 에러 메시지 분석 후 누락된 import 참조 또는 실수를 찾아 수정
- 빌드 성공 = Phase 5 완료 기준 충족

### Claude's Discretion
- 삭제 순서 (어떤 파일을 먼저 지울지)
- 커밋 단위 분리 여부 (한 커밋 vs 파일별 커밋)

</decisions>

<specifics>
## Specific Ideas

각 컴포넌트 파일 내부에 `// TODO(Phase 5): 이 파일은 레거시 스타터킷 컴포넌트로 Phase 5에서 삭제 예정` 주석이 달려 있어 정확한 삭제 대상이 명확하다.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-cleanup-migration*
*Context gathered: 2026-02-24*
