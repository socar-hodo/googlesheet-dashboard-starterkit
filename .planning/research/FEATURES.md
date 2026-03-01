# Feature Research

**Domain:** Korean B2B operations/sales dashboard — v1.1 Analysis Tools Enhancement
**Researched:** 2026-02-27
**Confidence:** HIGH (codebase direct inspection + web-verified patterns)

> v1.0 research addressed the full dashboard foundation. This document focuses **exclusively** on the three new v1.1 features:
> 1. 기간 선택기 (period filter: 이번 주 / 지난 주 / 이번 달 / 지난 달)
> 2. CSV/Excel 내보내기 (export)
> 3. KPI 스파크라인 미니 차트 (sparkline mini-charts on KPI cards)

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are behaviors users consider "obvious" for a dashboard with period filtering and export. Missing them makes the feature feel broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 기간 선택기: preset buttons persist in URL | Dashboards that lose filter state on back/refresh are perceived as broken. The existing tab already uses URL searchParams — period filter must follow the same pattern | LOW | Extend existing `tab` searchParam to also carry `period=this-week\|last-week\|this-month\|last-month`. Server Component reads it, filters data array before passing to components. Bookmarkable and shareable |
| 기간 선택기: applies to KPI cards, charts, and data table simultaneously | A filter that only affects some widgets creates confusion — users check if the filter "worked" on every widget | MEDIUM | All three component groups (KpiCards, ChartsSection, DataTable) receive the same filtered subset. The filter is a data-slicing operation applied upstream in the Server Component before props are passed down |
| 기간 선택기: currently active period is visually highlighted | Toggle buttons without a clear "active" state look like they do nothing after clicking | LOW | Use shadcn/ui `Tabs` or `Button` with variant toggling. Active button gets solid/filled style; inactive gets ghost/outline. Matches existing TabNav pattern |
| 기간 선택기: Daily tab shows week/day presets, Weekly tab shows week/month presets | Showing "이번 달" for Daily makes sense; showing "지난 주" for Weekly tab also makes sense. Mismatch (e.g., showing single-day presets on Weekly tab) confuses users | MEDIUM | Period presets are tab-aware. Daily tab: 이번 주, 지난 주, 이번 달, 지난 달. Weekly tab: 이번 달, 지난 달, 전체 (all weeks in data). Implement with conditional rendering in the period selector component |
| CSV 내보내기: file downloads immediately on button click | Server-round-trip export is unexpected. Users expect the button to trigger an immediate browser download, especially for small datasets | LOW | Client-side Blob generation: `data:text/csv` or `new Blob([content], { type: 'text/csv' })` + anchor click. No server API route needed for this dataset size |
| CSV 내보내기: filename includes period and tab context | A downloaded file called `data.csv` is confusing. Users need context in the filename for file management | LOW | Generate filename dynamically: `경남울산_일별_이번주_20260227.csv`. Include: team abbreviation, tab (일별/주차별), period label, download date |
| CSV 내보내기: Korean characters render correctly in Excel | The #1 CSV export failure mode: opening a Korean CSV in Excel shows garbled text (mojibake) because Excel defaults to system encoding, not UTF-8 | LOW | Prepend UTF-8 BOM (`\uFEFF`) to CSV content. This is the standard fix for Korean + Excel compatibility. Without it, Korean column headers and values will display as garbage characters |
| KPI 스파크라인: trend direction is immediately readable | A sparkline with no discernible direction communicates nothing. Users should see "going up" or "going down" without thinking | LOW | Use a simple line sparkline (not bar) — line direction is intuitively read as trend. Stroke color matches the KPI card's delta color (green=positive trend, red=negative trend) |
| KPI 스파크라인: does not break the KPI card layout | Sparklines that push card height inconsistently or cause text to shift make the grid feel unstable | LOW | Fixed pixel height (40-48px). `ResponsiveContainer` with explicit height. No tooltip, no axes, no labels. Pure visual element that fits within the existing KpiCard component's `CardContent` |

