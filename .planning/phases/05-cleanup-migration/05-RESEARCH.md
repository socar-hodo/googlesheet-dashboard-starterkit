# Phase 5: Cleanup + Migration - Research

**Researched:** 2026-02-24
**Domain:** Next.js 컴포넌트 삭제 및 빌드 검증 (dead code removal)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**삭제 범위**
- `components/dashboard/revenue-chart.tsx` 삭제
- `components/dashboard/category-chart.tsx` 삭제
- `components/dashboard/recent-orders-table.tsx` 삭제
- `lib/` 파일(data.ts, sheets.ts 등)은 건드리지 않는다
- `components/ui/` shadcn 컴포넌트는 유지
- `lib/mock-data.ts`는 이미 팀 전용 타입만 사용 중 → 정리 불필요 (Claude 판단)

**Dead code 감사**
- 타겟: 위 3개 컴포넌트 파일만
- 프로젝트 전체 dead code 감사는 하지 않는다
- TODO(Phase 5) 주석은 3개 파일 내에만 존재 → 파일 삭제 시 자동 해결
- 다른 파일에 TODO(Phase 5) 주석이 발견되면 주석 줄만 제거, 코드 블록은 유지

**빌드 검증**
- `npm run build` 한 번 실행으로 검증
- 실패 시: 에러 메시지 분석 후 누락된 import 참조 또는 실수를 찾아 수정
- 빌드 성공 = Phase 5 완료 기준 충족

### Claude's Discretion

- 삭제 순서 (어떤 파일을 먼저 지울지)
- 커밋 단위 분리 여부 (한 커밋 vs 파일별 커밋)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-04 | 기존 스타터킷 범용 컴포넌트(revenue-chart, category-chart, recent-orders-table)를 삭제하고 팀 전용 컴포넌트로 교체한다 | 삭제 대상 파일 3개 확인, import 참조 없음 확인, 빌드 성공 기준 확립 |
</phase_requirements>

## Summary

Phase 5는 코드 삭제 작업이다. 새 기능을 작성하지 않는다. 스타터킷에서 가져온 범용 컴포넌트 3개(`revenue-chart.tsx`, `category-chart.tsx`, `recent-orders-table.tsx`)를 파일시스템에서 삭제하고, 빌드가 성공하는 것을 확인한다.

**현재 상태 (연구를 통해 확인):** 3개 파일 모두 `TODO(Phase 5)` 주석이 있으며, 어떤 다른 파일에서도 이 컴포넌트들을 import하지 않는다. `app/(dashboard)/dashboard/page.tsx`는 팀 전용 컴포넌트(`KpiCards`, `ChartsSection`, `DataTable`, `UpdateTimestamp`)만 import한다. 현재 `npm run build`는 성공한다. 즉, 삭제만 하면 바로 UX-04 조건이 충족된다.

**Primary recommendation:** 3개 파일을 삭제하고 `npm run build`로 검증한다. 예상 소요 시간: 5분 미만.

## Standard Stack

### Core

| 도구 | 버전 | 목적 | 이유 |
|------|------|------|------|
| Next.js | 16.1.6 | 빌드 검증 (`npm run build`) | 프로젝트 프레임워크 |
| TypeScript | 5 | 컴파일 타임 import 오류 검출 | `npm run build` 내 TypeScript 검사 포함 |

### 삭제 도구

| 방법 | 내용 |
|------|------|
| `git rm` | 파일 삭제 + git 스테이징 동시 처리 |
| 직접 파일 삭제 후 `git add` | 동일한 결과, 순서만 다름 |

**설치 불필요:** 이 Phase는 새 패키지를 설치하지 않는다.

## Architecture Patterns

### 현재 컴포넌트 구조 (연구로 확인)

```
components/dashboard/
├── category-chart.tsx        ← 삭제 대상 (레거시 스타터킷)
├── recent-orders-table.tsx   ← 삭제 대상 (레거시 스타터킷)
├── revenue-chart.tsx         ← 삭제 대상 (레거시 스타터킷)
├── charts/
│   ├── charts-section.tsx    ← 유지 (팀 전용)
│   ├── charts-skeleton.tsx   ← 유지 (팀 전용)
│   ├── profit-trend-chart.tsx  ← 유지 (팀 전용)
│   ├── revenue-trend-chart.tsx ← 유지 (팀 전용)
│   ├── usage-trend-chart.tsx   ← 유지 (팀 전용)
│   └── utilization-trend-chart.tsx ← 유지 (팀 전용)
├── data-table.tsx            ← 유지 (팀 전용)
├── data-table-skeleton.tsx   ← 유지 (팀 전용)
├── kpi-card.tsx              ← 유지 (팀 전용)
├── kpi-cards.tsx             ← 유지 (팀 전용)
├── kpi-cards-skeleton.tsx    ← 유지 (팀 전용)
├── tab-nav.tsx               ← 유지 (팀 전용)
└── update-timestamp.tsx      ← 유지 (팀 전용)
```

