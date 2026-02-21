# Pitfalls Research

**Domain:** Korean sales dashboard extending Next.js 16 + Google Sheets starter kit
**Researched:** 2026-02-21
**Confidence:** HIGH (grounded in codebase evidence and documented concerns)

## Critical Pitfalls

### Pitfall 1: Column-Index Parsing Breaks Silently When Sheet Structure Changes

**What goes wrong:**
The existing parser pattern in `lib/data.ts` extracts columns by numeric index (`row[0]`, `row[1]`, etc.) after skipping a header row. When the team's Daily/Weekly sheets have columns added, reordered, or renamed, the parser returns wrong values mapped to wrong fields -- without any error. Revenue ends up in the "hours" field, operating profit becomes "utilization rate," and the dashboard displays confidently wrong numbers.

**Why it happens:**
The existing code (`parseKpiFromSheet`, `parseMonthlyRevenueFromSheet`) was built for a fixed demo sheet. The new daily sheet has 7+ columns (일자, 매출, 손익, 이용시간, 이용건수, 가동률, 매월목표) and the weekly sheet has 6 columns (주차, 매출, 손익, 이용시간, 이용건수, 가동률). Korean column headers add complexity because anyone editing the Google Sheet could insert a blank column or move things around. The parsers never validate that column headers match what they expect.

**How to avoid:**
1. Parse by header name, not index. Read `rows[0]` first, build a `Map<string, number>` of header-to-column-index, then look up each field by its Korean header name.
2. Throw a clear error (or return a typed error object) when an expected header is missing. This surfaces immediately in logs rather than silently producing garbage.
3. Define expected headers as constants: `const DAILY_HEADERS = ["일자", "매출", "손익", "이용시간", "이용건수", "가동률", "매월목표"]` and validate at parse time.

**Warning signs:**
- KPI cards show `0` or `NaN` despite data existing in the sheet
- Chart values do not match what the team sees in the actual spreadsheet
- A field like "가동률" (utilization rate, typically 0-100%) shows values in the millions (because it received a revenue column)

**Phase to address:**
Phase 1 (Type + Parser foundation) -- this must be the very first thing built because every downstream component depends on correct parsing.

---

### Pitfall 2: Type Migration Leaves Orphaned References That Compile But Crash

**What goes wrong:**
The existing codebase imports `KpiData`, `MonthlyRevenue`, `CategoryDistribution`, `RecentOrder`, and `DashboardData` from `types/dashboard.ts`. These types are used in `lib/data.ts`, `lib/mock-data.ts`, `components/dashboard/kpi-cards.tsx`, `components/dashboard/revenue-chart.tsx`, `components/dashboard/category-chart.tsx`, and `components/dashboard/recent-orders-table.tsx`. When you replace these types with new team-specific types (e.g., `DailySalesRow`, `WeeklySalesRow`, `SalesKpi`), you either break the entire build at once (if you delete the old types) or end up with a codebase that has both old and new types where some components still reference the old shape but receive data shaped like the new type.

**Why it happens:**
TypeScript's structural typing means if the new type happens to share some field names with the old type, the compiler will not catch mismatches. For example, if both old `KpiData` and new `SalesKpi` have a field called `totalRevenue: number`, a component designed for the old shape might compile fine but not display the new fields (손익, 가동률, 이용건수) that were added. The `as` cast in the existing code (`row[4] as RecentOrder["status"]`) shows the codebase already uses type assertions that bypass safety.

**How to avoid:**
1. Do a complete type replacement in one atomic step: delete old types, define new types, fix every compile error. Do not maintain parallel type systems.
2. Start by grepping all imports of each old type (`KpiData`, `MonthlyRevenue`, `CategoryDistribution`, `RecentOrder`, `DashboardData`) and plan the replacement for each consumer before writing any code.
3. Make the new types intentionally incompatible with the old ones (different field names) so the compiler catches every reference. For example, use `revenue` (old) vs `매출액` or `salesAmount` (new) to force compile errors everywhere.
4. Update `lib/mock-data.ts` in the same step -- it must conform to the new types.

