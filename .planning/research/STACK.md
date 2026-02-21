# Stack Research

**Domain:** Korean business sales dashboard (Daily/Weekly tabs, KPI target vs actual, period comparison)
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

The existing stack (Next.js 16, React 19, Recharts 3.7.0, shadcn/ui, Google Sheets API v4) is fully sufficient for the dashboard requirements. **No new npm packages are needed.** The project requires only:

1. Additional shadcn/ui components installed via CLI (Tabs, Progress, Badge, Separator)
2. Additional Recharts chart types already included in the installed package (ComposedChart, BarChart, ReferenceLine, Area)
3. New TypeScript types and data parsing logic for the team-specific sheet structure

This is an extension of the existing stack, not a replacement. The focus is on leveraging what is already installed more deeply.

## Existing Stack (No Changes)

These are already installed and working. Listed for reference only.

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 16.1.6 | App Router, Server Components, route protection | Verified installed |
| React | 19.2.3 | UI framework | Verified installed |
| TypeScript | ^5 | Type safety | Verified installed |
| Tailwind CSS | v4 | Utility-first styling with @theme CSS variables | Verified installed |
| Recharts | 3.7.0 | Data visualization (charts) | Verified installed |
| radix-ui | 1.4.3 | Accessible component primitives | Verified installed |
| shadcn/ui | new-york style | Pre-built UI components | 5 components installed |
| googleapis | 171.4.0 | Google Sheets API v4 client | Verified installed |
| next-auth | 5.0.0-beta.30 | Authentication (Google OAuth + dev credentials) | Verified installed |
| next-themes | 0.4.6 | Dark/light mode | Verified installed |
| lucide-react | 0.563.0 | Icons | Verified installed |

## Recommended Stack Additions

### Additional shadcn/ui Components (via CLI, no npm install)

These components use the already-installed `radix-ui@1.4.3` package. Install via `npx shadcn@latest add`.

| Component | Purpose | Why Needed | Confidence |
|-----------|---------|------------|------------|
| **Tabs** | Daily/Weekly tab switching | Core navigation pattern for the single-page dual-view dashboard. PROJECT.md specifies tab-based switching, not route-based. Radix Tabs are accessible (keyboard nav, ARIA roles) out of the box. | HIGH -- Verified `radix-ui` exports `Tabs` with `Root`, `List`, `Trigger`, `Content` sub-components |
| **Progress** | Achievement rate (달성률) visualization in KPI cards | Visual bar showing target vs actual percentage. More compact than a full chart for KPI cards. Radix Progress provides accessible `aria-valuenow/min/max`. | HIGH -- Verified `radix-ui` exports `Progress` with `Root`, `Indicator` |
| **Badge** | Status indicators, period comparison labels (+/- change) | Show "달성", "미달", percentage change badges on KPIs. shadcn/ui Badge is CSS-only (no Radix dependency), ships with `default`, `secondary`, `destructive`, `outline` variants. | HIGH -- shadcn/ui component, no additional dependency |
| **Separator** | Visual section dividers between chart groups | Clean separation between KPI section and chart sections. Already available in `radix-ui`. | MEDIUM -- Nice-to-have, could use Tailwind border instead |

**Installation command:**
```bash
npx shadcn@latest add tabs progress badge separator
```

### Additional Recharts Components (Already Installed)

All of these are already exported by `recharts@3.7.0`. Verified by loading the module and checking exports.