### Differentiators (Valuable but Not Expected)

These elevate the feature beyond baseline expectations.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 기간 선택기: "전체" (all data) as default | Most period selectors default to "this week," which immediately limits the view. Defaulting to all data preserves the existing behavior users are used to, and "all data" is the best starting context for understanding trends. Period filter then narrows | LOW | When no `period` searchParam is set, all records pass through unfiltered. This is the zero-cost default — no param means no filter |
| 기간 선택기: empty state message when period yields no data | If "지난 주" filter finds zero matching records (e.g., data not yet entered), a blank dashboard without explanation creates panic ("is the system broken?") | LOW | Detect empty filtered array, render a contextual message: "이번 기간에 데이터가 없습니다 (기간: 지난 주)". Reuse existing empty state pattern in KpiCards |
| CSV 내보내기: includes computed columns (GPM %) | The raw sheet data has revenue and profit separately; GPM % is computed. Exporting only raw columns forces users to recalculate GPM themselves in Excel — defeating the purpose | MEDIUM | Add GPM % as a computed column in the export: `(profit / revenue * 100).toFixed(1)`. Also include the formatted columns (revenue in 만원 units alongside raw values) if the audience is humans not machines |
| CSV 내보내기: respects current period filter | Exporting "all data" when the user is viewing "이번 달" is disorienting. Export should match what is on screen | LOW | Pass the current filtered data (already sliced by period filter) to the export function, not the raw full dataset. Zero extra logic — the filtered array is already available |
| KPI 스파크라인: uses last N data points (not full history) | A sparkline over all available months of data flattens recent variation into invisibility. For a team checking weekly/daily performance, the last 7 days or last 8 weeks is the meaningful window | LOW | Slice the last 7 records for Daily tab sparklines; last 8 records for Weekly tab sparklines. This window size is appropriate for the data volumes this team generates |
| KPI 스파크라인: area fill below the line | Area sparklines (line + shaded area below) communicate both trend direction and magnitude more clearly than a bare line. Standard pattern in production dashboard tools (Stripe, Linear, Vercel analytics) | LOW | Recharts `AreaChart` with `Area` component using low-opacity fill. `fillOpacity={0.15}` keeps it subtle. No additional libraries required — Recharts is already installed |
| Excel (.xlsx) 내보내기 option | CSV opens as plain text in some environments; `.xlsx` opens natively in Excel with proper column widths and formatting. Business users strongly prefer `.xlsx` | HIGH | Requires `xlsx` library (~500KB minified, ~150KB gzipped). Given this is a team internal tool and bundle size is not a primary constraint, xlsx is acceptable. However, the bundle cost is real — assess whether CSV is sufficient first |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 기간 선택기: custom date range picker (날짜 직접 입력) | "I want to see Feb 10 to Feb 20 specifically" | PROJECT.md explicitly lists "사용자 지정 날짜 범위 필터" as Out of Scope. Beyond scope, a date range picker adds: calendar UI component, date parsing/validation, edge cases (cross-month ranges, partial weeks), and significantly higher complexity. The team primarily cares about standard reporting periods | Four preset buttons: 이번 주, 지난 주, 이번 달, 지난 달. Covers 95%+ of real queries. The data table already shows all rows for drill-down |
| CSV 내보내기: server-side API route for export | "Generate the CSV on the server for security" | This dashboard is read-only with data from Google Sheets. There is no sensitive data requiring server-side generation. Client-side Blob export is instant, requires no API route, and has zero server cost | Client-side Blob + anchor download. Data is already fetched and available in component props |
| CSV 내보내기: PDF report generation | "I want a formatted PDF report to send management" | PDF generation requires server-side rendering (puppeteer, react-pdf, or similar). Adds ~50MB+ of dependency, requires a server process, and the output quality for dashboards is poor compared to a browser screenshot | For report sharing: the dashboard is already clean enough to screenshot. Alternatively, direct link to the Google Sheet (source of truth) |
| KPI 스파크라인: interactive sparklines (hover tooltip, click to expand) | "I want to see the exact value when I hover" | Sparklines are intentionally non-interactive — they are "at a glance" trend indicators. Adding hover interaction makes them mini-charts, which conflicts with the full-sized charts already on the page. Two interactive chart surfaces for the same data create UX confusion | Sparklines are visual only — no tooltip, no hover, no click. The full charts below the KPI cards provide interactive detail |
| KPI 스파크라인: sparklines on every possible metric variant | "Show me sparklines for achievement rate, MTD totals, comparisons..." | Each additional sparkline data series requires its own computation and rendering. The KPI card layout has limited vertical space. More sparklines = smaller, less readable sparklines | One sparkline per KPI card showing the raw metric value trend (revenue, GPM, usage count, utilization rate, usage hours). Keep it to the five existing KPI metrics |
| 기간 선택기: applying filter via new server fetch (API call on each selection) | "Filter on the server for freshness" | The existing data load pattern fetches all data once on page load. Triggering a new server fetch for each period selection would: add latency to each click, cause full-page Suspense boundary triggers, lose the snappy feel of client-side filtering. The data volume (a few hundred daily rows at most) is trivially filterable client-side | Client-side filter: data is already loaded, period selection just slices the array. URL searchParam update + router.replace (existing pattern). Zero additional network calls |

