# Phase 8: Sparkline - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

5개 KPI 카드 각각에 최근 데이터 추이를 보여주는 미니 스파크라인 차트를 추가한다.
다크/라이트 테마 전환에 모두 대응해야 하며, 기존 카드 레이아웃(달성률, 프로그레스 바, 델타)을 깨뜨리지 않는다.
새로운 KPI 항목 추가나 새로운 데이터 소스 연결은 이 phase 밖의 범위이다.

</domain>

<decisions>
## Implementation Decisions

### 데이터 포인트 수
- 탭 연동 방식: daily 탭에서는 최근 7일, weekly 탭에서는 최근 8주 표시
- `kpi-cards.tsx`에 이미 정렬된 배열(`sorted`)이 있으므로 끝에서 N개 slice로 추출
- 데이터가 N개 미만이면 있는 것만 표시 (오류 없이 graceful 처리)

### 차트 유형 & 배치
- Recharts `AreaChart` + `ResponsiveContainer` 사용 (라이브러리 이미 설치됨)
- 높이: 40px, 축/라벨/툴팁 없음 — 순수 트렌드 시각화
- 배치: `CardContent` 하단, `deltaText` 아래에 추가
- `KpiCard` 컴포넌트에 `sparklineData?: number[]` prop 추가

### 색상 & 테마 대응
- 단일 색상: `var(--chart-1)` CSS 변수 사용 (다크/라이트 자동 전환됨)
- 영역 채우기: stroke는 `var(--chart-1)`, fill은 같은 색에 낮은 투명도
- Recharts SVG에서 CSS 변수 직접 사용 (`stroke="var(--chart-1)"`)

### Claude's Discretion
- 정확한 stroke width, fill opacity 값
- `ResponsiveContainer` width/height 세부 조정
- Weekly 탭 매출 카드(달성률 + 프로그레스 바 있음)에서의 수직 간격 처리
- Area gradient 여부 (단색 fill vs `<defs><linearGradient>` 그라디언트)

</decisions>

<specifics>
## Specific Ideas

- 축, 툴팁, 라벨 없음 — 완전히 미니멀한 트렌드 선
- 스파크라인 데이터는 `kpi-cards.tsx`에서 이미 정렬된 배열을 slice해서 전달
- 새로운 API 호출 불필요 — 기존 `TeamDashboardData`에서 파생

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/dashboard/kpi-card.tsx`: 스파크라인 prop 추가 대상, CardContent에 삽입
- `components/dashboard/kpi-cards.tsx`: 이미 `sorted` daily/weekly 배열 존재 — slice로 데이터 추출
- `recharts` 3.7.0: `AreaChart`, `Area`, `ResponsiveContainer` 이미 설치됨 (revenue-chart.tsx에서 사용 중)
- `app/globals.css`: `--chart-1`~`--chart-5` CSS 변수, 다크모드에서 자동 전환

### Established Patterns
- Client Component: Recharts 컴포넌트는 `"use client"` 필수 — `kpi-card.tsx`가 이미 `'use client'` 선언됨
- CSS 변수 테마: SVG에서 `stroke="var(--chart-1)"` 직접 사용하는 패턴 (revenue-chart.tsx 참조)
- prop drilling: `kpi-cards.tsx` → `KpiCard` 컴포넌트로 계산된 값 전달하는 기존 패턴 유지

### Integration Points
- `kpi-card.tsx`에 `sparklineData?: number[]` prop 추가
- `kpi-cards.tsx`에서 각 KPI 필드별 값 배열 추출해서 전달
  - 매출: `sorted.map(d => d.revenue).slice(-N)`
  - GPM: `sorted.map(d => d.revenue > 0 ? d.profit/d.revenue*100 : 0).slice(-N)`
  - 이용건수, 가동률, 이용시간: 각 필드 동일 패턴

</code_context>

<deferred>
## Deferred Ideas

없음 — 토론이 AskUserQuestion 응답 문제로 제한되어 기본값으로 결정됨.
사용자가 이 파일을 직접 편집해 다른 선택(차트 유형, 데이터 포인트 수, 색상 전략 등)을 지정할 수 있음.

</deferred>

---

*Phase: 08-sparkline*
*Context gathered: 2026-03-01*
