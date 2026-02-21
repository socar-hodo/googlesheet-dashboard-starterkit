# Architecture Research

**Domain:** Team sales dashboard with dual data sources (Daily/Weekly Google Sheets)
**Researched:** 2026-02-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
+-----------------------------------------------------------------------+
|                        Browser (Client)                                |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | TabSwitcher       |  | KPI Cards (x4)    |  | Recharts Charts   |  |
|  | (Client Component)|  | (Server Component)|  | (Client Component)|  |
|  +--------+----------+  +-------------------+  +-------------------+  |
|           | tab=daily|weekly (searchParams)                            |
+-----------+-----------------------------------------------------------+
            | Full page navigation (soft nav)
+-----------v-----------------------------------------------------------+
|                   Dashboard Page (Server Component)                    |
|  reads searchParams.tab --> decides which data to fetch                |
|  +-----------------------------+  +-----------------------------+     |
|  | getTeamDashboardData("daily")|  | getTeamDashboardData("weekly")|  |
|  +-------------+---------------+  +-------------+---------------+     |
|                |                                |                     |
+----------------+--------------------------------+---------------------+
                 |                                |
+----------------v--------------------------------v---------------------+
|                     Data Integration Layer (lib/data.ts)               |
|  +-------------------+      +--------------------+                    |
|  | parseDailySheet() |      | parseWeeklySheet() |                    |
|  +--------+----------+      +---------+----------+                    |
|           |                           |                               |
+-----------|---------------------------+-------------------------------+
            |                           |
+-----------v---------------------------v-------------------------------+
|                     Google Sheets API (lib/sheets.ts)                  |
|  fetchSheetData("daily!A:G")    fetchSheetData("weekly!A:F")          |
+-----------+---------------------------+-------------------------------+
            |                           |
+-----------v---------------------------v-------------------------------+
|                     Google Sheets Spreadsheet                          |
|  +------------------+  +-------------------+                          |
|  | "daily" sheet    |  | "weekly" sheet    |                          |
|  | date|rev|profit  |  | week|rev|profit   |                          |
|  | |hours|count|    |  | |hours|count|     |                          |
|  | utiliz|target    |  | utiliz              |                         |
|  +------------------+  +-------------------+                          |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `types/dashboard.ts` | Define DailyRecord, WeeklyRecord, TeamKpi, TeamDashboardData types | Pure TypeScript interfaces, no runtime code |
| `lib/sheets.ts` | Google Sheets API wrapper with JWT auth | Unchanged from current -- `fetchSheetData(range)` returns `string[][]` |
| `lib/data.ts` | Parse sheet rows into typed records, compute KPIs, apply fallback | New `getTeamDashboardData(tab)` replaces old `getDashboardData()` |
| `lib/mock-data.ts` | Provide mock DailyRecord[] and WeeklyRecord[] for development | Matches new type structure |
| `app/(dashboard)/dashboard/page.tsx` | Server Component that reads `searchParams.tab`, fetches correct data, renders | Async function with searchParams prop |
| `components/dashboard/tab-switcher.tsx` | Client Component for Daily/Weekly tab UI | Uses `<Link>` with searchParams to avoid client state |
| `components/dashboard/kpi-cards.tsx` | Display 4 KPI cards with target vs actual + trend | Server Component, receives computed KPI data |
| `components/dashboard/trend-chart.tsx` | Recharts line chart showing actual vs target over time | Client Component, receives array data |
| `components/dashboard/profit-chart.tsx` | Recharts bar/area chart for profit trend | Client Component |
| `components/dashboard/utilization-chart.tsx` | Recharts chart for utilization rate visualization | Client Component |

## Recommended Project Structure

```
types/
  dashboard.ts              # NEW: DailyRecord, WeeklyRecord, TeamKpi, TeamDashboardData
                            # (replaces old KpiData, MonthlyRevenue, etc.)

lib/
  sheets.ts                 # UNCHANGED: fetchSheetData(range), isGoogleSheetsConfigured()
  data.ts                   # REWRITE: getTeamDashboardData(tab), parseDailySheet(), parseWeeklySheet(), computeKpis()
  mock-data.ts              # REWRITE: mockDailyRecords, mockWeeklyRecords, mockTeamDashboardData
  utils.ts                  # UNCHANGED: cn() utility

app/(dashboard)/dashboard/
  page.tsx                  # REWRITE: reads searchParams.tab, fetches per-tab data

components/dashboard/
  tab-switcher.tsx          # NEW: Client Component -- Daily/Weekly tabs using Link + searchParams
  kpi-cards.tsx             # REWRITE: target vs actual KPI cards with achievement rate
  trend-chart.tsx           # NEW: actual vs target line chart (replaces revenue-chart.tsx)
  profit-chart.tsx          # NEW: profit trend visualization
  utilization-chart.tsx     # NEW: utilization rate chart
  period-comparison.tsx     # NEW: comparison widget (this week vs last week, etc.)

components/dashboard/        # TO REMOVE after migration
  revenue-chart.tsx          # replaced by trend-chart.tsx
  category-chart.tsx         # no longer needed (no category distribution in team data)
  recent-orders-table.tsx    # no longer needed (no orders in team data)
```