### Pattern 1: import 참조 없는 파일 삭제

**What:** 삭제 대상 3개 파일이 현재 어디서도 import되지 않는다는 사실이 연구로 확인됨.

**현재 page.tsx import 목록 (확인됨):**
```typescript
// app/(dashboard)/dashboard/page.tsx — 팀 전용 컴포넌트만 import
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { KpiCardsSkeleton } from '@/components/dashboard/kpi-cards-skeleton';
import { TabNav } from '@/components/dashboard/tab-nav';
import { ChartsSection } from '@/components/dashboard/charts/charts-section';
import { ChartsSkeleton } from '@/components/dashboard/charts/charts-skeleton';
import { DataTable } from '@/components/dashboard/data-table';
import { DataTableSkeleton } from '@/components/dashboard/data-table-skeleton';
import { UpdateTimestamp } from '@/components/dashboard/update-timestamp';
```

`RevenueChart`, `CategoryChart`, `RecentOrdersTable`는 위 목록에 없다. 삭제해도 참조 오류가 발생하지 않는다.

### Pattern 2: TODO(Phase 5) 주석 위치

**What:** 프로젝트 전체 grep 결과, `TODO(Phase 5)` 주석은 삭제 대상 3개 파일 내에만 존재한다.

```
components/dashboard/category-chart.tsx:14
components/dashboard/recent-orders-table.tsx:13
components/dashboard/revenue-chart.tsx:15
```

파일을 삭제하면 주석도 함께 사라진다. 다른 파일에서 주석을 별도로 제거할 필요가 없다.

### Pattern 3: 빌드 기준선

**What:** 삭제 전 현재 빌드 상태가 성공임을 확인함.

```
▲ Next.js 16.1.6 (Turbopack)
✓ Compiled successfully in 16.5s
✓ Generating static pages using 11 workers (6/6)
```

삭제 후 동일한 출력이 나오면 Phase 5 완료.

### Anti-Patterns to Avoid

- **파일 삭제 후 다른 코드를 수정하는 행위:** 이 Phase는 삭제 전용이다. lib/data.ts, mock-data.ts, 다른 컴포넌트에 손을 대지 않는다.
- **범위 확장:** "어차피 정리하는 김에" 다른 파일도 정리하는 행위. 스코프를 3개 파일 삭제로 엄격히 제한한다.
- **barrel index 파일 확인 불필요:** `components/dashboard/` 하위에 index.ts/tsx 배럴 파일이 없음을 확인함 — re-export로 인한 숨겨진 참조 없음.

## Don't Hand-Roll

| 문제 | 하지 말 것 | 대신 사용 | 이유 |
|------|------------|-----------|------|
| 빌드 검증 | 수동으로 TypeScript 오류 찾기 | `npm run build` | Next.js 빌드가 TypeScript + 미사용 import를 모두 검사 |

**Key insight:** 이 Phase에서 "직접 만들" 것이 없다. 삭제만 하고 빌드로 검증한다.

## Common Pitfalls

### Pitfall 1: 삭제 전 import 참조 확인 생략

**What goes wrong:** 파일을 삭제했는데 빌드 오류가 발생 — 어딘가에 import가 남아 있음.

**Why it happens:** 직접 눈으로 찾으려 해서.

**How to avoid:** 이미 연구 단계에서 grep으로 확인 완료. `components/dashboard/revenue-chart`, `category-chart`, `recent-orders-table`를 import하는 파일이 없음. 그래도 확신이 필요하면 삭제 전 한 번 더 grep 실행:
```bash
grep -r "revenue-chart\|category-chart\|recent-orders-table\|RevenueChart\|CategoryChart\|RecentOrdersTable" --include="*.tsx" --include="*.ts" .
```

**Warning signs:** grep 결과에 삭제 대상 파일 외의 파일이 나오면 그 파일의 import를 먼저 제거해야 한다.

### Pitfall 2: TypeScript 빌드 vs lint만 실행

**What goes wrong:** `npm run lint`만 실행하면 import 오류가 감지되지 않을 수 있음.

