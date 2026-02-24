# Phase 3: Chart Components - Research

**Researched:** 2026-02-24
**Domain:** Recharts 3 (ComposedChart, BarChart, LineChart, ReferenceLine, dual Y-axis, dark/light theming)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**차트 레이아웃 배치**
- KPI 카드 아래 **1열** 배치 (세로로 나열)
- Daily/Weekly 탭 모두 동일한 차트 4종 표시 (데이터만 달라짐)
- 각 차트 위에 제목 표시 (예: '매출 추이', '손익 추이')
- Daily 차트는 **최근 30일** 데이터 기준 (데이터가 적으면 있는 만큼)

**차트별 시각 스타일**
- **매출 차트**: 실적 Bar는 `--chart-1` CSS 변수(테마 포인트 색상) 사용. Weekly에서만 목표 Line 추가 표시 (Daily에서는 Line 숨김)
- **손익 차트**: 양수(+) 녹색, 음수(-) 빨간색 Bar — KPI 카드 델타 색상과 일관성 유지
- **가동률 차트**: 라인 차트 + **주황 점선** 임계선 (80% 위치). Recharts `ReferenceLine` 사용
- **이용건수/이용시간 차트**: **이중 Bar** — 이용건수(좌 Y축) / 이용시간(우 Y축)으로 구분

**Daily/Weekly 탭 분기**
- **단일 컴포넌트**에 `tab` prop으로 Daily/Weekly 분기 — `KpiCards`와 동일한 패턴
- X축 레이블: Daily = 일자(M/D 형식, 예: 2/1), Weekly = 주차(예: 1주, 2주)
- Weekly 매출 차트에만 목표 Line 표시, Daily에서는 숨김

**차트 인터랙션**
- **툴팁**: 수치 + 단위만 표시 (예: '실적: ₩6,950만', '가동률: 87%')
- **애니메이션**: Recharts 기본 애니메이션(로드 시 페이드인)만 사용 — 추가 구현 없음
- **로딩 스켈레턴**: KPI 카드와 동일한 Suspense 패턴으로 탭 전환 시 스켈레턴 표시
- **클릭 이벤트**: 없음 (툴팁만으로 충분. 세부 드릴다운은 Phase 4 데이터 테이블 담당)

### Claude's Discretion
- 개별 차트 컴포넌트 파일 분리 방식 (1파일 vs 여러 파일)
- 이중 Bar Y축 레이블 포맷
- 툴팁 내부 레이아웃 및 스타일
- 스켈레턴 높이/형태
- Recharts ResponsiveContainer 높이값

### Deferred Ideas (OUT OF SCOPE)
- 날짜 범위 필터 (이번 주/지난 주/이번 달) — v2 FILT-01
- 차트 클릭 시 해당 날짜 데이터 드릴다운 — Phase 4 이후
- 미니 스파크라인 KPI 카드 내 삽입 — v2 ECHRT-01
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHART-01 | 매출 추이 차트 — 기간별 실적 Bar와 목표 Line을 오버레이하여 표시한다 | ComposedChart + Bar + Line 패턴으로 구현. Weekly에서만 Line 표시, Daily는 Bar만 |
| CHART-02 | 손익 추이 차트 — 수익(양수)은 파란색, 손실(음수)은 빨간색으로 구분된 Bar 차트로 표시한다 | Cell 컴포넌트 + 조건부 fill 색상으로 구현 (per-bar color). CONTEXT.md에서 녹색/빨간색으로 확정 |
| CHART-03 | 가동률 추이 차트 — 기간별 가동률(%) 라인 차트로 표시하며 임계값 기준선을 표시한다 | LineChart + ReferenceLine(y=80, 주황 점선)으로 구현 |
| CHART-04 | 이용건수/이용시간 차트 — 두 지표의 기간별 추이를 차트로 표시한다 | ComposedChart 또는 BarChart + 이중 YAxis (yAxisId="left"/"right"). Bar 두 개 각각 yAxisId 지정 |
| CHART-05 | 모든 차트가 다크/라이트 테마에서 올바른 색상으로 렌더링된다 | 핵심 함수: CSS 변수는 SVG fill/stroke 속성에 직접 작동하지 않음 — getChartColors() 헬퍼 또는 하드코딩된 색상 객체로 해결 |
</phase_requirements>