### Structure Rationale

- **types/dashboard.ts:** Single file for all types because the team dashboard is a single domain. No need for per-feature type files.
- **lib/data.ts as integration layer:** Keeps the existing 3-tier pattern (sheets -> data -> mock) but replaces the parsing functions and main export. This is the correct seam for the rewrite.
- **components/dashboard/:** One component per visual concern. Each chart is its own Client Component because Recharts requires DOM. Tab switcher is Client for interactivity but uses Link-based navigation, not local state.
- **No new routes:** The constraint is "single page, tab switching." This is achieved via searchParams, not route groups.

## Architectural Patterns

### Pattern 1: SearchParams-Driven Tab Switching (Server-First)

**What:** Use URL searchParams (`?tab=daily` / `?tab=weekly`) to control which data the Server Component fetches. The tab switcher renders `<Link>` elements that change the searchParam. Next.js App Router treats this as a soft navigation that re-renders the Server Component without a full page reload.

**When to use:** When each tab requires different server-side data fetching and you want the tab state to be URL-shareable and back-button friendly.

**Trade-offs:**
- Pro: Tab state is in the URL (shareable, bookmarkable, back-button works)
- Pro: Server Component re-executes on tab change, so data is always fresh
- Pro: No client-side state management for data, no useEffect/fetch
- Con: Soft navigation adds ~100-200ms round-trip vs instant client tab switch
- Verdict: For a dashboard that fetches fresh data on every view, the server round-trip is the point, not a cost

**Example:**
```typescript
// app/(dashboard)/dashboard/page.tsx
interface DashboardPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const activeTab = params.tab === "weekly" ? "weekly" : "daily";
  const data = await getTeamDashboardData(activeTab);

  return (
    <div className="space-y-6">
      <TabSwitcher activeTab={activeTab} />
      <KpiCards kpis={data.kpis} />
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <TrendChart data={data.records} type={activeTab} />
        </div>
        <div className="lg:col-span-3">
          <UtilizationChart data={data.records} />
        </div>
      </div>
      <ProfitChart data={data.records} />
      <PeriodComparison current={data.currentPeriod} previous={data.previousPeriod} />
    </div>
  );
}
```

```typescript
// components/dashboard/tab-switcher.tsx
"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function TabSwitcher({ activeTab }: { activeTab: "daily" | "weekly" }) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      <Link
        href="/dashboard?tab=daily"
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          activeTab === "daily" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        일별 현황
      </Link>
      <Link
        href="/dashboard?tab=weekly"
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          activeTab === "weekly" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        주차별 현황
      </Link>
    </div>
  );
}
```

**Note on Next.js 16 searchParams:** In Next.js 15+, `searchParams` in page props is a Promise that must be awaited. This is confirmed by the existing codebase running Next.js 16.1.6. Confidence: HIGH (derived from codebase version + official Next.js 15 migration docs pattern).

### Pattern 2: Unified Data Fetching with Tab Dispatch

**What:** A single exported function `getTeamDashboardData(tab)` that dispatches to the correct sheet parser based on the active tab. This preserves the existing pattern of one data-fetching entry point while supporting two data sources.

**When to use:** When multiple data sources feed the same UI structure and you want a clean API boundary.

**Trade-offs:**
- Pro: Page component has one call site regardless of tab
- Pro: Fallback logic stays centralized
- Pro: Easy to test in isolation
- Con: Both tabs share the same return type, which forces a union or generic approach

**Example:**
```typescript
// lib/data.ts
export async function getTeamDashboardData(
  tab: "daily" | "weekly"
): Promise<TeamDashboardData> {
  if (!isGoogleSheetsConfigured()) {
    return tab === "daily" ? mockDailyDashboardData : mockWeeklyDashboardData;
  }

  try {
    if (tab === "daily") {
      const rows = await fetchSheetData("daily!A1:G100");
      const records = rows ? parseDailySheet(rows) : mockDailyRecords;
      return buildDashboardData(records, "daily");
    } else {
      const rows = await fetchSheetData("weekly!A1:F100");
      const records = rows ? parseWeeklySheet(rows) : mockWeeklyRecords;
      return buildDashboardData(records, "weekly");
    }
  } catch (error) {
    console.error(`${tab} 시트 데이터 가져오기 실패:`, error);
    return tab === "daily" ? mockDailyDashboardData : mockWeeklyDashboardData;
  }
}
```

