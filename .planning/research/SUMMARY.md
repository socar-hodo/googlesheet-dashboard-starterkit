# Project Research Summary

**Project:** 경남울산사업팀 매출 대시보드 (Team Sales Dashboard)
**Domain:** Korean B2B operations/sales dashboard (car-sharing/mobility fleet management)
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

This project transforms an existing Next.js 16 starter-kit dashboard into a production team sales dashboard for a Korean car-sharing operations team. The existing stack (Next.js 16, React 19, Recharts 3.7.0, shadcn/ui, Google Sheets API v4) is fully sufficient -- no new npm packages are required. The work is a targeted rewrite of the data layer and UI components to replace generic e-commerce demo content (orders, categories, monthly revenue) with team-specific operational metrics: 매출 (revenue), 손익 (P&L), 이용건수 (usage count), 이용시간 (usage hours), 가동률 (utilization rate), and 매월 목표 (monthly targets). The dashboard serves a single page with Daily/Weekly tab switching, backed by two Google Sheets tabs.

The recommended approach is a phase-by-phase rewrite that follows the data dependency chain: new types first, then data parsers, then page shell with tab switching, then chart components, and finally comparison/polish features. This order is dictated by the architecture -- every UI component depends on correctly typed and parsed data from Google Sheets. The critical architectural decision is to use URL searchParams for tab state (not client-side useState), making tab switches trigger server-side re-fetches that guarantee fresh data.

The top risks are all in the data parsing layer: column-index parsing that breaks silently when sheets change, Korean-formatted numbers that produce NaN, and hardcoded sheet ranges that truncate growing data. All three must be addressed in Phase 1 before any UI work begins. The mitigation strategies are well-defined: parse by header name (not index), use `UNFORMATTED_VALUE` or a robust Korean number parser, and use open-ended column ranges. Secondary risks include Recharts SVG color inconsistencies in dark mode and period comparison logic errors at month boundaries, both addressable in later phases with established patterns.

## Key Findings

### Recommended Stack

The entire existing stack is retained. The only installation needed is adding 4 shadcn/ui components via CLI (`npx shadcn@latest add tabs progress badge separator`), which generate local files using the already-installed `radix-ui@1.4.3`. No `npm install` required.

**Core technologies (all already installed):**
- **Next.js 16.1.6 (App Router):** Server Components for data fetching, searchParams for tab state, route protection via proxy.ts
- **React 19.2.3:** UI framework with Server/Client Component boundary
- **Recharts 3.7.0:** All needed chart types already exported (ComposedChart, BarChart, Bar, Line, ReferenceLine, Area, LabelList)
- **shadcn/ui + radix-ui 1.4.3:** UI component library; add Tabs, Progress, Badge, Separator
- **Google Sheets API v4 (googleapis 171.4.0):** Data source via service account JWT; existing `fetchSheetData()` wrapper
- **TypeScript 5:** Type safety; new domain types replace all existing demo types
- **Tailwind CSS v4:** Styling via CSS variables and oklch color space

**Explicitly not needed:** date-fns/dayjs (overkill for adjacent-period comparison), React Query/SWR (no client-side fetching), zustand/jotai (no complex client state), Tremor/Chart.js (would conflict with established Recharts patterns), real-time polling/WebSocket (scoped out per project spec).

### Expected Features

**Must have (table stakes -- P1):**
- Daily/Weekly sheet data parsing with typed structures (foundation for everything)
- KPI summary cards (4-5 cards): 매출, 손익, 이용건수, 가동률 with target achievement %
- Daily/Weekly tab switching on a single page
- Revenue trend chart (actual line + target overlay)
- P&L trend chart with positive/negative coloring
- Utilization rate visualization (가동률 trend)
- Data table showing all daily/weekly rows
- Period comparison deltas on KPI cards (이번 주 vs 지난 주, 이번 달 vs 지난 달)
- Korean number formatting (만원 units, 건 suffix, 시간 suffix, percentage)
- Loading skeleton states via Suspense

**Should have (differentiators -- P2):**
- Target achievement progress bar (목표 달성률 게이지) on KPI cards
- Month-to-date (MTD) cumulative revenue view
- Sparkline mini-charts on KPI cards
- Conditional color coding (green/yellow/red for achievement thresholds)
- Summary row in data table (합계/평균)