**Warning signs:**
- Build succeeds but dashboard shows blank cards or "undefined"
- Some components still show old demo data while others show new data
- TypeScript `any` or `as` casts appearing to "fix" type errors

**Phase to address:**
Phase 1 (Type definitions) -- must be done first and completely, before any parser or component work.

---

### Pitfall 3: Korean Number Strings With Commas, Spaces, or Won Symbol Fail Number()

**What goes wrong:**
Google Sheets formats Korean locale numbers with commas (e.g., `"1,234,567"`) and may include the won symbol (`"₩1,234,567"`) or percentage signs (`"85.3%"`). The existing pattern `Number(row[1] ?? 0)` returns `NaN` for any of these formatted strings because `Number("1,234,567")` is `NaN` in JavaScript. The existing `Number(value ?? 0)` pattern was already flagged in CONCERNS.md as silently masking data integrity issues.

**Why it happens:**
Google Sheets API returns cell values as formatted display strings by default (using `FORMATTED_VALUE` render option). Korean-locale spreadsheets commonly format numbers with comma separators. The team members who maintain the sheet may also apply currency formatting or percentage formatting in Google Sheets. The raw API response preserves this formatting.

**How to avoid:**
1. Use `valueRenderOption: "UNFORMATTED_VALUE"` in the Google Sheets API call (`sheets.spreadsheets.values.get`). This returns raw numeric values instead of formatted strings. However, this changes the return type to `any[][]` (mixed numbers and strings) rather than `string[][]`, so the type signature of `fetchSheetData` must be updated.
2. If formatted values are needed (e.g., for date columns that should stay as strings), use `valueRenderOption: "FORMATTED_VALUE"` but add a robust number parser: strip commas, won signs, percent signs, and whitespace before parsing. Example: `parseKoreanNumber(s: string): number` that handles `"₩1,234,567"`, `"85.3%"`, `"1,234"`, plain `"1234"`.
3. Add explicit validation: if `isNaN(parsedValue)`, log the raw string and the column name so bad data is surfaced immediately.

**Warning signs:**
- All numeric KPIs show `NaN` or `0` when connected to real Google Sheets
- Charts render flat at zero despite data being visible in the spreadsheet
- This only manifests when connected to the real sheet, not with mock data (because mock data uses clean JavaScript numbers)

**Phase to address:**
Phase 1 (Parser layer) -- must be resolved when building the new parsers. Test with actual sheet data early, not just mock data.

---

### Pitfall 4: Recharts CSS Variable Colors Break in SVG Context and Dark Mode

**What goes wrong:**
The existing codebase already documents this problem. In `category-chart.tsx` (line 16-23), the code comments: "CSS 변수 대신 실제 색상 값 매핑 (Recharts SVG에서 CSS 변수가 작동하지 않을 수 있음)" and uses hardcoded HSL values instead of CSS variables. However, `revenue-chart.tsx` uses `var(--color-chart-1)` directly in the `stroke` prop. This inconsistency means some charts may fail to render colors in certain browsers or in dark mode (where the CSS variables resolve to different values). When adding new chart components (매출 추이, 손익 추이, 가동률 차트), developers will face the same decision and may mix approaches.

**Why it happens:**
Recharts renders to SVG, and SVG `fill`/`stroke` attributes handle CSS custom properties inconsistently across browsers. Some browsers resolve `var(--chart-1)` in SVG attributes, others do not. The oklch color space used in `globals.css` adds another layer of complexity because not all SVG renderers support oklch. Dark mode switching requires the CSS variables to re-resolve, but SVG attributes may cache the initial value.