### Pattern 3: Computed KPIs from Records (Not Separate Sheet)

**What:** Instead of storing KPIs in a separate sheet range, compute them from the raw daily/weekly records. The latest record's values become "current," the previous period is calculated from the record set, and target comparison comes from the target column in the daily sheet.

**When to use:** When KPIs are derivable from the detail data and you want a single source of truth.

**Trade-offs:**
- Pro: No separate KPI sheet to maintain, no sync issues
- Pro: KPIs always match the underlying data
- Con: Slightly more computation server-side (trivial for <365 rows)
- Verdict: Correct approach for this use case. The daily sheet has a target column, so all needed info is in the records.

**Example:**
```typescript
// lib/data.ts
function computeKpisFromRecords(
  records: DailyRecord[] | WeeklyRecord[],
  type: "daily" | "weekly"
): TeamKpi[] {
  const latest = records[records.length - 1];
  const previous = records[records.length - 2];

  if (!latest) return getDefaultKpis();

  const revenueChange = previous
    ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
    : 0;

  return [
    {
      label: "매출",
      value: latest.revenue,
      target: type === "daily" ? (latest as DailyRecord).monthlyTarget : undefined,
      change: revenueChange,
      format: "currency",
    },
    {
      label: "손익",
      value: latest.profit,
      change: previous ? ((latest.profit - previous.profit) / Math.abs(previous.profit)) * 100 : 0,
      format: "currency",
    },
    {
      label: "가동률",
      value: latest.utilizationRate,
      format: "percent",
    },
    {
      label: "이용건수",
      value: latest.usageCount,
      change: previous ? ((latest.usageCount - previous.usageCount) / previous.usageCount) * 100 : 0,
      format: "number",
    },
  ];
}
```

## Data Flow

### Request Flow (Tab Switch)

```
User clicks "주차별 현황" tab
    |
    v
<Link href="/dashboard?tab=weekly"> triggers soft navigation
    |
    v
Next.js App Router re-renders Server Component (no full page reload)
    |
    v
DashboardPage({ searchParams }) -- awaits searchParams
    |
    v
params.tab === "weekly" --> getTeamDashboardData("weekly")
    |
    v
fetchSheetData("weekly!A1:F100") -- Google Sheets API call
    |
    v
parseWeeklySheet(rows) -- transform string[][] to WeeklyRecord[]
    |
    v
buildDashboardData(records, "weekly") -- compute KPIs, prepare chart data
    |
    v
TeamDashboardData returned to page
    |
    v
Page renders: TabSwitcher + KpiCards + Charts + PeriodComparison
    |
    v
Client Components hydrate (Recharts renders SVG, TabSwitcher highlights active)
```

### Key Data Flows

1. **Initial Page Load (daily default):** Browser -> `/dashboard` (no searchParams) -> Server Component defaults to `tab=daily` -> fetches daily sheet -> renders full dashboard
2. **Tab Switch:** Click weekly tab -> soft nav to `/dashboard?tab=weekly` -> Server Component re-executes with new searchParams -> fetches weekly sheet -> renders dashboard with weekly data
3. **Refresh/Share:** URL contains `?tab=weekly` -> landing on the page fetches weekly immediately. URL is the source of truth for which tab is active.

### State Management

- **Tab state:** URL searchParams (not React state). This is intentional -- the tab determines what data to fetch server-side.
- **Session:** NextAuth JWT via `useSession()` (unchanged)
- **Theme:** next-themes `useTheme()` (unchanged)
- **Sidebar:** Local `useState` (unchanged)
- **No global state library needed:** All data flows top-down from the Server Component. No shared mutable state across components.

## Type Structure

### New Types (replace all existing types in `types/dashboard.ts`)

