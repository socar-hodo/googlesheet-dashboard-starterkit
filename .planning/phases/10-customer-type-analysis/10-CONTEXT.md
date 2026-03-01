# Phase 10: Customer Type Analysis - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

대시보드에 왕복/부름/편도 이용건수를 도넛 차트(비율 분포)와 스택 바 추이 차트(시간별 변화)로 표시한다.
기존 기간 필터 토글(이번 주/지난 주/이번 달/지난 달)과 연동되어 즉시 갱신된다.
데이터는 Phase 9에서 완성된 `customerTypeDaily` / `customerTypeWeekly` 배열을 사용한다.

</domain>

<decisions>
## Implementation Decisions

### 차트 배치
- 기존 4개 차트(`ChartsSection`) 아래에 추가
- 도넛(좌) + 스택 바 추이(우) 좌우 나란히 — 같은 행, CSS grid 또는 flex
- 각 차트에 개별 제목 (`Card > CardTitle` 패턴 유지)
  - 도넛: "고객 유형 분포"
  - 추이: "유형별 이용건수 추이"

### 추이 차트 타입
- 스택 바 (누적) — 3색 바가 누적되어 전체 총건수 + 각 유형 비율을 한 바로 파악
- X축 레이블: 기존 차트와 동일한 포맷 — 일별 `2/1`, 주차별 `1주`
- Y축: `건` 단위 표시 (예: `0건`, `10건`, `20건`)
- 툴팁: 왕복 N건, 부름 N건, 편도 N건, 합계 N건

### 도넛 차트 정보
- 중앙 텍스트: 총 이용건수 (예: `총 78건`)
- 조각 레이블 없음 — 범례(Legend)로만 유형명 표시
- 툴팁: 유형명 + 건수 + 비율 (예: `왕복: 45건 (58%)`)
- innerRadius: 60~70% (중앙 공간 충분히 확보)

### 색상 체계
- globals.css에 `--chart-3`, `--chart-4`, `--chart-5` CSS 변수 확장 (다크모드 포함)
- chart-colors.ts에 `chart3`, `chart4`, `chart5` 필드 추가
- 매핑 (도넛·스택 바 동일한 순서): 왕복=chart1(파랑), 부름=chart2(녹색), 편도=chart3(주황)

### Claude's Discretion
- 도넛 `innerRadius` 정확한 px 값
- 좌우 배치 grid 컬럼 비율 (도넛:추이 = 1:2 또는 1:1.5 등)
- 스택 바 `radius` prop 값
- 반응형 브레이크포인트 처리 (모바일에서 위아래로 전환 여부)

</decisions>

<specifics>
## Specific Ideas

- 색상 직관: 왕복=파랑(안정/반복), 부름=녹색(동적), 편도=주황(볼류없는)
- 두 차트가 같은 행에 나란히 있어 "지금 비율이 어떤지"(도넛)와 "추이가 어떻게 변하는지"(스택 바)를 동시에 파악 가능

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/dashboard/charts/chart-colors.ts`: 기존 `ChartColorMode` 인터페이스에 `chart3`, `chart4`, `chart5` 필드 추가 필요
- `components/dashboard/charts/charts-section.tsx`: `space-y-6` 안에 새 컴포넌트 추가 — `CustomerTypeSection` 또는 개별 두 컴포넌트
- `components/ui/card.tsx`: `Card > CardHeader > CardTitle + CardContent` 패턴 — 기존 4개 차트와 동일하게 사용
- `getChartColors(isDark)`: 새 컴포넌트에서 그대로 호출
- `types/dashboard.ts` `CustomerTypeRow`: `roundTripCount`, `callCount`, `oneWayCount`, `date?`, `week?` — Phase 9 완성

### Established Patterns
- 모든 차트 컴포넌트: `"use client"`, `useTheme()` + `getChartColors(resolvedTheme === 'dark')`
- Recharts: `ResponsiveContainer > [차트타입]`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend`
- 도넛 차트: Recharts `PieChart > Pie` (`innerRadius` 지정으로 도넛)
- 기간 필터: `DashboardContent`가 `filteredData`를 하위로 전달 — 신규 컴포넌트는 `data.customerTypeDaily` 또는 `data.customerTypeWeekly`를 `tab` prop으로 분기해 수신

### Integration Points
- `ChartsSection` props: `data: TeamDashboardData`, `tab: 'daily' | 'weekly'`
- `filteredData.customerTypeDaily` / `filteredData.customerTypeWeekly`가 기간 필터 적용 완료 상태로 전달됨
- `app/globals.css` `@theme`: `--chart-3 ~ --chart-5` oklch 값 라이트/다크 추가

</code_context>

<deferred>
## Deferred Ideas

없음 — 논의가 Phase 10 스코프 내에서 진행됨.

</deferred>

---

*Phase: 10-customer-type-analysis*
*Context gathered: 2026-03-01*
