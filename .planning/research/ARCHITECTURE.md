# Architecture Research

**Domain:** Next.js 16 App Router dashboard — adding period filter, CSV export, and KPI sparklines to existing Server/Client component architecture
**Researched:** 2026-02-27
**Confidence:** HIGH

---

## Context: Existing Architecture (v1.0)

Understanding the current boundaries is essential before placing new features.

### Data Flow (v1.0, established)

```
Google Sheets API
    |
    v
lib/sheets.ts           -- fetchSheetData(range): string[][] | null
    |
    v
lib/data.ts             -- getTeamDashboardData(): TeamDashboardData
    |                      { daily: DailyRecord[], weekly: WeeklyRecord[], fetchedAt }
    v
app/(dashboard)/dashboard/page.tsx   -- Server Component (async)
    |   reads searchParams.tab → 'daily' | 'weekly'
    |   calls getTeamDashboardData() ONCE per page request (force-dynamic)
    |   passes full data + activeTab as props downward
    |
    +---> KpiCards (Server Component)     -- computes KPI values from raw records
    +---> ChartsSection (Server Component) -- slices/sorts records, passes to chart clients
    |         +---> RevenueTrendChart (Client)
    |         +---> ProfitTrendChart (Client)
    |         +---> UtilizationTrendChart (Client)
    |         +---> UsageTrendChart (Client)
    +---> DataTable (Server Component)    -- renders HTML table from records
    +---> TabNav (Client Component)       -- uses useSearchParams() to update URL
    +---> UpdateTimestamp (Client Component)
```

### Server/Client Boundary (v1.0)

| Layer | Server or Client | Why |
|-------|-----------------|-----|
| `page.tsx` | Server | async data fetch, searchParams |
| `KpiCards` | Server | pure computation + render, no hooks |
| `KpiCard` | Server | pure render |
| `ChartsSection` | Server | data slicing/sorting, no hooks |
| `RevenueTrendChart` | **Client** | Recharts requires DOM, `useTheme()` |
| `ProfitTrendChart` | **Client** | Recharts + `useTheme()` |
| `UtilizationTrendChart` | **Client** | Recharts + `useTheme()` |
| `UsageTrendChart` | **Client** | Recharts + `useTheme()` |
| `DataTable` | Server | pure render |
| `TabNav` | **Client** | `useSearchParams()`, `useRouter()` |
| `UpdateTimestamp` | **Client** | `useEffect` for relative time |

---

## Feature 1: 기간 선택기 (Period Filter Toggle)

### What it does