```typescript
// types/dashboard.ts

/** 일별 레코드 -- daily 시트의 한 행 */
export interface DailyRecord {
  date: string;             // "2026-02-21" (YYYY-MM-DD)
  revenue: number;          // 매출 (원)
  profit: number;           // 손익 (원)
  usageHours: number;       // 이용시간 (시간)
  usageCount: number;       // 이용건수
  utilizationRate: number;  // 가동률 (%, 0-100)
  monthlyTarget: number;    // 매월 목표 매출 (원)
}

/** 주차별 레코드 -- weekly 시트의 한 행 */
export interface WeeklyRecord {
  week: string;             // "2026-W08" 또는 "2월 3주차" (시트 형식에 따름)
  revenue: number;          // 매출 (원)
  profit: number;           // 손익 (원)
  usageHours: number;       // 이용시간 (시간)
  usageCount: number;       // 이용건수
  utilizationRate: number;  // 가동률 (%, 0-100)
}

/** KPI 카드 하나의 데이터 */
export interface TeamKpi {
  label: string;            // "매출", "손익", "가동률", "이용건수"
  value: number;            // 현재 값
  target?: number;          // 목표 값 (있으면 달성률 표시)
  change?: number;          // 전기 대비 변동률 (%)
  format: "currency" | "percent" | "number" | "hours";  // 표시 형식
}

/** 기간 비교 데이터 */
export interface PeriodComparison {
  label: string;            // "이번 주 vs 지난 주" 등
  current: number;
  previous: number;
  changePercent: number;
}

/** 대시보드 전체 데이터 (탭 공통 구조) */
export interface TeamDashboardData {
  tab: "daily" | "weekly";
  records: DailyRecord[] | WeeklyRecord[];
  kpis: TeamKpi[];
  periodComparisons: PeriodComparison[];
}
```

### Type Migration Strategy

The old types (`KpiData`, `MonthlyRevenue`, `CategoryDistribution`, `RecentOrder`, `DashboardData`) should be **deleted entirely, not deprecated**. Rationale:

1. The old types represent a generic e-commerce starter kit (orders, categories, monthly revenue). None of these concepts exist in the team sales domain.
2. No gradual migration is possible -- the data shapes are fundamentally different.
3. TypeScript will surface every broken import immediately at build time, making the migration mechanical.

**Migration order:**
1. Write new types in `types/dashboard.ts` (overwrite file)
2. Rewrite `lib/mock-data.ts` to match new types
3. Rewrite `lib/data.ts` parsers and main export
4. Rewrite `app/(dashboard)/dashboard/page.tsx` to use new data shape
5. Create new components, delete old ones
6. Run `npm run build` -- TypeScript will catch any remaining references

## Build Order (Dependencies Between Components)

The components have a strict dependency chain. Build in this order:

```
Phase 1: Foundation (no UI changes, everything compiles)
  1. types/dashboard.ts       -- new types (DailyRecord, WeeklyRecord, TeamKpi, TeamDashboardData)
  2. lib/mock-data.ts          -- mock data matching new types
  3. lib/data.ts               -- new parsers + getTeamDashboardData()
     (At this point, the old page.tsx will have type errors -- expected)

Phase 2: Page + Tab Shell (dashboard renders, tabs work)
  4. components/dashboard/tab-switcher.tsx   -- Daily/Weekly tab UI
  5. app/(dashboard)/dashboard/page.tsx      -- rewrite to use searchParams + new data
  6. components/dashboard/kpi-cards.tsx       -- rewrite for TeamKpi[] with target/achievement

Phase 3: Charts (visual data display)
  7. components/dashboard/trend-chart.tsx         -- actual vs target line chart
  8. components/dashboard/profit-chart.tsx         -- profit trend
  9. components/dashboard/utilization-chart.tsx    -- utilization rate

Phase 4: Comparison + Cleanup
  10. components/dashboard/period-comparison.tsx   -- period-over-period comparison
  11. Delete: revenue-chart.tsx, category-chart.tsx, recent-orders-table.tsx
```

**Why this order:**
- Types must exist before anything can import them
- Mock data must exist before `data.ts` can reference it for fallback
- `data.ts` must export `getTeamDashboardData` before the page can call it
- The page must render before individual chart components matter
- KPI cards are simpler than charts (Server Component, no Recharts), so they come first
- Charts are independent of each other, so phases 3's items could be parallelized
- Cleanup comes last to avoid broken imports during development

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 users (current) | Direct Google Sheets API on each page load. No caching. This is fine -- the team is small and Sheets API has generous quotas. |
| 10-50 users | Add `revalidate` export to the page or use `unstable_cache` in `data.ts` with a 60-second TTL. Prevents hammering Sheets API if multiple users refresh simultaneously. |
| 50+ users | Unlikely for a team dashboard. If needed, add a lightweight caching layer (Redis or even in-memory Map with TTL) in front of the Sheets API call. |

### Scaling Priorities

1. **First bottleneck: Google Sheets API rate limits.** The Sheets API allows 60 requests per minute per project per user (service account). With 10+ users refreshing frequently, add `unstable_cache` with 30-60s revalidation.
2. **Second bottleneck: Server Component render time.** If sheets grow to thousands of rows, parsing becomes slow. Limit the fetch range (e.g., last 90 days for daily, last 26 weeks for weekly) rather than fetching everything.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Tab State with useEffect Fetching