**Defer (v2+):**
- Dual-axis composed chart (bars + target line overlay -- complex Recharts composition)
- Period selector buttons (이번 주/지난 주/이번 달/지난 달 toggles)
- Print-optimized CSS
- Manual refresh button with timestamp

**Anti-features (explicitly avoid):**
- Real-time auto-refresh (Google Sheets rate limits, data updates infrequently)
- Data editing from dashboard (read-only scope; editing stays in Google Sheets)
- Complex date range picker (pre-defined periods cover 95% of use cases)
- Multi-team support (premature generalization; scoped to one team)
- Export to Excel/PDF (data already lives in Google Sheets)
- User-configurable widget layout (fixed opinionated layout is a feature)

### Architecture Approach

The architecture follows a Server-Component-first pattern with searchParams-driven tab switching. One page (`/dashboard`) reads `?tab=daily|weekly` from the URL, calls `getTeamDashboardData(tab)` which dispatches to the correct sheet parser, computes KPIs from raw records (not a separate KPI sheet), and passes typed data down to components via props. Tab switching uses `<Link>` elements that trigger Next.js soft navigation, causing the Server Component to re-execute with fresh data. No client-side state management library is needed.

**Major components:**
1. **`types/dashboard.ts`** -- DailyRecord, WeeklyRecord, TeamKpi, PeriodComparison, TeamDashboardData interfaces (complete type replacement)
2. **`lib/data.ts`** -- Unified data layer: `getTeamDashboardData(tab)` with `parseDailySheet()`, `parseWeeklySheet()`, `computeKpisFromRecords()`, mock fallback
3. **`lib/sheets.ts`** -- Google Sheets API wrapper (unchanged except range strings)
4. **`app/(dashboard)/dashboard/page.tsx`** -- Server Component reading searchParams, fetching per-tab data, rendering component tree
5. **`components/dashboard/tab-switcher.tsx`** -- Client Component with Link-based tab navigation (URL as source of truth)
6. **`components/dashboard/kpi-cards.tsx`** -- Server Component displaying 4 KPI cards with achievement rate and period delta
7. **`components/dashboard/trend-chart.tsx`** -- Client Component: ComposedChart with Bar (actual) + Line (target) + ReferenceLine (monthly target)
8. **`components/dashboard/profit-chart.tsx`** -- Client Component: P&L trend with positive/negative coloring
9. **`components/dashboard/utilization-chart.tsx`** -- Client Component: utilization rate line chart with threshold coloring

**Key architectural decisions:**
- Tab state in URL (not React state) -- shareable, bookmarkable, back-button works
- Fetch only active tab's sheet (not both) -- avoids doubling API calls
- KPIs computed from records (not a separate sheet range) -- single source of truth
- Complete type replacement (delete old types, not deprecate) -- TypeScript catches every broken reference

### Critical Pitfalls

1. **Column-index parsing breaks silently** -- Current parsers use `row[0]`, `row[1]` etc. When sheet columns change, data maps to wrong fields with no error. **Avoid:** Parse by header name using a `Map<string, number>`, validate expected headers at parse time.

2. **Korean-formatted numbers produce NaN** -- Google Sheets returns `"1,234,567"` or `"₩1,234,567"` as strings. `Number("1,234,567")` is NaN. **Avoid:** Use `valueRenderOption: "UNFORMATTED_VALUE"` in the API call, or build a `parseKoreanNumber()` utility that strips commas/symbols before parsing.

3. **Hardcoded sheet ranges truncate growing data** -- Existing `"KPI!A1:B5"` pattern will silently miss rows as daily data grows. **Avoid:** Use open-ended column ranges like `"daily!A:H"` and filter in code.

4. **Recharts SVG colors break in dark mode** -- CSS variables (`var(--chart-1)`) resolve inconsistently in SVG attributes across browsers. Existing codebase already has two conflicting approaches. **Avoid:** Standardize on one color approach (JavaScript-resolved color constants or `useChartColors()` hook) for all new charts.