**How to avoid:**
1. Pick ONE approach for all new charts and be consistent. The safest approach is: use CSS variables in the Recharts `style` prop (not the attribute prop), or use a JavaScript-side color resolver that reads the computed CSS variable value at render time.
2. Alternatively, define chart colors as a TypeScript constant that maps to the theme. Create a `useChartColors()` hook (Client Component) that reads computed styles from the DOM and returns resolved color strings. This works reliably in both light and dark modes.
3. Test every new chart in both light and dark mode. The existing `revenue-chart.tsx` may already be broken in dark mode without anyone noticing if the oklch dark mode colors happen to be close to the light mode colors.

**Warning signs:**
- Charts appear with no visible lines/bars (transparent or white-on-white)
- Colors do not change when toggling dark/light mode
- Colors differ between dev server (Chrome) and production deployment

**Phase to address:**
Phase 2 (Chart components) -- establish the color pattern before building any charts. Retroactively fix the existing `revenue-chart.tsx` inconsistency as part of this phase.

---

### Pitfall 5: Period Comparison Logic With Incorrect Week/Month Boundary Calculations

**What goes wrong:**
"이번 주 vs 지난 주" and "이번 달 vs 지난 달" comparisons produce wrong results at month boundaries. For example: if today is Monday March 3, "지난 주" should be Feb 24-Mar 1, but a naive "subtract 7 days" approach might compare against Feb 17-23. If the daily sheet has data for calendar months and the comparison crosses a month boundary, the "이번 달 MTD" vs "지난 달 MTD" calculation must compare the same number of elapsed days (e.g., March 1-3 vs February 1-3), not all of last month vs partial current month.

**Why it happens:**
JavaScript `Date` math is notoriously error-prone. Months have different lengths (28/29/30/31 days). The team's "주차" (week number) in the weekly sheet may follow the Korean/ISO week numbering convention (weeks starting Monday) which differs from JavaScript's `getDay()` (Sunday = 0). If the sheet uses "W1", "W2" etc. as week identifiers, matching these to calendar dates requires knowing the year's week-numbering scheme.

**How to avoid:**
1. Use `date-fns` (already common in the ecosystem, lightweight) for all date arithmetic. Specifically: `startOfWeek(date, { weekStartsOn: 1 })` for Korean Monday-start weeks, `startOfMonth`, `subWeeks`, `subMonths`, `isSameDay`, `isWithinInterval`.
2. For MTD comparison: calculate the number of elapsed days in the current month, then compare against exactly that many days from the previous month. Do not compare "all of last month" vs "partial this month."
3. For weekly sheet: parse week identifiers (e.g., "W5", "5주차") into date ranges using a well-defined convention, and document that convention.
4. Write unit tests for boundary cases: first day of month, last day of month, month with 28 days vs 31 days, year boundary (December to January).

**Warning signs:**
- Comparison percentages are wildly off on the 1st of the month (comparing 1 day vs 28-31 days)
- "지난 주" shows data from 2 weeks ago
- Different team members see different "이번 주" values depending on when they check

**Phase to address:**
Phase 2 or 3 (Period comparison logic) -- this is feature logic that should be built after the data layer is solid, with comprehensive unit tests.

---

### Pitfall 6: Hardcoded Sheet Range Strings Fail When Data Grows

**What goes wrong:**
The existing code uses fixed ranges like `"KPI!A1:B5"` and `"매출!A1:B13"`. The new daily sheet will grow every day (one row per day -- potentially 365 rows per year). The weekly sheet grows by one row per week. If the range is hardcoded to, say, `"daily!A1:H32"` (expecting one month of data), it silently stops returning rows beyond row 32. The dashboard shows only partial data with no indication that rows are being cut off.

**Why it happens:**
This pattern was acceptable for the demo starter kit where data was static. For a live operational dashboard where rows are added daily, fixed ranges are fundamentally wrong. The CONCERNS.md already flags this as tech debt: "Hardcoded Data Ranges in Sheet Fetching."