**What people do:** Use `useState` for the active tab and `useEffect` + `fetch` to call an API route that returns dashboard data. Each tab switch triggers a client-side fetch.

**Why it's wrong:** This throws away the Server Component advantage. You end up maintaining an API route (`/api/dashboard?tab=daily`) that duplicates the data-fetching logic, and the initial page load requires a client round-trip after hydration. It also breaks the "data on first paint" guarantee.

**Do this instead:** Use searchParams to drive Server Component re-execution. The data arrives with the HTML, no client-side fetch needed. See Pattern 1 above.

### Anti-Pattern 2: Separate Routes for Daily and Weekly

**What people do:** Create `/dashboard/daily` and `/dashboard/weekly` as separate page files, each with their own data fetching.

**Why it's wrong:** Duplicates the page layout, KPI cards, chart grid, and comparison logic across two files. Any UI change must be made in two places. The project constraint explicitly says "single page with tab switching."

**Do this instead:** One `page.tsx` that reads `searchParams.tab` and dispatches accordingly. The components are identical between tabs -- only the data and labels differ.

### Anti-Pattern 3: Fetching Both Sheets Simultaneously

**What people do:** Fetch both daily and weekly data on every page load, regardless of which tab is active, "in case the user switches tabs."

**Why it's wrong:** Doubles the Google Sheets API calls and server render time for no benefit. The user may never switch tabs. And when they do, the soft navigation is fast enough (~200ms) that pre-fetching is premature optimization.

**Do this instead:** Fetch only the active tab's sheet. If performance becomes an issue later, consider `prefetch` on the inactive tab's Link component (which Next.js does by default for visible Links, pre-rendering the RSC payload).

### Anti-Pattern 4: Keeping Old Types Alongside New Ones

**What people do:** Add new types while keeping old ones "for compatibility" or "gradual migration."

**Why it's wrong:** The old types (KpiData with `totalRevenue`/`orderCount`) have zero overlap with new types (TeamKpi with `revenue`/`profit`/`utilizationRate`). Keeping both creates confusion about which to import and leaves dead code in the codebase.

**Do this instead:** Delete all old types in a single commit. Let TypeScript errors guide the migration. This is a small codebase with <15 files that import dashboard types.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Sheets API v4 | Service account JWT via `googleapis` SDK. `fetchSheetData(range)` in `lib/sheets.ts`. | Unchanged from current. Only the range strings change (new sheet names). `GOOGLE_SHEETS_ID` points to the same spreadsheet, just different sheet tabs. |
| NextAuth.js v5 | Google OAuth + Credentials provider in `auth.ts`. | No changes needed. Auth is orthogonal to the data layer rewrite. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Page -> Data Layer | `getTeamDashboardData(tab)` returns `Promise<TeamDashboardData>` | Single function call. Page never touches `fetchSheetData` directly. |
| Page -> Components | Props passing. `<KpiCards kpis={data.kpis} />`, `<TrendChart data={data.records} />` | Standard React top-down data flow. No context or global state. |
| TabSwitcher -> Page | `<Link href="/dashboard?tab=weekly">` triggers Next.js soft navigation | No direct function call. The URL change causes the Server Component to re-execute. |
| Data Layer -> Sheets API | `fetchSheetData("daily!A1:G100")` returns `string[][] \| null` | Sheet range strings are the contract. If sheet structure changes, only parsers need updating. |
| Data Layer -> Mock Data | Import `mockDailyRecords` / `mockWeeklyRecords` for fallback | Same pattern as current codebase. |

## Sources

- Existing codebase analysis: `app/(dashboard)/dashboard/page.tsx`, `lib/data.ts`, `lib/sheets.ts`, `types/dashboard.ts` (HIGH confidence -- direct code inspection)
- Next.js App Router searchParams pattern: derived from Next.js 15+ async searchParams requirement, confirmed by codebase running Next.js 16.1.6 (HIGH confidence -- codebase version verified)
- `.planning/PROJECT.md`: Sheet structure (daily: date|revenue|profit|hours|count|utilization|target, weekly: week|revenue|profit|hours|count|utilization) (HIGH confidence -- project specification)
- `.planning/codebase/ARCHITECTURE.md`: Existing 3-layer data abstraction pattern (HIGH confidence -- codebase analysis)

---
*Architecture research for: Team sales dashboard with Daily/Weekly tab switching*
*Researched: 2026-02-21*