5. **Period comparison errors at month boundaries** -- "이번 달 vs 지난 달" on March 1 can compare 1 day vs 28 days if not handled carefully. **Avoid:** Compare same number of elapsed days; use explicit date range labels so users see exactly what periods are being compared.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Type System + Data Layer Foundation

**Rationale:** Every downstream component depends on correctly typed, correctly parsed data. The architecture research explicitly identifies this as the foundation with zero UI dependencies. The three most critical pitfalls (column parsing, number formatting, range truncation) all live in this layer. Getting this wrong invalidates all subsequent work.

**Delivers:** New TypeScript interfaces, sheet parsers that handle Korean data correctly, mock data matching new types, updated `getTeamDashboardData()` entry point. Old types fully deleted.

**Addresses features:** Sheet data parsing (daily + weekly), new type definitions, Korean number formatting
**Avoids pitfalls:** Column-index silent failures (#1), Korean number NaN (#3), hardcoded range truncation (#6)
**Stack elements:** TypeScript types, `lib/data.ts` rewrite, `lib/mock-data.ts` rewrite, `lib/sheets.ts` range updates

### Phase 2: Dashboard Shell + KPI Cards

**Rationale:** Once data flows correctly, the page structure and KPI cards are the next dependency -- they are Server Components with low complexity that establish the visual framework for everything else. Tab switching is the core navigation pattern and must work before charts are added.

**Delivers:** Working dashboard page with Daily/Weekly tab switching via searchParams, 4 KPI cards showing target achievement and period deltas, loading skeletons.

**Addresses features:** Daily/Weekly tab switching, KPI summary cards with target %, period comparison on KPIs, loading skeleton
**Uses stack:** shadcn/ui Tabs (install via CLI), shadcn/ui Progress, shadcn/ui Badge, existing Card/Table components
**Implements architecture:** SearchParams-driven tab pattern, computed KPIs from records, Server-first rendering

### Phase 3: Chart Components

**Rationale:** Charts are independent Client Components that depend on the data layer (Phase 1) and page shell (Phase 2) but not on each other. All three charts can be built in parallel. The Recharts color consistency pitfall must be resolved at the start of this phase as a shared pattern.

**Delivers:** Revenue trend chart (actual vs target), P&L trend chart (positive/negative), utilization rate chart with thresholds. Consistent dark-mode-safe chart color system.

**Addresses features:** Revenue trend line chart, P&L trend chart, utilization rate visualization, dark/light theme support for charts
**Avoids pitfalls:** Recharts CSS variable dark mode (#4)
**Uses stack:** Recharts ComposedChart, BarChart, Bar, Line, ReferenceLine, Area, LabelList

### Phase 4: Data Table + Comparison + Polish

**Rationale:** These features enhance the core dashboard but are not blocking for initial usability. The data table reuses existing shadcn/ui Table patterns. Period comparison logic requires careful date arithmetic and boundary testing, which benefits from the data layer being stable.

**Delivers:** Full data table with daily/weekly rows, summary row (합계/평균), refined period comparison with explicit date ranges, conditional color coding, responsive layout verification.

**Addresses features:** Data table, summary row, conditional color coding, responsive layout
**Avoids pitfalls:** Period comparison boundary errors (#5)

### Phase 5: Cleanup + Production Hardening

**Rationale:** Remove dead code from the starter kit, add mock data indicator for production safety, verify all edge cases.

**Delivers:** Old components deleted (revenue-chart.tsx, category-chart.tsx, recent-orders-table.tsx), mock data fallback visible in UI, empty state handling, final dark mode audit, "마지막 업데이트" timestamp.

**Addresses features:** Error visibility, empty states, production safety
**Avoids pitfalls:** Silent mock data fallback in production (security mistake from PITFALLS.md)

### Phase Ordering Rationale

- **Types before parsers before UI** -- strict dependency chain confirmed by both ARCHITECTURE.md build order and PITFALLS.md phase mapping
- **KPI cards before charts** -- KPI cards are Server Components (simpler, no Recharts), establish the visual framework, and validate that the data layer produces correct computed values
- **Charts are parallelizable** -- revenue, P&L, and utilization charts are independent Client Components; their only shared concern is the color pattern (resolve first)
- **Data table and comparison are enhancement layers** -- they add value on top of the core dashboard but do not block initial usability
- **Cleanup last** -- deleting old components during active development risks broken imports; delete only after all replacements are verified working

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Data Layer):** Needs `/gsd:research-phase` -- the actual Google Sheet structure (column names, data formats, edge cases like empty rows or merged cells) must be verified against the real spreadsheet before parser code is written. Training data assumptions about sheet structure need validation.
- **Phase 3 (Charts):** May benefit from `/gsd:research-phase` -- the Recharts SVG + CSS variable dark mode behavior needs hands-on testing to determine the right color approach. Two conflicting patterns already exist in the codebase.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Dashboard Shell + KPI):** Well-documented Next.js searchParams pattern, standard shadcn/ui component usage. Architecture research provides complete code patterns.
- **Phase 4 (Table + Comparison):** Standard data table pattern from existing codebase; period comparison is algorithmic (unit-testable without research).
- **Phase 5 (Cleanup):** Mechanical deletion and verification. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified as installed with correct versions via direct codebase inspection. No new dependencies needed. Recharts exports and Radix UI primitives verified at runtime. |
| Features | MEDIUM | Table stakes and anti-features are well-grounded in project spec and codebase analysis. Korean B2B dashboard conventions based on training data patterns, not verified with live user research. Differentiator prioritization may need adjustment based on team feedback. |
| Architecture | HIGH | Derived directly from existing codebase patterns (3-layer data abstraction, Server/Client Component boundary). SearchParams tab pattern confirmed compatible with Next.js 16. Build order validated against dependency chain. |
| Pitfalls | HIGH | Top pitfalls grounded in concrete codebase evidence (existing parser code, existing chart color inconsistency, existing hardcoded ranges). Mitigation strategies are specific and actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **Actual Google Sheet structure:** The column names, data formats, and edge cases (empty rows, merged headers, Korean locale number formatting) assumed by the research need validation against the real 경남울산사업팀 spreadsheet before Phase 1 implementation begins. The parsers cannot be finalized without seeing actual data.
- **Korean number formatting behavior:** Whether the real sheet uses `FORMATTED_VALUE` with commas/symbols or clean numeric values needs to be tested with an actual API call. The mitigation (use `UNFORMATTED_VALUE` or build `parseKoreanNumber()`) covers both cases, but knowing which case applies simplifies implementation.
- **가동률 (utilization rate) definition:** The exact formula and scale (0-100%? 0-1 decimal?) used by the team needs confirmation. This affects chart axis scaling and threshold coloring.
- **Period comparison expectations:** "이번 주 vs 지난 주" could mean current partial week vs full previous week, or current-to-same-day-last-week. The team's expectation needs clarification to avoid the month boundary pitfall.
- **Weekly sheet week numbering:** Whether the sheet uses ISO week numbers, Korean "N주차" format, or date ranges affects how week identifiers are parsed and displayed.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `package.json`, `types/dashboard.ts`, `lib/data.ts`, `lib/sheets.ts`, `lib/mock-data.ts`, `components/dashboard/*.tsx` -- direct code analysis of installed versions, existing patterns, and current type structure
- `recharts@3.7.0` package runtime verification -- all component exports (ComposedChart, BarChart, Bar, Line, ReferenceLine, Area, LabelList) confirmed via `require('recharts')`
- `radix-ui@1.4.3` package runtime verification -- Tabs (Root, List, Trigger, Content) and Progress (Root, Indicator) exports confirmed
- `.planning/PROJECT.md` -- project specification for sheet structure, tab requirements, period comparison scope
- `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, `CONVENTIONS.md` -- existing technical debt and patterns

### Secondary (MEDIUM confidence)
- Korean B2B dashboard UX conventions -- number formatting (만원 units), color conventions (achievement thresholds), layout patterns (KPI cards top, charts middle, table bottom) from training data patterns
- Google Sheets API `valueRenderOption` behavior -- documented parameter that controls number formatting in API responses
- Recharts SVG + CSS custom properties -- known inconsistency in browser CSS variable resolution within SVG attributes
- Car-sharing/mobility fleet KPIs -- 가동률, 이용건수, 이용시간 as standard operational metrics

### Tertiary (LOW confidence)
- None -- all findings are grounded in either codebase evidence or well-established ecosystem patterns

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