---

## Summary

Phase 3는 Recharts 3.x를 사용해 4종 차트 컴포넌트를 구현하는 단계다. 모든 차트는 `"use client"` Client Component이며, 데이터는 Server Component(page.tsx)에서 내려받은 `TeamDashboardData`를 prop으로 수신한다. 이 패턴은 Phase 2 `KpiCards`와 동일하다.

가장 중요한 기술적 난관은 **테마 색상 처리**다. Recharts SVG 엘리먼트의 `fill`/`stroke` 속성에 `var(--chart-1)` 같은 CSS 변수를 직접 쓰면 브라우저에서 무시되어 검은색/흰색으로 렌더링된다. 기존 `category-chart.tsx`도 이를 인지하고 HSL 하드코딩 값을 사용 중이다. 해결책은 라이트/다크 모드용 색상 값을 별도 상수로 정의하고, `useTheme()` 훅으로 현재 테마를 감지하여 분기하는 패턴이다.

4개 차트의 Recharts 컴포넌트 조합: (1) 매출 — `ComposedChart + Bar + Line`, (2) 손익 — `BarChart + Bar + Cell`, (3) 가동률 — `LineChart + Line + ReferenceLine`, (4) 이용건수/이용시간 — `BarChart + Bar×2 + YAxis×2`. 이 모두는 Recharts 3.x에서 공식 지원된다.

**Primary recommendation:** 각 차트를 별도 Client Component 파일로 분리하고, 테마 색상은 `getChartColors(isDark: boolean)` 헬퍼로 중앙 관리하라. 공통 스켈레턴은 `ChartsSkeleton` 단일 컴포넌트로 KPI 카드 아래 4개 차트 영역을 모방한다.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^3.7.0 (installed) | 차트 컴포넌트 — ComposedChart, BarChart, LineChart, ReferenceLine, Cell, YAxis×2 | 이미 package.json에 설치됨. Recharts 3에서 이중 YAxis, ReferenceLine, ComposedChart 모두 공식 지원 |
| next-themes | ^0.4.6 (installed) | `useTheme()` 훅으로 현재 테마 감지 | Recharts SVG에 테마별 색상을 조건부 적용할 때 필수. 이미 설치됨 |
| react | 19.2.3 (installed) | Client Component 렌더링 | 이미 설치됨 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Card | installed | 차트 카드 래퍼 (CardHeader + CardTitle + CardContent) | 모든 차트 컴포넌트의 외부 컨테이너 |
| shadcn/ui Skeleton | installed | 로딩 스켈레턴 | `ChartsSkeleton` 컴포넌트 구현 시 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts (installed) | Chart.js, Victory | 이미 설치됨 — 대안 탐색 불필요 |
| next-themes useTheme() | CSS media query only | useTheme()가 코드에서 조건 분기 가능 — SVG 색상 분기를 위해 필수 |
| 별도 파일 분리 | 단일 큰 파일 | Claude's Discretion 항목 — 별도 파일 권장 (관심사 분리, 테스트 용이) |

**Installation:** 추가 설치 불필요 — 모든 의존성이 이미 package.json에 존재함.

---

## Architecture Patterns

### Recommended Project Structure

```
components/dashboard/
├── charts/                         # 차트 컴포넌트 디렉토리 (신규)
│   ├── revenue-trend-chart.tsx     # CHART-01: 매출 추이 (ComposedChart)
│   ├── profit-trend-chart.tsx      # CHART-02: 손익 추이 (BarChart + Cell)
│   ├── utilization-trend-chart.tsx # CHART-03: 가동률 추이 (LineChart + ReferenceLine)
│   ├── usage-trend-chart.tsx       # CHART-04: 이용건수/이용시간 (BarChart + dual YAxis)
│   ├── charts-section.tsx          # 래퍼: 4개 차트를 세로로 나열 (Server Component)
│   ├── charts-skeleton.tsx         # Suspense fallback 스켈레턴 (Server Component)
│   └── chart-colors.ts             # 테마별 색상 상수 (공유 헬퍼)
```