**How to avoid:**
1. Use open-ended ranges: `"daily!A:H"` (entire columns A through H) instead of `"daily!A1:H32"`. Google Sheets API returns only rows that have data, so this does not fetch empty rows.
2. If you need to limit data (e.g., only current month), apply filtering in the parser after fetching, not by constraining the API range.
3. Add a data count check: if the parser receives fewer rows than expected for the time period, log a warning.

**Warning signs:**
- Dashboard shows data only up to a certain date despite newer data existing in the sheet
- Charts cut off mid-month
- No errors in logs (because the API call succeeds -- it just returns fewer rows)

**Phase to address:**
Phase 1 (Data layer) -- must be fixed when building the new `fetchSheetData` calls for daily/weekly sheets.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `Number()` without validation | Fast parser code | NaN propagates silently into charts/KPIs, team sees wrong data | Never -- add `parseKoreanNumber()` from day one |
| Keeping old demo types alongside new types | Avoids breaking existing pages during migration | Two type systems, confusion about which is canonical, components may use wrong type | Only during a single PR -- merge must remove old types entirely |
| Hardcoding chart colors as HSL strings | Works immediately in SVG | Dark mode breaks, colors don't match theme, every new chart copy-pastes the color array | Only if you document it as the standard and create a shared constant |
| Computing period comparisons inline in components | Quick to implement | Logic duplicated across KPI cards and charts, edge cases fixed in one place but not others | Never -- extract to `lib/period.ts` utility |
| Using `string` type for dates from sheets | Avoids date parsing complexity | Cannot do reliable date arithmetic, timezone bugs surface later | Only for display-only fields (not for comparison/filtering) |

## Integration Gotchas

Common mistakes when connecting to the Google Sheets API for Korean data.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Sheets API | Assuming `values.get()` returns numbers for numeric cells | It returns `string[][]` by default (`FORMATTED_VALUE`). Use `valueRenderOption: "UNFORMATTED_VALUE"` for numbers, or parse formatted strings explicitly. |
| Google Sheets API | Using fixed ranges (e.g., `"A1:H30"`) for growing data | Use open-ended column ranges (`"A:H"`) and filter rows in code. |
| Google Sheets API | Not handling empty rows in the middle of data | Google Sheets API omits trailing empty rows but may return empty strings for empty cells within data. Check for `row[i] === ""` or `row[i] === undefined`. |
| Google Sheets API | Assuming sheet tab names are stable | Sheet tab names (e.g., "daily", "weekly") are user-editable. If someone renames the tab, the API call fails. Document required tab names clearly for the team. |
| Google Sheets API (Korean) | Not accounting for merged cells in header rows | Merged cells in Google Sheets return value only in the top-left cell; other cells in the merged range are empty strings. Korean spreadsheets often merge header cells for visual grouping. |
| Recharts + Next.js | Importing Recharts in a Server Component | Recharts requires DOM access. Every component using Recharts must have `"use client"` directive. The existing codebase does this correctly, but new chart components must follow the same pattern. |
| Recharts | Passing `undefined` or `NaN` as data values | Recharts renders broken or invisible chart segments. Validate all numeric data before passing to chart `data` prop. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching both daily and weekly sheets on every page load | Slow initial render (400-1000ms) | Use Next.js ISR with `revalidate` or implement server-side caching. For a team dashboard with ~10 users, a 60-second cache is appropriate. | When 10+ users hit the dashboard simultaneously and API quota (100 req/100s) is exhausted |
| Parsing the entire daily sheet (365 rows) every render | CPU spike on parse, unnecessary data transfer | Filter to current month + previous month in the parser. Only fetch what the UI needs for KPI + comparison. | When daily sheet accumulates multiple years of data (700+ rows) |
| Re-rendering all charts when tab switches between Daily/Weekly | Visible chart redraw flicker | Use `React.memo()` on chart components. Keep both tab contents mounted but hidden (`display: none`) instead of conditionally rendering. Or use `useMemo` on the data transformation. | Immediately noticeable with 3+ charts on each tab |
| No loading state during data fetch | Users see stale or blank content, assume dashboard is broken | Add Suspense boundaries with skeleton loading states for each card/chart section | Immediately on slower connections or when Sheets API is slow (>500ms) |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing raw Google Sheets data to client components | Financial data (매출, 손익) visible in browser dev tools network tab. Not inherently wrong for an internal tool, but if the page is ever shared or screenshotted, raw API responses may be visible. | Keep data fetching in Server Components only. Pass only the computed/formatted values to Client Components. |
| Not validating that sheet data is within reasonable ranges | A typo in Google Sheets (e.g., `12345678` instead of `1234567` -- an extra digit) propagates to the dashboard as authoritative data | Add sanity checks: revenue should be within expected order of magnitude, percentages between 0-100, dates within current year |
| Silent fallback to mock data in production | If Google Sheets credentials expire, the dashboard shows demo data and the team makes business decisions based on fake numbers | Add a visible indicator when mock data is being used. Log credential failures as critical alerts, not just `console.error`. |