---

## Feature Dependencies

```
[Existing: TeamDashboardData (daily[], weekly[])]
    |
    +---> [기간 선택기 — PeriodFilter component]
    |         |
    |         +--produces--> [filtered DailyRecord[] or WeeklyRecord[]]
    |         |                   |
    |         |                   +--feeds--> [KpiCards (filtered)]
    |         |                   +--feeds--> [ChartsSection (filtered)]
    |         |                   +--feeds--> [DataTable (filtered)]
    |         |
    |         +--requires--> [URL searchParams pattern (already exists via TabNav)]
    |         +--requires--> [date parsing logic (new: parse DailyRecord.date strings)]
    |
    +---> [CSV 내보내기 — ExportButton component]
    |         |
    |         +--requires--> [filtered data (기간 선택기 output, or full data if no filter)]
    |         +--requires--> [UTF-8 BOM for Korean Excel compat]
    |         +--produces--> [browser file download, no server round-trip]
    |
    +---> [KPI 스파크라인 — SparklineChart component]
              |
              +--requires--> [series data: last N records per KPI metric]
              +--requires--> [Recharts AreaChart/LineChart (already installed)]
              +--embeds--> [inside KpiCard component (existing)]
              +--NOT requires--> [기간 선택기] (sparklines use last N records from full data,
                                               not the period-filtered subset — design decision)
```

### Dependency Notes

- **기간 선택기 requires date string parsing:** `DailyRecord.date` is stored as a raw sheet string (e.g., "2026-02-21" or potentially "2026/02/21" or "2026년 2월 21일"). The filter logic must handle whatever format the sheet uses. This is a potential pitfall — verify actual format from mock data or live sheet before implementing.

- **기간 선택기 is a prerequisite for meaningful CSV export:** Without period filter, export always dumps all data. With period filter in place, export naturally follows the filtered view. Implement period filter first, then export.

- **스파크라인 does NOT depend on 기간 선택기:** Sparklines show the historical trend of the last N data points from the complete dataset. They answer "what has been the direction?" not "what happened in this specific period?" Using period-filtered data for sparklines would break their purpose (e.g., "이번 주" filter with only 5 data points would make a meaningless sparkline).

- **스파크라인 requires KpiCard interface extension:** The existing `KpiCardProps` has no `sparklineData` prop. KpiCard needs to accept an optional `sparklineData: number[]` prop and conditionally render the sparkline component. This is a backwards-compatible extension.

- **CSV export accesses already-rendered data:** The export button can access filtered data via component props or a shared state/context. No new data fetch required. The simplest implementation: pass filtered array into the ExportButton as a prop.

---

## MVP Definition for v1.1

### Build Now (v1.1 launch)

The three v1.1 target features, all required for the milestone.