**파일 분리 근거 (Claude's Discretion 결정):**
- 각 차트는 독립적인 Recharts 컴포넌트 조합을 사용 — 파일 분리가 가독성 향상
- 개별 차트만 수정/교체 가능 (Phase 4 이후 확장 대비)
- `charts-section.tsx`가 4개를 조합 → page.tsx는 단일 진입점만 참조

### Pattern 1: Server → Client 데이터 전달 (KpiCards와 동일)

```typescript
// charts-section.tsx (Server Component — "use client" 없음)
import type { TeamDashboardData } from '@/types/dashboard';
import { RevenueTrendChart } from './revenue-trend-chart';
import { ProfitTrendChart } from './profit-trend-chart';
import { UtilizationTrendChart } from './utilization-trend-chart';
import { UsageTrendChart } from './usage-trend-chart';

interface ChartsSectionProps {
  data: TeamDashboardData;
  tab: 'daily' | 'weekly';
}

export function ChartsSection({ data, tab }: ChartsSectionProps) {
  const records = tab === 'daily'
    ? [...data.daily].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
    : data.weekly;

  return (
    <div className="space-y-6">
      <RevenueTrendChart records={records} tab={tab} />
      <ProfitTrendChart records={records} tab={tab} />
      <UtilizationTrendChart records={records} tab={tab} />
      <UsageTrendChart records={records} tab={tab} />
    </div>
  );
}
```

**핵심:** ChartsSection은 Server Component. 개별 차트 파일만 `"use client"` 선언.

### Pattern 2: 테마 색상 헬퍼 (CHART-05 핵심)

Recharts SVG의 `fill`/`stroke` prop에는 CSS 변수가 직접 작동하지 않는다 (브라우저 SVG 속성 파싱 제한). 기존 `category-chart.tsx`도 이 이유로 HSL 하드코딩을 사용 중이다.

```typescript
// chart-colors.ts
// Recharts SVG 속성(fill/stroke)에는 CSS 변수가 직접 불가 → 테마별 색상 상수로 관리

export const CHART_COLORS = {
  light: {
    chart1: 'oklch(0.646 0.222 41.116)',   // --chart-1 라이트 값 (globals.css)
    chart2: 'oklch(0.6 0.118 184.704)',    // --chart-2
    profitPositive: '#16a34a',              // green-600 (KPI 카드 델타와 동일)
    profitNegative: '#dc2626',              // red-600
    utilizationLine: 'oklch(0.6 0.118 184.704)', // --chart-2 (파란)
    referenceOrange: '#f97316',             // orange-500 임계선
    axis: '#71717a',                        // zinc-500 (muted-foreground 근사치)
    grid: '#e4e4e7',                        // zinc-200
    tooltip: { bg: '#ffffff', border: '#e4e4e7' },
  },
  dark: {
    chart1: 'oklch(0.488 0.243 264.376)',  // --chart-1 다크 값 (globals.css)
    chart2: 'oklch(0.696 0.17 162.48)',   // --chart-2 다크 값
    profitPositive: '#4ade80',              // green-400 (다크모드 KPI와 동일)
    profitNegative: '#f87171',              // red-400
    utilizationLine: 'oklch(0.696 0.17 162.48)',
    referenceOrange: '#fb923c',             // orange-400
    axis: '#a1a1aa',                        // zinc-400
    grid: '#3f3f46',                        // zinc-700
    tooltip: { bg: '#1c1c1e', border: '#3f3f46' },
  },
} as const;

export type ChartColorMode = typeof CHART_COLORS.light;

export function getChartColors(isDark: boolean): ChartColorMode {
  return isDark ? CHART_COLORS.dark : CHART_COLORS.light;
}
```

**각 차트 컴포넌트에서 사용:**

```typescript
"use client";
import { useTheme } from 'next-themes';
import { getChartColors } from './chart-colors';

export function RevenueTrendChart({ records, tab }: Props) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme === 'dark');
  // colors.chart1, colors.axis 등으로 SVG 속성 설정
}
```

**`resolvedTheme` vs `theme`:** `next-themes`에서 `theme`이 'system'일 수 있으므로 실제 값은 `resolvedTheme` 사용.

### Pattern 3: ComposedChart (CHART-01 매출 추이)

```typescript
// Recharts 3에서 Bar + Line 오버레이는 ComposedChart 사용
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Daily: Bar만, Weekly: Bar + Line (목표)
<ComposedChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
  <XAxis dataKey="label" tick={{ fill: colors.axis, fontSize: 12 }} />
  <YAxis tick={{ fill: colors.axis, fontSize: 12 }}
         tickFormatter={(v) => `${(v / 10000).toLocaleString()}만`} />
  <Tooltip
    formatter={(value, name) => [
      `₩${(Number(value) / 10000).toLocaleString()}만`,
      name === 'revenue' ? '실적' : '목표'
    ]}
    contentStyle={{ backgroundColor: colors.tooltip.bg, border: `1px solid ${colors.tooltip.border}`, borderRadius: '8px' }}
  />
  <Bar dataKey="revenue" fill={colors.chart1} name="revenue" />
  {tab === 'weekly' && (
    <Line type="monotone" dataKey="target" stroke={colors.chart2}
          strokeWidth={2} dot={false} name="target" />
  )}
</ComposedChart>
```

### Pattern 4: Bar + Cell (CHART-02 손익 추이)

```typescript
// 양수/음수 Bar 색상 분기는 Cell 컴포넌트 사용
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<Bar dataKey="profit" name="손익">
  {chartData.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={entry.profit >= 0 ? colors.profitPositive : colors.profitNegative}
    />
  ))}
</Bar>
```

### Pattern 5: ReferenceLine (CHART-03 가동률 임계선)

```typescript
import { LineChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// y=80에 주황 점선 임계선
<ReferenceLine
  y={80}
  stroke={colors.referenceOrange}
  strokeDasharray="4 4"
  label={{ value: '80%', position: 'right', fill: colors.referenceOrange, fontSize: 11 }}
/>
```

**주의:** `strokeDasharray` prop은 ReferenceLine에서 정식 지원됨 (SVG 속성 passthrough). `y` 값은 픽셀이 아닌 데이터 도메인 값.

### Pattern 6: 이중 YAxis (CHART-04 이용건수/이용시간)

```typescript
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ComposedChart data={chartData}>
  <XAxis dataKey="label" tick={{ fill: colors.axis, fontSize: 12 }} />
  {/* 좌 Y축 — 이용건수 */}
  <YAxis yAxisId="left" orientation="left"
         tick={{ fill: colors.axis, fontSize: 11 }}
         tickFormatter={(v) => `${v}건`} />
  {/* 우 Y축 — 이용시간 */}
  <YAxis yAxisId="right" orientation="right"
         tick={{ fill: colors.axis, fontSize: 11 }}
         tickFormatter={(v) => `${v}h`} />
  <Bar yAxisId="left" dataKey="usageCount" fill={colors.chart1} name="이용건수" />
  <Bar yAxisId="right" dataKey="usageHours" fill={colors.chart2} name="이용시간" />
</ComposedChart>
```

**yAxisId는 필수:** 이중 YAxis가 있을 때 Bar/Line에 yAxisId 미지정 시 기본값 0을 사용해 레이아웃이 깨진다. yAxisId 문자열 값과 YAxis의 yAxisId prop이 반드시 일치해야 한다.

### Pattern 7: X축 레이블 변환

```typescript
// Daily: "2026-02-01" → "2/1"
const formatDailyLabel = (date: string): string => {
  const [, month, day] = date.split('-');
  return `${parseInt(month)}/${parseInt(day)}`;
};

// Weekly: "1주차" → "1주" (또는 원본 그대로 사용)
const formatWeeklyLabel = (week: string): string => week.replace('주차', '주');
```

### Pattern 8: Suspense + 스켈레턴 (KpiCards 동일 패턴)

page.tsx에서 ChartsSection도 `<Suspense key={activeTab} fallback={<ChartsSkeleton />}>` 패턴 적용. 탭 전환 시 key 변경으로 스켈레턴 재표시.

```typescript
// dashboard/page.tsx에 추가
<Suspense key={`charts-${activeTab}`} fallback={<ChartsSkeleton />}>
  <ChartsSection data={data} tab={activeTab} />
</Suspense>
```

### Anti-Patterns to Avoid

- **SVG 속성에 CSS 변수 직접 사용:** `fill="var(--chart-1)"` — SVG attribute 파싱에서 무시됨. CSS 변수는 HTML 엘리먼트 CSS에서만 동작. Recharts SVG에서는 하드코딩 색상 값 사용 필수.
- **`theme` 대신 `resolvedTheme` 미사용:** `theme`이 'system'이면 실제 테마 미결정 상태. `resolvedTheme`이 항상 'light' 또는 'dark'.
- **ChartsSection에 `"use client"` 추가:** ChartsSection은 Server Component로 유지. Recharts를 쓰는 개별 차트 파일에만 `"use client"` 선언.
- **이중 YAxis에서 yAxisId 누락:** Bar/Line에 `yAxisId` 미지정 시 첫 번째 YAxis만 참조 — 우측 축 데이터가 오작동.
- **Daily 매출 차트에 Line 렌더링:** CONTEXT.md 결정 — Daily에서는 Line 숨김. `tab === 'weekly'` 조건부 렌더링 필수.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bar + Line 복합 차트 | 직접 SVG 합성 | ComposedChart | Recharts 3에서 공식 지원, 스케일/정렬 자동 처리 |
| 조건부 Bar 색상 | fill 동적 계산 로직 | Bar > Cell 컴포넌트 | Recharts 공식 패턴 — 데이터별 색상 오버라이드 |
| 수평 기준선 | SVG line 엘리먼트 직접 | ReferenceLine | 데이터 좌표계 자동 변환, label 위치 자동 계산 |
| 이중 Y축 | 별도 차트 두 개 배치 | YAxis×2 + yAxisId | 단일 X축 공유, 바 간격/정렬 자동 처리 |
| 반응형 컨테이너 | CSS resize observer | ResponsiveContainer | 100% width/height 반응형 자동 처리 |

**Key insight:** Recharts 3는 모든 필요 패턴(ComposedChart, Cell, ReferenceLine, 이중 YAxis)을 공식 지원한다. 커스텀 SVG 조작 없이 선언적 컴포넌트 조합만으로 구현 가능.

---

## Common Pitfalls

### Pitfall 1: CSS 변수가 SVG fill/stroke에서 무시됨 (CHART-05 최대 함정)
**What goes wrong:** `<Bar fill="var(--chart-1)" />` 또는 `<Line stroke="var(--color-chart-2)" />`로 작성 시 SVG 렌더링에서 색상이 적용되지 않아 검은색/흰색으로 표시됨.
**Why it happens:** SVG presentation attributes(`fill`, `stroke`)는 CSS custom property를 직접 해석하지 않음. CSS rule(`fill: var(--x)`)과 달리 HTML attribute(`fill="var(--x)"`)는 브라우저가 literal string으로 처리.
**How to avoid:** `chart-colors.ts`에 라이트/다크 별도 색상 상수 정의 → `useTheme().resolvedTheme`으로 분기 → 해당 색상 값을 직접 전달.
**Warning signs:** 차트가 렌더링되지만 색상이 모두 검은색/회색으로 나오는 경우.

### Pitfall 2: `theme` vs `resolvedTheme`
**What goes wrong:** `const { theme } = useTheme()` 후 `theme === 'dark'` 비교 시, 시스템 테마 설정 사용자는 `theme === 'system'`이라 조건이 항상 false.
**Why it happens:** next-themes의 'system' 옵션이 있을 때 `theme`은 사용자 선택값('system')이고 실제 적용 테마는 `resolvedTheme`에 있음.
**How to avoid:** 항상 `const { resolvedTheme } = useTheme()` 사용. `isDark = resolvedTheme === 'dark'`.
**Warning signs:** 다크모드로 전환했는데도 차트 색상이 라이트 테마로 고정.

### Pitfall 3: 이중 YAxis에서 yAxisId 불일치
**What goes wrong:** `<YAxis yAxisId="left" />`, `<YAxis yAxisId="right" />`를 선언했으나 Bar에 `yAxisId` 미지정 시 기본값 0을 사용 → "yAxisId 0을 찾을 수 없음" 경고 + 레이아웃 깨짐.
**Why it happens:** Recharts는 컴포넌트의 yAxisId prop으로 어느 축에 매핑할지 결정. 미지정 시 기본 0 사용 — 문자열 ID와 불일치.
**How to avoid:** YAxis에 `yAxisId` 지정 시 해당 차트의 모든 Bar/Line에도 동일 `yAxisId` 명시.
**Warning signs:** Recharts 콘솔 경고 `Could not find yAxis by id`.

### Pitfall 4: Daily 매출 차트에 weekly 전용 Line 렌더링
**What goes wrong:** `data.weekly`에 `weeklyTarget` 필드가 있으나 Daily 레코드는 monthlyTarget이 없음. Daily 데이터로 `<Line dataKey="weeklyTarget" />` 렌더링 시 모든 값이 0이나 NaN.
**Why it happens:** DailyRecord 타입에 weeklyTarget 없음 (Phase 1 CONTEXT.md 결정).
**How to avoid:** `{tab === 'weekly' && <Line dataKey="weeklyTarget" ... />}` 조건부 렌더링.
**Warning signs:** Daily 탭에서 0선 라인이 X축에 겹쳐 보임.

### Pitfall 5: hydration mismatch (useTheme SSR)
**What goes wrong:** Server에서 렌더링 시 테마 미결정 상태 → 라이트 색상 → Client hydration 후 다크로 전환 → 색상 플리커.
**Why it happens:** next-themes의 `resolvedTheme`은 client-only. SSR 시 `undefined`.
**How to avoid:** `resolvedTheme`이 `undefined`일 때 기본값('light') 처리: `const isDark = resolvedTheme === 'dark'`. 차트는 `"use client"` 컴포넌트이므로 hydration 후에만 렌더링됨 — 실제로는 SSR 출력이 없어 플리커 최소화. 필요시 `mounted` state 패턴 추가.
**Warning signs:** 페이지 로드 시 잠깐 색상이 바뀌는 플리커.

### Pitfall 6: ResponsiveContainer가 0 height 문제
**What goes wrong:** `<ResponsiveContainer width="100%" height="100%" />` 사용 시 부모 컨테이너에 명시적 height가 없으면 0px 렌더링.
**Why it happens:** ResponsiveContainer는 부모 높이를 참조 — 부모가 `height: auto`이면 0.
**How to avoid:** `<div className="h-[300px]">` 또는 `<ResponsiveContainer width="100%" height={300}>` 로 고정 높이 지정.
**Warning signs:** 차트가 아무것도 안 보임 (개발자 도구에서 SVG height=0 확인).

---

## Code Examples

Verified patterns from existing codebase and Recharts 3 docs:

### CHART-01: 매출 추이 전체 구조

```typescript
// components/dashboard/charts/revenue-trend-chart.tsx
"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyRecord, WeeklyRecord } from '@/types/dashboard';
import { getChartColors } from './chart-colors';

type Record = DailyRecord | WeeklyRecord;

interface RevenueTrendChartProps {
  records: Record[];
  tab: 'daily' | 'weekly';
}

export function RevenueTrendChart({ records, tab }: RevenueTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme === 'dark');

  const chartData = records.map((r) => ({
    label: tab === 'daily'
      ? formatDailyLabel((r as DailyRecord).date)
      : formatWeeklyLabel((r as WeeklyRecord).week),
    revenue: r.revenue,
    target: tab === 'weekly' ? (r as WeeklyRecord).weeklyTarget : undefined,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>매출 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="label" tick={{ fill: colors.axis, fontSize: 11 }} />
              <YAxis
                tick={{ fill: colors.axis, fontSize: 11 }}
                tickFormatter={(v) => `${(v / 10000).toLocaleString()}만`}
                width={55}
              />
              <Tooltip
                formatter={(value, name) => [
                  `₩${(Number(value) / 10000).toLocaleString()}만`,
                  name === 'revenue' ? '실적' : '목표'
                ]}
                contentStyle={{
                  backgroundColor: colors.tooltip.bg,
                  border: `1px solid ${colors.tooltip.border}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="revenue" fill={colors.chart1} name="revenue" radius={[2, 2, 0, 0]} />
              {tab === 'weekly' && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={colors.chart2}
                  strokeWidth={2}
                  dot={{ fill: colors.chart2, r: 3 }}
                  name="target"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDailyLabel(date: string): string {
  const parts = date.split('-');
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

function formatWeeklyLabel(week: string): string {
  return week.replace('주차', '주');
}
```

### CHART-02: 손익 추이 — Cell로 양수/음수 색상 분기

```typescript
// components/dashboard/charts/profit-trend-chart.tsx
"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getChartColors } from './chart-colors';
// ...

<Bar dataKey="profit" name="손익" radius={[2, 2, 0, 0]}>
  {chartData.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={entry.profit >= 0 ? colors.profitPositive : colors.profitNegative}
    />
  ))}
</Bar>
```

**Tooltip formatter (손익):**
```typescript
formatter={(value) => [
  `₩${(Math.abs(Number(value)) / 10000).toLocaleString()}만`,
  Number(value) >= 0 ? '수익' : '손실'
]}
```

### CHART-03: 가동률 — ReferenceLine

```typescript
// Recharts 3에서 ReferenceLine에 strokeDasharray 지원 확인됨
import { LineChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<LineChart data={chartData}>
  {/* ... axes ... */}
  <ReferenceLine
    y={80}
    stroke={colors.referenceOrange}
    strokeDasharray="4 4"
    label={{ value: '기준 80%', position: 'insideTopRight', fill: colors.referenceOrange, fontSize: 11 }}
  />
  <Line
    type="monotone"
    dataKey="utilizationRate"
    stroke={colors.chart1}
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 5, fill: colors.chart1 }}
    name="가동률"
  />