## UX Pitfalls

Common user experience mistakes in Korean sales dashboards.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing raw numbers instead of context (e.g., `₩1,234만` without target) | Team cannot tell if the number is good or bad | Always show target comparison: `₩1,234만 / ₩1,500만 (82.3%)` with color coding (red below target, green at/above) |
| Period comparison without indicating the comparison base | "전주 대비 +12%" -- but which week is "전주"? | Show explicit date ranges: "2/10~2/16 vs 2/3~2/9 (+12%)" |
| Tab switching resets scroll position | User scrolls down to see charts, switches tab, gets teleported to top | Maintain scroll position per tab, or use a fixed-height layout that does not scroll |
| Treating 가동률 (utilization rate) the same as 매출 (revenue) in charts | Different scales (0-100% vs millions of won) on the same axis make one metric invisible | Use separate Y-axes or separate charts for percentage metrics vs absolute value metrics |
| Not showing "last updated" timestamp | Team does not know if they are seeing today's data or yesterday's cached data | Show fetch timestamp: "마지막 업데이트: 2026-02-21 14:30" at the top of the dashboard |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Type migration:** All old types removed -- verify no `KpiData`, `MonthlyRevenue`, `CategoryDistribution`, `RecentOrder` imports remain in any file
- [ ] **Parser validation:** Header row validation implemented -- verify parser throws/logs when column headers do not match expected Korean names
- [ ] **Number parsing:** Korean-formatted numbers handled -- verify `"1,234,567"` and `"85.3%"` parse correctly, not as `NaN`
- [ ] **Open-ended ranges:** Sheet ranges use column-only format -- verify no hardcoded row limits (e.g., `A1:H30`) in new code
- [ ] **Dark mode charts:** All charts render correctly in dark mode -- verify by toggling theme and checking each chart has visible colors
- [ ] **Period comparison edge cases:** Month boundary tested -- verify "이번 달 vs 지난 달" on March 1 produces correct comparison (not comparing 1 day vs 28 days of full Feb)
- [ ] **Mock data updated:** `lib/mock-data.ts` conforms to new types -- verify mock data has all new fields (매출, 손익, 이용시간, 이용건수, 가동률, 매월목표)
- [ ] **Tab state persistence:** Switching Daily/Weekly tabs does not re-fetch data -- verify network tab shows no new API calls on tab switch
- [ ] **Error visibility:** Mock data fallback is visually indicated -- verify users can tell when they are seeing real vs mock data
- [ ] **Empty state:** Dashboard handles a sheet with header row only (no data rows) -- verify charts show "데이터 없음" instead of crashing

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Column-index parsing breaks silently | LOW | Switch to header-name-based parsing. Only `lib/data.ts` parsers need changing. No component changes required if the TypeScript interface stays the same. |
| Type migration leaves orphaned references | MEDIUM | Run `tsc --noEmit` to find all type errors. Fix each file. Harder if you allowed `any` casts to suppress errors -- those must be found by code review. |
| Korean number formatting produces NaN | LOW | Add `parseKoreanNumber()` utility and replace all `Number()` calls in parsers. Isolated to `lib/data.ts`. |
| Recharts colors invisible in dark mode | LOW | Create shared `CHART_COLORS` constant or `useChartColors()` hook. Update each chart component (5-10 min per chart). |
| Period comparison wrong at month boundaries | MEDIUM | Extract comparison logic to `lib/period.ts`. Write failing unit tests for boundary cases first, then fix the logic. Components using the logic do not change -- only the utility function. |
| Hardcoded ranges miss new data rows | LOW | Change range strings from `"A1:H30"` to `"A:H"` in `lib/data.ts`. One-line change per sheet. |
| Mock data shown in production without indication | MEDIUM | Add `dataSource: "live" | "mock"` field to the data response. Surface it in the UI header. Requires touching the data layer and one UI component. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Column-index parsing breaks | Phase 1: Type + Data Layer | Unit test: shuffle sheet columns, parser still extracts correct values by header name |
| Type migration orphaned refs | Phase 1: Type + Data Layer | `tsc --noEmit` passes with zero errors. `grep -r "KpiData\|MonthlyRevenue\|CategoryDistribution\|RecentOrder" --include="*.ts" --include="*.tsx"` returns zero matches (except type definition file if renamed) |
| Korean number formatting NaN | Phase 1: Type + Data Layer | Unit test: `parseKoreanNumber("₩1,234,567")` returns `1234567`. Test with actual Google Sheet cell values. |
| Recharts dark mode colors | Phase 2: Chart Components | Manual test: toggle dark mode, all chart lines/bars/areas visible. Automated: snapshot test of chart SVG output with mocked theme |
| Period comparison boundaries | Phase 2-3: KPI + Comparison Logic | Unit test: comparison on month boundaries (1st of month, last of month, Feb 28/29, Dec 31/Jan 1) |
| Hardcoded sheet ranges | Phase 1: Data Layer | Code review: no hardcoded row numbers in `fetchSheetData()` calls. Sheet with 400 rows returns all 400. |
| Mock data fallback invisible | Phase 3: Polish | UI test: disconnect Google Sheets credentials, verify dashboard shows "mock 데이터 사용 중" indicator |
| Tab switch re-renders charts | Phase 2: Tabbed UI | Performance test: React DevTools Profiler shows chart components do not re-render on tab switch when their data has not changed |
| Empty state crashes | Phase 2: Chart Components | Test: pass empty array to each chart component, verify graceful "데이터 없음" message |