- [ ] **기간 선택기 — preset buttons** — 이번 주, 지난 주, 이번 달, 지난 달, (전체). Stored in URL searchParam `period`. Applied client-side by slicing the data array in the page Server Component or a shared filtering utility. Affects KpiCards, ChartsSection, DataTable simultaneously
- [ ] **CSV 내보내기 — client-side download** — Button in the dashboard header or table section. Exports the currently filtered dataset. UTF-8 BOM prepended. Computed GPM % column included. Filename includes context (tab + period + date)
- [ ] **KPI 스파크라인 — area mini-charts** — One per KPI card, showing last 7 records (Daily) or last 8 records (Weekly) of that card's metric. AreaChart with Area component, no axes, no tooltip, no labels. Height: 44px fixed. Color matches card's delta direction

### Defer to v1.2+

- [ ] **Excel (.xlsx) export** — Only if team explicitly requests native Excel format. CSV is sufficient for the immediate need and has zero bundle cost. xlsx adds ~150KB gzipped
- [ ] **기간 선택기: Weekly-specific presets** — "이번 달", "지난 달" for weekly tab currently works by filtering on week strings/numbers, which requires knowing the week-to-month mapping. This is an edge case — implement "전체/이번 달/지난 달" for weekly tab only after daily filter is validated
- [ ] **Export button: multiple formats menu** — CSV + Excel + (future) PDF as a dropdown. Premature until users confirm what they actually need

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 기간 선택기 (preset buttons + URL param) | HIGH — directly answers "how are we doing this week vs last week?" | LOW — client-side array slice, extends existing URL param pattern | P1 |
| CSV 내보내기 (UTF-8 BOM, with GPM column) | MEDIUM — data already in Google Sheets, but export is convenient for reporting | LOW — Blob download, no new library needed for CSV | P1 |
| KPI 스파크라인 (AreaChart mini, last N records) | HIGH — significantly increases information density of KPI cards without scrolling | LOW — Recharts already installed, component is self-contained | P1 |
| 기간 선택기: Weekly tab preset variants | MEDIUM — weekly tab has different periodicity concept | MEDIUM — week string format parsing adds ambiguity | P2 |
| Excel (.xlsx) 내보내기 | LOW-MEDIUM — CSV usually sufficient, xlsx is nicer | MEDIUM — adds xlsx dependency (~150KB gzipped) | P3 |
| Sparkline interactive tooltip | LOW — sparklines are intentionally non-interactive | MEDIUM — Recharts tooltip needs absolute positioning in small space | P3 |

**Priority key:**
- P1: Build for v1.1 launch — these are the milestone targets
- P2: Evaluate after v1.1 validation
- P3: Nice to have, future consideration

---

## Implementation Patterns (for Roadmap Reference)

### 기간 선택기 — How It Should Work

```
User clicks "이번 주" button
    → PeriodFilter Client Component calls router.replace with ?tab=daily&period=this-week
    → Next.js Server Component re-renders (force-dynamic is already set)
    → getTeamDashboardData() fetches full dataset (unchanged)
    → filterByPeriod(data.daily, 'this-week') returns only records within this week
    → Filtered array passed to KpiCards, ChartsSection, DataTable
    → All widgets show only this week's data
    → URL is bookmarkable: /dashboard?tab=daily&period=this-week
```

**Date comparison approach:** Parse `DailyRecord.date` string to Date object; compare against computed week/month boundaries for today's date (`new Date()`). Week boundaries: Monday 00:00 to Sunday 23:59 (Korean business week convention). Month boundaries: first of month to last of month.

**Critical unknown:** The actual date string format in the Google Sheet. Mock data uses "2026-02-21" (ISO), but the actual sheet may use "2026/02/21", "2월 21일", or Excel serial numbers. The `parseDailySheet` function stores the raw string from `DAILY_HEADERS.date`. **Must verify before implementing the date filter.**

### CSV 내보내기 — Implementation Sketch