</LineChart>
```

### CHART-04: 이중 YAxis

```typescript
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ComposedChart data={chartData}>
  <XAxis dataKey="label" tick={{ fill: colors.axis, fontSize: 11 }} />
  <YAxis
    yAxisId="left"
    orientation="left"
    tick={{ fill: colors.axis, fontSize: 11 }}
    tickFormatter={(v) => `${v}건`}
    width={45}
  />
  <YAxis
    yAxisId="right"
    orientation="right"
    tick={{ fill: colors.axis, fontSize: 11 }}
    tickFormatter={(v) => `${v}h`}
    width={40}
  />
  <Bar yAxisId="left" dataKey="usageCount" fill={colors.chart1} name="이용건수" radius={[2, 2, 0, 0]} />
  <Bar yAxisId="right" dataKey="usageHours" fill={colors.chart2} name="이용시간" radius={[2, 2, 0, 0]} />
</ComposedChart>
```

### ChartsSkeleton 예시

```typescript
// components/dashboard/charts/charts-skeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x CategoricalChartState | Recharts 3.x — 제거됨, 컴포넌트 직접 합성 | Recharts 3.0 | 내부 state에 의존하는 Customized 컴포넌트 패턴 변경 필요 |
| CSS 변수 fill="var(--x)" | 하드코딩 색상 + useTheme() 분기 | 현재(미해결) | SVG 속성에서 CSS 변수 미지원 — 색상 관리 복잡도 증가 |
| `accessibilityLayer` 기본 false | Recharts 3에서 기본 true | Recharts 3.0 | 접근성 향상, 별도 설정 불필요 |