**Why it happens:** lint와 build가 다른 체크를 수행.

**How to avoid:** 반드시 `npm run build`를 실행한다. 빌드가 TypeScript 타입 검사와 참조 무결성 모두 검증한다.

### Pitfall 3: lib/mock-data.ts의 레거시 타입 혼동

**What goes wrong:** mock-data.ts에 레거시 스타터킷 타입이 남아 있을 것이라 오해하고 수정을 시도함.

**Why it happens:** Phase 1에서 이미 팀 전용 타입으로 교체 완료됨.

**How to avoid:** CONTEXT.md 결정 준수: `lib/mock-data.ts`는 이미 팀 전용 타입만 사용 — 정리 불필요.

## Code Examples

### 삭제 명령어

```bash
# 3개 파일 삭제 (git rm으로 삭제 + 스테이징 동시)
git rm components/dashboard/revenue-chart.tsx
git rm components/dashboard/category-chart.tsx
git rm components/dashboard/recent-orders-table.tsx
```

또는 한 번에:
```bash
git rm components/dashboard/revenue-chart.tsx \
       components/dashboard/category-chart.tsx \
       components/dashboard/recent-orders-table.tsx
```

### 삭제 전 참조 확인 (선택사항 — 연구에서 이미 확인됨)

```bash
grep -r "RevenueChart\|CategoryChart\|RecentOrdersTable\|revenue-chart\|category-chart\|recent-orders-table" \
  --include="*.tsx" --include="*.ts" \
  components/ app/ lib/ \
  | grep -v "^components/dashboard/revenue-chart.tsx" \
  | grep -v "^components/dashboard/category-chart.tsx" \
  | grep -v "^components/dashboard/recent-orders-table.tsx"
# 결과: 없음 (정상)
```

### 빌드 검증

```bash
npm run build
# 기대 출력:
# ✓ Compiled successfully
# ✓ Generating static pages (6/6)
```

## State of the Art

| 이전 상태 | 현재 상태 | 변경 시점 | 영향 |
|-----------|-----------|-----------|------|
| revenue-chart.tsx: 스타터킷 월별 매출 라인 차트 | 삭제 | Phase 5 | charts/revenue-trend-chart.tsx가 대체 |
| category-chart.tsx: 스타터킷 파이 차트 | 삭제 | Phase 5 | charts/profit-trend-chart.tsx 등이 대체 |
| recent-orders-table.tsx: 스타터킷 주문 테이블 | 삭제 | Phase 5 | data-table.tsx가 대체 |

**완료된 선행 작업 (Phase 1~4):**
- Phase 1: 범용 타입(KpiData, MonthlyRevenue, CategoryDistribution, RecentOrder) 삭제, 팀 전용 타입으로 교체
- Phase 3: 팀 전용 차트 컴포넌트 4개 신규 작성 (charts/ 디렉토리)
- Phase 4: 팀 전용 데이터 테이블 신규 작성 (data-table.tsx)
- 현재: 레거시 파일만 파일시스템에 남아 있고, 어디서도 사용되지 않음

## Open Questions

없음. 현재 상태가 완전히 파악되었다:
- 삭제 대상 3개 파일 확인 완료
- 해당 파일에 대한 import 참조 없음 확인 완료
- 현재 빌드 성공 확인 완료
- lib/, components/ui/ 등 유지 대상 확인 완료

## Sources

### Primary (HIGH confidence)

- 직접 코드베이스 분석: `grep` 실행으로 import 참조 없음 확인
- 직접 코드베이스 분석: `find` 실행으로 파일 구조 확인
- `npm run build` 실행: 빌드 성공 기준선 확인
- `app/(dashboard)/dashboard/page.tsx` 직접 읽기: 팀 전용 import만 존재 확인
- 3개 삭제 대상 파일 직접 읽기: TODO(Phase 5) 주석 위치 확인

### Secondary (MEDIUM confidence)

없음 — 이 Phase는 외부 라이브러리 연구가 필요하지 않다.

## Metadata

**Confidence breakdown:**
- 삭제 대상 파일 목록: HIGH — 직접 확인
- Import 참조 부재: HIGH — grep으로 직접 확인
- 빌드 성공 기준선: HIGH — 직접 실행 확인
- 삭제 후 빌드 성공 예상: HIGH — 참조가 없으므로 당연한 결과

**Research date:** 2026-02-24
**Valid until:** 즉시 실행 가능 (상태가 확인됨)