## Sources

- Codebase analysis: `lib/data.ts` (lines 16-56 -- existing parser pattern with column-index access and `Number()` casting)
- Codebase analysis: `lib/sheets.ts` (lines 34-48 -- `fetchSheetData` returns `string[][]`, no `valueRenderOption` specified)
- Codebase analysis: `components/dashboard/category-chart.tsx` (lines 16-23 -- hardcoded HSL colors with comment about CSS variable SVG issues)
- Codebase analysis: `components/dashboard/revenue-chart.tsx` (line 56 -- uses `var(--color-chart-1)` directly, inconsistent with category-chart approach)
- Codebase analysis: `types/dashboard.ts` -- all four types that must be replaced
- `.planning/codebase/CONCERNS.md` -- tech debt items on hardcoded ranges, implicit type coercion, error specificity
- `.planning/PROJECT.md` -- daily/weekly sheet structure, period comparison requirements, tab switching requirements
- Google Sheets API documentation (training data, MEDIUM confidence): `valueRenderOption` parameter controls number formatting in API responses
- Recharts SVG rendering behavior (training data, MEDIUM confidence): CSS custom properties in SVG attributes have inconsistent browser support
- JavaScript Date arithmetic pitfalls (training data, HIGH confidence): well-documented ecosystem-wide issue

---
*Pitfalls research for: Korean sales dashboard (Next.js 16 + Google Sheets)*
*Researched: 2026-02-21*