| Component | Purpose | Why Needed | Confidence |
|-----------|---------|------------|------------|
| **ComposedChart** | Actual (Bar) + Target (Line) overlay charts | The core chart pattern for this dashboard: bars showing actual values with a line overlay showing targets. ComposedChart accepts `<Bar>`, `<Line>`, `<Area>` as children in a single chart. | HIGH -- Verified: `typeof ComposedChart === 'object'` with `.render` method |
| **BarChart + Bar** | Revenue, profit, utilization bar charts | Bar charts are the standard for period-based comparison (daily/weekly). Better than line charts for discrete periods. `stackId` prop enables stacking. | HIGH -- Verified: `Bar` supports `stackId` for stacked bars |
| **ReferenceLine** | Target lines on charts | Horizontal dashed line showing the monthly target value. Supports `y` prop for horizontal lines, `label` prop for annotation, `stroke` and `strokeDasharray` for styling. | HIGH -- Verified: full type definition read, supports `y`, `label`, `strokeWidth`, default stroke `#ccc` |
| **Area** | Trend area fills under lines | Subtle fill under trend lines for visual weight. Used in ComposedChart for showing trend corridors. | HIGH -- Verified export |
| **LabelList** | Data labels on bars | Show values directly on bar segments (e.g., "85%" on a utilization bar). Supports `position`, `formatter`, `style` props. | HIGH -- Verified export |
| **Legend** | Chart legends for multi-series charts | Distinguish "실적" (actual) vs "목표" (target) lines. Already used in `category-chart.tsx`. | HIGH -- Already in use |

### New TypeScript Types (Custom, No Library)

These replace the existing generic types in `types/dashboard.ts`.

| Type | Purpose | Replaces |
|------|---------|----------|
| `DailyRecord` | Single day row: date, revenue, profit, hours, count, utilization, monthly target | `MonthlyRevenue`, `RecentOrder` |
| `WeeklyRecord` | Single week row: week number, revenue, profit, hours, count, utilization | `CategoryDistribution` |
| `SalesKpi` | KPI with target, actual, achievement rate, period comparison delta | `KpiData` |
| `SalesDashboardData` | Top-level data shape: `{ daily: DailyRecord[], weekly: WeeklyRecord[], kpiDaily: SalesKpi[], kpiWeekly: SalesKpi[] }` | `DashboardData` |
| `PeriodComparison` | This period vs last period: `{ current: number, previous: number, changeRate: number }` | N/A (new) |

### Utility Patterns (Custom, No Library)

| Pattern | Purpose | Why Not a Library |
|---------|---------|-------------------|
| **Date/period helpers** | Calculate "this week", "last week", "this month", "last month" from daily data | Simple date arithmetic. `date-fns` or `dayjs` would be overkill for comparing adjacent periods in a fixed dataset. The data already has dates as strings from the sheet. |
| **KPI calculation helpers** | Compute achievement rate (달성률 = actual/target * 100), period-over-period change | Pure arithmetic functions. No library needed. |
| **Number formatting helpers** | `formatWon()` for currency, `formatRate()` for percentages, `formatCount()` for counts | Extend existing `₩${(amount / 10000).toLocaleString()}만` pattern. Simple utility functions. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Chart library | Recharts 3.7.0 (existing) | Nivo, Victory, Apache ECharts | Already installed and working. Team already has Recharts patterns in codebase. Switching would require rewriting existing charts for zero benefit. |
| Tab component | shadcn/ui Tabs (Radix) | Custom div + state toggle | Radix Tabs gives free keyboard navigation, ARIA roles, and controlled/uncontrolled modes. Building from scratch wastes time and loses accessibility. |
| Date library | Native Date + simple helpers | date-fns, dayjs | Overkill. Dashboard only needs "is this row in current week/month?" and "calculate delta from previous period." Sheet data has dates as strings (YYYY-MM-DD or similar). Parse with `new Date()`. |
| State management | Server Component props + URL search params | zustand, jotai, Redux | No client-side state management needed. Tab state can use URL search params or React state. Data is fetched server-side per page load. |
| Number formatting | Custom utility functions | Intl.NumberFormat, numeral.js | The project already uses `toLocaleString()` pattern. Custom wrappers maintain consistency. Intl.NumberFormat is fine internally but the万원 format is custom anyway. |
| Progress/gauge | shadcn/ui Progress | Custom SVG gauge, `react-circular-progressbar` | Progress bar is visually sufficient for 달성률. Gauges add visual complexity without proportional value for a data-dense dashboard. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **date-fns / dayjs / moment** | Over-engineering. The dashboard only compares adjacent periods in pre-structured sheet data. Adding a date library for 3-4 date comparisons bloats the bundle. | Native `Date` object + 2-3 utility functions for week/month boundaries |
| **React Query / SWR** | Data is fetched server-side via Server Components. There is no client-side data fetching. The project explicitly chose "page access = fresh fetch, no polling." | `getDashboardData()` in Server Component (existing pattern) |
| **zustand / jotai / Redux** | No complex client state. Tab selection is the only UI state, handled by Radix Tabs or URL params. Data flows server -> page -> components. | React `useState` for tab state, or URL search params via `useSearchParams()` |
| **Tremor / Ant Design Charts** | Competing chart/dashboard libraries that would conflict with existing Recharts + shadcn/ui patterns. Tremor wraps Recharts anyway. | Direct Recharts usage (already installed, already patterned) |
| **react-circular-progressbar** | Gauge widgets look flashy but are information-sparse. A simple progress bar communicates 달성률 just as effectively in less space. | shadcn/ui Progress component |
| **Chart.js / react-chartjs-2** | Canvas-based charting that doesn't integrate with React's rendering model as well as Recharts (SVG). Would require maintaining two chart paradigms. | Recharts 3.7.0 (already installed) |
| **Polling / WebSocket / real-time** | PROJECT.md explicitly scopes this out: "페이지 접속 시 fetch로 충분." Real-time adds server cost and complexity for no user-validated need. | Server Component data fetching on page load |