Four preset toggles: 이번 주 / 지난 주 / 이번 달 / 지난 달.
Each filters `daily` records down to the matching date range before rendering.
The `weekly` tab shows all data regardless (weekly records don't have ISO dates).

### Architecture Decision: URL searchParam, client toggle, server filter

Use the same pattern as the existing `tab` searchParam. Add a `period` searchParam to the URL. The Server Component reads `period` from searchParams and passes it to downstream components. Filtering happens in the Server Component (pure computation, no client state needed). The toggle UI is a Client Component (needs `useSearchParams` + `useRouter`).

**Why not client-side state (useState)?**
URL searchParams make the filter shareable and bookmarkable. The existing tab toggle already uses this pattern — consistency matters. Server-side filtering also means the DataTable and Charts always receive the already-filtered array, with no prop drilling of filter state to every component.

**Why not a new API route?**
The full dataset is already in memory on the server after `getTeamDashboardData()`. Filtering 30-90 records in JS is trivial. A fetch round-trip to an API route would add latency for no benefit.

### Data Flow Change

```
URL: /dashboard?tab=daily&period=this-week

page.tsx (Server)
  reads: searchParams.tab, searchParams.period
  calls: getTeamDashboardData()   (unchanged)
  computes: filteredData = applyPeriodFilter(data, activeTab, period)
  passes: filteredData + activeTab + period down to children

KpiCards(filteredData, activeTab)   -- unchanged interface
ChartsSection(filteredData, activeTab)  -- unchanged interface
DataTable(filteredData, activeTab)  -- unchanged interface

PeriodFilter (Client Component)    -- new, reads searchParams, updates URL
```

### New Component: `PeriodFilter`

```
components/dashboard/period-filter.tsx   "use client"
```

Props: `activePeriod: PeriodKey`, `tab: 'daily' | 'weekly'`

Renders four `<button>` elements or a `<ToggleGroup>` (shadcn/ui). On click calls `router.replace()` updating `?period=` searchParam while preserving `?tab=`. For the `weekly` tab, renders nothing (or disabled state) since period filtering doesn't apply.

### New Utility: `applyPeriodFilter` in `lib/data.ts`

```typescript
export type PeriodKey = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'all'

export function applyPeriodFilter(
  data: TeamDashboardData,
  tab: 'daily' | 'weekly',
  period: PeriodKey
): TeamDashboardData
```

Pure function. Takes full data, returns a new `TeamDashboardData` with filtered `daily` array. The `weekly` array is returned unmodified regardless of period. The `fetchedAt` timestamp is preserved.

Week/month boundaries are computed relative to `new Date()` at render time on the server. ISO date string comparison (`localeCompare`) works because `DailyRecord.date` is already normalized to `YYYY-MM-DD` by `ChartsSection.normalizeDate()`.

**Important:** `normalizeDate()` currently lives in `charts-section.tsx`. For period filtering to work at the page level, this normalization must happen in `lib/data.ts` or be extracted to `lib/date-utils.ts` before filtering. The filter cannot operate on raw "2026. 2. 21" format strings reliably.

### Modified Components

| Component | Change |
|-----------|--------|
| `app/(dashboard)/dashboard/page.tsx` | Read `searchParams.period`, call `applyPeriodFilter`, pass `activePeriod` to `PeriodFilter` |
| `lib/data.ts` | Add `applyPeriodFilter()`, `PeriodKey` type |
| `components/dashboard/tab-nav.tsx` | May need to preserve `period` param when switching tabs (or reset to `all`) |

### Placement in page.tsx

```
TabNav
PeriodFilter     <-- new, below TabNav, hidden when tab=weekly
UpdateTimestamp
KpiCards
ChartsSection
DataTable
```

---

## Feature 2: CSV/Excel 내보내기 (Export)

### What it does

A button that downloads the currently-visible table data as a `.csv` file. The "currently-visible" data means the records after period filter is applied, for the active tab.

### Architecture Decision: Client-side CSV generation, no API route

CSV generation from an array of objects is 5-10 lines of JS. The client already has the filtered data rendered in the DataTable. A browser download (URL.createObjectURL + `<a>` click) requires no server round-trip. There is no reason for an API route here.

**Why not Excel (.xlsx)?** xlsx generation requires `exceljs` or `xlsx` package (~400KB+). The project out-of-scope excludes unnecessary dependencies. A properly-formed CSV opens in Excel without any library. Stick to CSV.

**Why not a Server Action?** The data is already on the client as rendered HTML, but we need the structured records (not scraped HTML). The cleanest solution: pass the filtered records down to the export button as a serialized prop from the Server Component, and generate CSV purely client-side.

### New Component: `ExportButton`

```
components/dashboard/export-button.tsx   "use client"
```

Props: `records: DailyRecord[] | WeeklyRecord[]`, `tab: 'daily' | 'weekly'`, `period: PeriodKey`

The component generates CSV in-memory on click, creates a Blob, triggers download. No state is persisted. Filename format: `dashboard-{tab}-{period}-{YYYY-MM-DD}.csv`.

```typescript
// CSV generation (pure, no library needed)
function toCsv(records: DailyRecord[] | WeeklyRecord[], tab: 'daily' | 'weekly'): string {
  const headers = tab === 'daily'
    ? ['날짜', '매출', '손익', '이용시간', '이용건수', '가동률']
    : ['주차', '매출', '손익', '이용시간', '이용건수', '가동률', '목표'];
  const rows = records.map(r => /* field mapping */);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
```

### Data Flow

```
page.tsx (Server)
  filteredData passed to DataTable AND to ExportButton as props

ExportButton (Client)
  onClick: generates CSV blob → downloads
  no fetch, no API, no state
```

### Placement

Export button sits in the DataTable card header, right-aligned. The `DataTable` server component accepts `exportRecords` prop (the same records it renders) and renders `<ExportButton>` inline. Alternatively, place `ExportButton` in `page.tsx` above the DataTable — simpler prop threading. Recommended: in `page.tsx` in a flex row with the period filter.

### Modified Components

| Component | Change |
|-----------|--------|
| `app/(dashboard)/dashboard/page.tsx` | Pass `filteredData.daily` or `filteredData.weekly` to `ExportButton` based on active tab |

---

## Feature 3: KPI 스파크라인 (KPI Sparklines)

### What it does

A tiny mini-chart (sparkline) inside each KPI card showing the trend of that metric over recent periods. No axes, no labels — just the shape of the trend line.

### Architecture Decision: Recharts `LineChart` or SVG path, rendered in Client Component

The existing `KpiCard` is a Server Component. It cannot use Recharts (which requires `useTheme()` and DOM). Two options:

**Option A:** Keep `KpiCard` as Server Component, add a new `Sparkline` Client Component as a child.
**Option B:** Convert `KpiCard` to Client Component.

Recommendation: **Option A.** Keep `KpiCard` server-rendered. Add a `SparklineChart` Client Component that receives a `number[]` array of values and renders a tiny `<LineChart>`. This maintains the Server boundary for everything in `KpiCard` except the sparkline itself.

Recharts `<LineChart>` for a sparkline with `width={120} height={40}` and no axes works cleanly. The `SparklineChart` props are:

```typescript
interface SparklineChartProps {
  data: number[];       // the metric values in chronological order
  positive?: boolean;   // drives color: green if true, red if false, neutral if undefined
}
```

### Data Flow Change

The sparkline needs the last N data points for each metric. The `KpiCards` server component already has access to the full `data.daily` and `data.weekly` arrays. It needs to extract the trend series before passing to `KpiCard`.

```
KpiCards (Server Component)
  for each KPI metric:
    extracts trendValues: number[] (last 7 daily or last 4 weekly)
    passes trendValues to KpiCard as prop

KpiCard (Server Component)
  renders SparklineChart (Client Component) with trendValues

SparklineChart (Client Component)
  useTheme() for color
  renders tiny LineChart
```

### Modified Components

| Component | Change |
|-----------|--------|
| `components/dashboard/kpi-card.tsx` | Add optional `sparklineData?: number[]` prop, render `<SparklineChart>` |
| `components/dashboard/kpi-cards.tsx` | Extract trend series for each KPI before building card definitions |

### New Component: `SparklineChart`

```
components/dashboard/sparkline-chart.tsx   "use client"
```

Uses Recharts `LineChart` (already in `recharts` dependency). No new package needed.

```typescript
"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useTheme } from "next-themes";

interface SparklineChartProps {
  data: number[];
  trend: 'up' | 'down' | 'neutral';
}

export function SparklineChart({ data, trend }: SparklineChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const color = trend === 'up'
    ? (isDark ? '#4ade80' : '#16a34a')    // green-400/600
    : trend === 'down'
    ? (isDark ? '#f87171' : '#dc2626')    // red-400/600
    : (isDark ? '#a1a1aa' : '#71717a');   // zinc-400/500
  const chartData = data.map((v) => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

Colors reuse the same palette already defined in `chart-colors.ts`.

### Sparkline Data Extraction (in `kpi-cards.tsx`)

For Daily tab: take the last 14 `DailyRecord` entries, extract the relevant field.
For Weekly tab: take all `WeeklyRecord` entries (typically 4-8 weeks).

The trend direction (`'up' | 'down' | 'neutral'`) is determined by comparing first and last value in the sparkline series. Consistent with the existing `calcDelta()` logic in `lib/kpi-utils.ts`.

---

## Combined System Overview (v1.1)

```
+-----------------------------------------------------------------------+
|                        Browser (Client)                                |
|                                                                        |
|  TabNav (Client)   PeriodFilter (Client NEW)   ExportButton (Client NEW)|
|                                                                        |
|  KpiCards (Server)                                                     |
|    KpiCard (Server) x5                                                 |
|      SparklineChart (Client NEW)  <-- nested client in server          |
|                                                                        |
|  ChartsSection (Server)                                                |
|    RevenueTrendChart (Client)                                           |
|    ProfitTrendChart (Client)                                            |
|    UtilizationTrendChart (Client)                                       |
|    UsageTrendChart (Client)                                             |
|                                                                        |
|  DataTable (Server)                                                    |
+----------|------------------------------------------------------------+
           | URL: /dashboard?tab=daily&period=this-week
+-----------v-----------------------------------------------------------+
|           Dashboard Page (Server Component — page.tsx)                 |
|                                                                        |
|   1. await searchParams  → { tab, period }                            |
|   2. getTeamDashboardData()           (unchanged)                     |
|   3. applyPeriodFilter(data, tab, period)   (NEW in lib/data.ts)      |
|   4. render with filteredData                                          |
+-----------------------------------------------------------------------+
           |
+-----------v-----------------------------------------------------------+
|  lib/data.ts  getTeamDashboardData()  applyPeriodFilter()             |
|  lib/sheets.ts  fetchSheetData()                                      |
|  lib/date-utils.ts  (NEW — extracted normalizeDate, period boundaries)|
+-----------------------------------------------------------------------+
           |
+-----------v-----------------------------------------------------------+
|  Google Sheets API → "일별" sheet + "주차별" sheet                     |
+-----------------------------------------------------------------------+
```

---

## Component Map: New vs Modified

### New Files

| File | Type | Purpose |
|------|------|---------|
| `components/dashboard/period-filter.tsx` | Client Component | 이번 주/지난 주/이번 달/지난 달 toggle buttons, updates `?period=` searchParam |
| `components/dashboard/export-button.tsx` | Client Component | CSV generation + browser download, receives `records[]` as prop |
| `components/dashboard/sparkline-chart.tsx` | Client Component | Tiny 36px-tall Recharts LineChart, no axes, color-coded by trend |
| `lib/date-utils.ts` | Pure TS | `normalizeDate()` (extracted from charts-section), `getPeriodDateRange()`, `applyPeriodFilter()` — or merge into `lib/data.ts` |

### Modified Files

| File | Change | Scope |
|------|--------|-------|
| `app/(dashboard)/dashboard/page.tsx` | Read `period` from searchParams; call `applyPeriodFilter`; pass `activePeriod` to `PeriodFilter` and `ExportButton` | ~10 lines added |
| `lib/data.ts` | Add `PeriodKey` type, `applyPeriodFilter()` function | ~40 lines added |
| `components/dashboard/kpi-card.tsx` | Add `sparklineData?: number[]` prop; render `<SparklineChart>` in card footer | ~10 lines added |
| `components/dashboard/kpi-cards.tsx` | Extract trend series per KPI metric; pass to `KpiCard` as `sparklineData` | ~20 lines added per card |
| `components/dashboard/charts/charts-section.tsx` | Remove local `normalizeDate()` if extracted to `lib/date-utils.ts`; import instead | ~5 lines changed |

---

## Architectural Patterns

### Pattern 1: URL-as-State for Filter Controls

**What:** Filter state (period) lives in the URL as a searchParam, not in React state.
**When to use:** Any filter that should be shareable, bookmarkable, or that causes a server-side data re-computation.
**Trade-offs:** Causes a full server re-render on filter change (soft navigation). For a dashboard with ~90 records, this is under 100ms. For a dataset requiring expensive DB queries, consider client-side filtering.

The existing `tab` searchParam establishes this pattern. `period` follows identically.

### Pattern 2: Server Component as Data Transformer, Client Component as Leaf

**What:** Server Components receive raw data, transform/slice it, and pass serializable props (plain objects, number arrays) to Client Components at the leaf of the tree.
**When to use:** When Recharts or other browser-only libraries are needed but the computation is pure.
**Trade-offs:** Props must be serializable (no functions, no React elements across the Server/Client boundary).

`ChartsSection` (Server) slices records → passes `DailyRecord[]` to `RevenueTrendChart` (Client). The same pattern applies to `SparklineChart`: `KpiCards` (Server) extracts `number[]` → passes to `SparklineChart` (Client).

### Pattern 3: Inline Client Islands in Server Component Trees

**What:** A Server Component renders a Client Component as a direct child, passing serializable props. React handles the hydration boundary automatically.
**When to use:** When a small interactive/browser-dependent piece is needed inside an otherwise server-rendered component.
**Trade-offs:** The Client Component subtree is hydrated separately. No shared state between the server shell and client island without a context provider.

`KpiCard` (Server) contains `SparklineChart` (Client). This is valid Next.js App Router behavior — you can import a Client Component from a Server Component; you cannot import a Server Component from inside a Client Component.

### Pattern 4: Pure Client-Side CSV Generation

**What:** Build CSV string from an array, create a `Blob`, trigger `<a>` download in-memory. No server involvement.
**When to use:** When the data is already on the client and the export format is simple.
**Trade-offs:** Large datasets (100K+ rows) can freeze the main thread. For this dashboard (~90 records max), it's instantaneous.

---

## Data Flow for Each Feature

### Period Filter Flow

```
User clicks "이번 주"
    |
PeriodFilter.tsx (Client)
    router.replace('/dashboard?tab=daily&period=this-week', { scroll: false })
    |
Next.js soft navigation → page.tsx re-executes on server
    |
page.tsx reads: tab='daily', period='this-week'
getTeamDashboardData()  →  full data (all records)
applyPeriodFilter(data, 'daily', 'this-week')  →  filtered to current week only
    |
KpiCards(filteredData)   -- KPIs reflect this-week only
ChartsSection(filteredData)  -- charts show this-week only
DataTable(filteredData)  -- table shows this-week only
ExportButton(filteredData.daily)  -- export is this-week only
```

### Export Flow

```
User clicks "CSV 내보내기"
    |
ExportButton.tsx (Client)
    toCsv(records, tab)  →  CSV string
    new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    URL.createObjectURL(blob)
    <a href=...>.click()
    URL.revokeObjectURL(...)
    |
Browser downloads: "dashboard-daily-this-week-2026-02-27.csv"
```

### Sparkline Flow

```
page.tsx
    data = getTeamDashboardData()
    filteredData = applyPeriodFilter(data, tab, period)
    |
KpiCards(filteredData, tab)  [Server Component]
    sorted = [...filteredData.daily].sort(...)
    trendRevenue = sorted.map(r => r.revenue)  // number[]
    |
KpiCard(sparklineData=trendRevenue, ...)  [Server Component]
    |
SparklineChart(data=trendRevenue, trend='up')  [Client Component]
    useTheme()  →  color
    renders 36px LineChart
```

---

## Build Order (Recommended)

**1 — Extract `normalizeDate` to `lib/date-utils.ts`**
This unblocks both period filtering (needs date normalization) and removes duplication from `charts-section.tsx`. Zero user-visible change.

**2 — Add `applyPeriodFilter` to `lib/data.ts` + `PeriodKey` type**
Pure function, fully testable. No component changes yet.

**3 — Wire `period` searchParam in `page.tsx`**
Read the param, call `applyPeriodFilter`, pass `activePeriod` down. All downstream components already accept `filteredData` through existing props — no interface changes needed.

**4 — Build `PeriodFilter` Client Component**
Now the filter param has meaning in the server; build the UI to set it. Test that tab switching preserves or resets the period param (decide: reset to `all` on tab switch is simpler and less surprising).

**5 — Build `SparklineChart` Client Component**
Standalone, pure visual component. Easy to develop in isolation.

**6 — Update `KpiCard` and `KpiCards` for sparklines**
Thread `sparklineData` through the existing server component chain. No architecture changes, just prop additions.

**7 — Build `ExportButton` Client Component**
Last because it depends on the filtered data being correctly wired (Step 3). Tests: correct filename, correct headers, correct row count.

**Rationale for this order:**
- Steps 1-2 are pure logic with no UI, lowest risk.
- Steps 3-4 (period filter) are the highest-value feature and must land before export (export must export filtered data).
- Steps 5-6 (sparklines) are independent of filter and can be parallelized with Step 4.
- Step 7 (export) requires filter wiring to be complete.

---

## Anti-Patterns

### Anti-Pattern 1: Client-Side Period Filtering with useState

**What people do:** Store `period` in a `useState` inside a Client Component wrapper around the dashboard, filter data on the client.
**Why it's wrong:** Breaks the Server Component architecture. The entire dashboard must become a Client Component or a complex provider is needed. Data is no longer fetched fresh per filter change — you load all records upfront and filter in browser memory.
**Do this instead:** URL searchParam + server-side filter. Consistent with existing `tab` pattern.

### Anti-Pattern 2: Converting `KpiCard` to Client Component for Sparklines

**What people do:** Add `"use client"` to `KpiCard` to use Recharts directly.
**Why it's wrong:** `KpiCard` becomes a Client Component, which means its parent `KpiCards` also cannot be a Server Component (all ancestors of a client-imported component become part of the client bundle when the import chain reaches a server component).
**Do this instead:** Keep `KpiCard` as Server Component. Add a child `SparklineChart` Client Component. React allows Client Components as children of Server Components.

### Anti-Pattern 3: API Route for CSV Export

**What people do:** Create `/api/export?tab=daily&period=this-week` that fetches data and returns CSV.
**Why it's wrong:** Adds a network round-trip, duplicates the `getTeamDashboardData` + filter logic, requires re-authentication on the API route, and is unnecessary when data is already rendered client-side.
**Do this instead:** Generate CSV from the `records[]` array already passed as props to the Client Component.

### Anti-Pattern 4: Putting `normalizeDate` Only in `charts-section.tsx`

**What people do:** Leave `normalizeDate()` where it currently lives.
**Why it's wrong:** Period filtering in `page.tsx` needs to compare dates. If normalization only happens inside `ChartsSection`, the period filter in `page.tsx` operates on raw un-normalized strings (e.g., "2026. 2. 5") which breaks date comparison.
**Do this instead:** Extract to `lib/date-utils.ts`. Both `charts-section.tsx` and `lib/data.ts` import from there.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `page.tsx` → `PeriodFilter` | `activePeriod: PeriodKey` prop | Client Component reads its own URL params; prop is only needed to show active state |
| `page.tsx` → `ExportButton` | `records: DailyRecord[] \| WeeklyRecord[]` (serializable) | Filtered records passed as plain array — no server functions |
| `KpiCards` → `KpiCard` | `sparklineData: number[]` optional prop | Plain number array — crosses Server/Client boundary cleanly |
| `KpiCard` → `SparklineChart` | `data: number[], trend: 'up'\|'down'\|'neutral'` | Client Component import from Server Component — valid in App Router |
| `lib/date-utils.ts` → `lib/data.ts` | Pure functions, module import | No boundary crossing |
| `lib/date-utils.ts` → `charts-section.tsx` | Pure functions, module import | Removes duplication |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Sheets API | Unchanged — `lib/sheets.ts` | v1.1 features add no new API calls |
| Browser Download API | `URL.createObjectURL` + `<a>` click in `ExportButton` | No library needed; works in all modern browsers |

---

## Scaling Considerations

This is a single-team dashboard with ~90 records max. Scaling is not a concern. Notes for future reference only:

| Concern | Current approach | If data grew to 10K+ rows |
|---------|-----------------|--------------------------|
| Period filtering | Server-side in page.tsx (trivial for 90 rows) | Still fine; move to DB query if Google Sheets becomes slow |
| CSV export | In-memory Blob (trivial for 90 rows) | Stream download via API route if rows exceed ~50K |
| Sparkline data | Last 14 records sliced in memory | Still trivial |

---

## Sources

- Next.js 16 App Router Server/Client Component boundary: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns (HIGH confidence — official docs)
- Next.js 16 searchParams as Promise (async): https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional (HIGH confidence — official docs, matches existing code in page.tsx)
- Recharts LineChart for sparklines: https://recharts.org/en-US/api/LineChart (HIGH confidence — existing Recharts usage in codebase confirmed)
- Browser CSV download without library: URL.createObjectURL + Blob pattern — standard Web API, no source needed (HIGH confidence)
- Existing codebase patterns (v1.0): `components/dashboard/tab-nav.tsx` for URL-as-state, `components/dashboard/charts/*.tsx` for Client Component pattern, `lib/data.ts` for server-side data transformation (HIGH confidence — direct code inspection)

---

*Architecture research for: v1.1 features — period filter, CSV export, KPI sparklines*
*Researched: 2026-02-27*