**Deprecated/outdated:**
- `CategoricalChartState` props 의존 커스텀 컴포넌트: Recharts 3에서 제거됨. 이 Phase에서는 사용하지 않으므로 무관.

---

## Open Questions

1. **oklch 값이 Recharts SVG fill에서 실제로 작동하는가?**
   - What we know: category-chart.tsx는 HSL 값을 사용. shadcn/ui GitHub 이슈(#7076)에서 oklch/hsl 변수가 SVG에서 검은색으로 렌더링되는 버그 보고됨.
   - What's unclear: oklch를 SVG `fill` attribute에 literal string으로 직접 전달(`fill="oklch(0.646 0.222 41.116)"`)했을 때 브라우저 지원 범위. 현대 Chrome/Safari는 지원할 수 있음.
   - Recommendation: chart-colors.ts에서 oklch literal 값을 사용하되, 만약 색상이 표시되지 않을 경우 hex 또는 hsl 폴백 준비. 첫 구현 후 브라우저 검증 필수.

2. **Daily 최근 30일 슬라이싱 로직 위치**
   - What we know: CONTEXT.md — Daily 차트는 최근 30일 기준.
   - What's unclear: 각 개별 차트가 독립적으로 slice(-30)할지, ChartsSection에서 한 번에 할지.
   - Recommendation: ChartsSection에서 한 번 slicing 후 records prop으로 전달 — 중복 코드 방지.

---

## Sources

### Primary (HIGH confidence)
- `components/dashboard/category-chart.tsx` (프로젝트 파일) — CSS 변수 작동 불가 → HSL 하드코딩 패턴 실증
- `components/dashboard/revenue-chart.tsx` (프로젝트 파일) — 기존 Recharts LineChart 패턴, Tooltip CSS 변수 사용 예시
- `app/globals.css` (프로젝트 파일) — --chart-1~5 oklch 라이트/다크 값 확인
- `types/dashboard.ts`, `lib/data.ts` (프로젝트 파일) — DailyRecord.profit 음수 가능 확인
- https://recharts.github.io/en-US/api/ComposedChart/ — ComposedChart 공식 API
- https://recharts.github.io/en-US/api/Bar/ — Bar + Cell, yAxisId 공식 API
- https://recharts.github.io/en-US/api/ReferenceLine/ — ReferenceLine y, strokeDasharray, label

### Secondary (MEDIUM confidence)
- https://github.com/recharts/recharts/wiki/3.0-migration-guide — Recharts 3 breaking changes 확인
- https://github.com/shadcn-ui/ui/issues/7076 — oklch CSS 변수 SVG 렌더링 버그 보고

### Tertiary (LOW confidence)
- WebSearch: "Recharts positive negative bar Cell fill" — Cell 패턴 확인 (공식 문서에서 재확인 권장)

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — 모든 의존성이 이미 package.json에 설치됨. Recharts 3.7.0 현재 버전 확인.
- Architecture: HIGH — 기존 KpiCards Server→Client 패턴 그대로 적용. 파일 구조 명확.
- Pitfalls: HIGH — CSS 변수 문제는 기존 category-chart.tsx에서 이미 발견됨. 프로젝트 내 실증 증거 있음.
- Color Values: MEDIUM — oklch literal 값이 SVG fill attribute에서 작동하는지 브라우저 검증 필요.

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (Recharts 안정 버전 기준 30일)