## Stack Patterns for This Project

### Pattern 1: ComposedChart for Target vs Actual

**When:** Showing actual values (bars) against target values (line) on the same chart.

```typescript
// Revenue chart: bars for actual, line for target
<ComposedChart data={dailyData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
  <Bar dataKey="revenue" fill="var(--color-chart-1)" name="실적" />
  <Line dataKey="target" stroke="var(--color-chart-2)" strokeDasharray="5 5" name="목표" dot={false} />
  <ReferenceLine y={monthlyTarget} stroke="var(--color-destructive)" strokeDasharray="3 3" label="월 목표" />
  <Tooltip />
  <Legend />
</ComposedChart>
```

### Pattern 2: KPI Card with Achievement Rate

**When:** Showing a metric with its target and 달성률 progress.

```typescript
// KPI card pattern with Progress bar
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium text-muted-foreground">매출</CardTitle>
    <Badge variant={achievementRate >= 100 ? "default" : "destructive"}>
      {achievementRate.toFixed(1)}%
    </Badge>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">{formatWon(actual)}</p>
    <Progress value={Math.min(achievementRate, 100)} className="mt-2" />
    <p className="text-xs text-muted-foreground mt-1">
      목표: {formatWon(target)}
    </p>
  </CardContent>
</Card>
```

### Pattern 3: Period Comparison with Badge Delta

**When:** Showing this period vs last period change.

```typescript
// Period comparison delta badge
const delta = ((current - previous) / previous * 100).toFixed(1);
const isPositive = current >= previous;

<div className="flex items-center gap-1">
  <Badge variant={isPositive ? "default" : "destructive"}>
    {isPositive ? "+" : ""}{delta}%
  </Badge>
  <span className="text-xs text-muted-foreground">전주 대비</span>
</div>
```

### Pattern 4: Tab-Based Dashboard View

**When:** Switching between Daily and Weekly views on a single page.

```typescript
// Server Component fetches all data, Client Component handles tab state
// page.tsx (Server Component):
const data = await getSalesDashboardData();
return <DashboardTabs dailyData={data.daily} weeklyData={data.weekly} />;

// dashboard-tabs.tsx (Client Component):
"use client";
<Tabs defaultValue="daily">
  <TabsList>
    <TabsTrigger value="daily">일별</TabsTrigger>
    <TabsTrigger value="weekly">주차별</TabsTrigger>
  </TabsList>
  <TabsContent value="daily">
    <KpiCards data={dailyKpi} />
    <RevenueChart data={dailyData} target={monthlyTarget} />
    ...
  </TabsContent>
  <TabsContent value="weekly">
    <KpiCards data={weeklyKpi} />
    <RevenueChart data={weeklyData} />
    ...
  </TabsContent>
</Tabs>
```