```typescript
// No library needed for CSV. Pure string manipulation.
function exportToCSV(records: DailyRecord[], period: string) {
  const BOM = '\uFEFF'; // UTF-8 BOM — required for Korean in Excel
  const headers = ['날짜', '매출', 'GPM(%)', '이용시간', '이용건수', '가동률(%)'];
  const rows = records.map(r => [
    r.date,
    r.revenue,
    r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(1) : '0.0',
    r.usageHours,
    r.usageCount,
    r.utilizationRate.toFixed(1),
  ]);
  const csv = BOM + [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `경남울산_일별_${period}_${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

This requires no npm packages. File size for a year of daily records: ~15KB. Trivially fast.

### KPI 스파크라인 — Recharts Pattern

```tsx
// Minimal AreaChart sparkline using existing Recharts installation
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

function SparklineChart({ data, color }: { data: number[], color: string }) {
  const chartData = data.map(v => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
              fill={color} fillOpacity={0.12} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

No new dependencies. No axes, no labels, no tooltip. The `color` prop is driven by the existing `getDeltaColorClass` logic — positive delta = green stroke, negative = red stroke. The sparkline data is sliced from the full (unfiltered) dataset: `data.daily.slice(-7).map(r => r.revenue)` for the revenue KPI card.

---

## Architecture Impact on Existing Components

| Existing Component | v1.1 Change | Effort |
|-------------------|-------------|--------|
| `app/(dashboard)/dashboard/page.tsx` | Add period filter reading from searchParams; apply filterByPeriod() before passing to child components | LOW |
| `components/dashboard/tab-nav.tsx` | Extend or companion component: PeriodFilter with the same URL param pattern | LOW |
| `components/dashboard/kpi-card.tsx` | Add optional `sparklineData?: number[]` prop; render SparklineChart conditionally | LOW |
| `components/dashboard/kpi-cards.tsx` | Pass last-N data slices as sparklineData to each KpiCard | LOW |
| `components/dashboard/data-table.tsx` | Receives already-filtered records — no change needed to DataTable itself | NONE |
| `components/dashboard/charts/charts-section.tsx` | Receives already-filtered data — no change needed | NONE |
| New: `components/dashboard/period-filter.tsx` | Client Component, same pattern as TabNav | NEW |
| New: `components/dashboard/export-button.tsx` | Client Component with Blob download logic | NEW |
| New: `components/dashboard/sparkline-chart.tsx` | Pure presentational, wraps Recharts AreaChart | NEW |
| New: `lib/period-utils.ts` | filterByPeriod(), getWeekBounds(), getMonthBounds() utilities | NEW |

---

## Sources

- Codebase direct inspection: `components/dashboard/tab-nav.tsx`, `components/dashboard/kpi-card.tsx`, `components/dashboard/kpi-cards.tsx`, `app/(dashboard)/dashboard/page.tsx`, `types/dashboard.ts`, `lib/data.ts` (HIGH confidence — direct code read)
- Project requirements: `.planning/PROJECT.md` (HIGH confidence — project owner validated)
- Web research: Dashboard period filter UX best practices — lollypop.design/blog/2025/july/filter-ux-design/, aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/ (MEDIUM confidence)
- Web research: CSV export Korean Excel compatibility — dev.to/jasurkurbanov/how-to-export-data-to-excel-from-api-using-react-incl-custom-headers-5ded, dhiwise.com/post/react-csv-best-practices (HIGH confidence — BOM requirement is well-documented)
- Web research: Recharts sparkline patterns — recharts.github.io/en-US/api/LineChart/, chakra-ui.com/docs/charts/sparkline, tremor.so/docs/visualizations/spark-chart (HIGH confidence — Recharts is already installed and in use)
- Web research: xlsx bundle size — github.com/SheetJS/sheetjs/issues/694, npmtrends.com comparison (MEDIUM confidence — exact current bundle size not verified)

---
*Feature research for: v1.1 Analysis Tools (기간 선택기, CSV 내보내기, KPI 스파크라인)*
*Researched: 2026-02-27*