## Version Compatibility

All packages are already installed and verified working together.

| Package | Version | Compatible With | Verification |
|---------|---------|-----------------|--------------|
| recharts | 3.7.0 | react@19.2.3, react-dom@19.2.3 | Existing charts render correctly |
| radix-ui | 1.4.3 | react@19.2.3 | Existing Avatar, DropdownMenu work correctly |
| next | 16.1.6 | react@19.2.3, next-auth@5.0.0-beta.30 | Existing app runs correctly |
| shadcn (CLI) | 3.8.4 | radix-ui@1.4.3, tailwindcss@v4 | Existing 5 components installed and working |

**No version conflicts.** The `npx shadcn@latest add tabs progress badge separator` command will generate local component files that use the already-installed `radix-ui` package.

## Installation Summary

```bash
# Add shadcn/ui components (uses already-installed radix-ui@1.4.3)
npx shadcn@latest add tabs progress badge separator
```

**That is the only command needed.** No `npm install` required. Everything else is custom TypeScript code using existing dependencies.

## Confidence Assessment

| Recommendation | Confidence | Basis |
|----------------|------------|-------|
| Recharts ComposedChart + Bar + Line + ReferenceLine | HIGH | Verified all exports exist in installed recharts@3.7.0 via `require('recharts')`. Read ReferenceLine type definition confirming `y`, `label`, `strokeDasharray` props. |
| shadcn/ui Tabs (via Radix) | HIGH | Verified `require('radix-ui').Tabs` exports `Root`, `List`, `Trigger`, `Content`, `TabsList`, `TabsTrigger`, `TabsContent`. |
| shadcn/ui Progress (via Radix) | HIGH | Verified `require('radix-ui').Progress` exports `Root`, `Indicator`, `Progress`, `ProgressIndicator`. |
| shadcn/ui Badge | HIGH | Pure CSS component in shadcn/ui, no Radix dependency. Standard shadcn/ui component. |
| No date library needed | HIGH | Sheet data has pre-structured dates. Only adjacent period comparison needed. |
| No state management library needed | HIGH | Existing pattern: Server Component fetches data, passes as props. Tab state is the only new client state. |
| No new npm packages needed | HIGH | All chart types verified as exports of installed recharts@3.7.0. All UI primitives verified as exports of installed radix-ui@1.4.3. |

## Sources

- `recharts@3.7.0` package -- loaded via `require('recharts')` and verified all component exports (ComposedChart, BarChart, Bar, Line, ReferenceLine, ReferenceArea, Area, LabelList, Legend, Tooltip, Brush)
- `recharts/types/cartesian/ReferenceLine.d.ts` -- read full type definition confirming `y`, `x`, `segment`, `label`, `strokeWidth`, `position` props
- `recharts/types/cartesian/Bar.d.ts` -- read type definition confirming `stackId`, `barSize`, `unit`, `name` props
- `radix-ui@1.4.3` package -- loaded via `require('radix-ui')` and verified 35 component exports including Tabs (Root, List, Trigger, Content) and Progress (Root, Indicator)
- Existing codebase: `components/dashboard/revenue-chart.tsx`, `kpi-cards.tsx`, `category-chart.tsx` -- established Recharts + shadcn/ui Card patterns
- `package.json` -- verified all installed dependency versions
- `types/dashboard.ts` -- reviewed current type structure that needs replacement
- `lib/data.ts` -- reviewed current data fetching and parsing pattern (3-layer with mock fallback)
- `lib/sheets.ts` -- reviewed Google Sheets API wrapper pattern

---
*Stack research for: 경남울산사업팀 매출 대시보드 (Sales Dashboard with Google Sheets backend)*
*Researched: 2026-02-21*
