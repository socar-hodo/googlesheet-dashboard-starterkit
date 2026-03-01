# Pitfalls Research

**Domain:** Korean sales dashboard — v1.1 feature additions (기간 선택기, CSV/Excel 내보내기, KPI 스파크라인)
**Researched:** 2026-02-27
**Confidence:** HIGH (grounded in codebase evidence, verified against official docs and community reports)

> **Scope note:** This file covers pitfalls specific to adding the three v1.1 features to the existing v1.0 system. The v1.0 system is already shipped and working. v1.0 pitfalls (column-index parsing, type migration, Korean number formatting, etc.) are resolved and documented in git history. This file focuses on integration risks for the new feature set only.

---

## Critical Pitfalls

### Pitfall 1: Period Filter Adds a New searchParam That Breaks Existing Suspense Key Strategy

**What goes wrong:**
The existing dashboard page uses `key={activeTab}`, `key={"charts-" + activeTab}`, and `key={"table-" + activeTab}` as Suspense reset keys. When the period filter adds a `period` searchParam (e.g., `?tab=daily&period=this-week`), any component that consumes both `tab` and `period` needs its Suspense key to incorporate both. If only `tab` is in the key, changing the period does NOT trigger a Suspense fallback — the old data stays visible while new data loads in the background. Users see stale period data rendered immediately and then a jarring re-render when new data arrives.

**Why it happens:**
The current server-side filtering approach (read searchParams in `page.tsx`, pass filtered data to components) is correct — but the Suspense `key` prop must include ALL searchParams that affect a component's data, not just `tab`. This is easy to forget when adding a second filter dimension.

**How to avoid:**
Compute a composite Suspense key that includes both `tab` and `period`:
```tsx
const suspenseKey = `${activeTab}-${activePeriod}`;
// Use: key={suspenseKey}, key={`charts-${suspenseKey}`}, key={`table-${suspenseKey}`}
```
The period filter logic (filtering `DailyRecord[]` by date range) happens server-side in `page.tsx` or a helper called from it. The filtered slices are passed as props to child components. No Client Component fetches data — the existing Server Component architecture is preserved.

**Warning signs:**
- Switching periods does not show the KPI skeleton (but data does change after a delay)
- Network tab shows the page re-request but UI appears instant with wrong data
- Two rapid period switches show data from the first switch, not the second

**Phase to address:**
Period filter phase — establish the composite key pattern before wiring up any period toggle UI.

---

### Pitfall 2: Period Filter Applied Client-Side to All Data Defeats the Server Component Architecture

**What goes wrong:**
The tempting shortcut is to fetch ALL data from Google Sheets (as today) and filter it in a Client Component using `useState` for the selected period. This appears simpler — no server round-trip per period change. But it:
1. Sends the full year's daily records to the browser (potentially 300+ rows)
2. Forces KPI cards and charts to become Client Components (or adds a Client wrapper over Server Components)
3. Breaks the existing clean Server Component boundary where data stays on the server
4. Makes the period state live in React state instead of URL, losing the shareability/bookmarkability that `searchParams` provides

**Why it happens:**
Client-side filtering feels faster because it avoids a server round-trip. For a small dataset (~30-90 rows for one quarter), it works fine in development. The architectural cost is invisible until it's time to share a filtered dashboard URL, or until a team member opens DevTools and sees the full financial dataset in a JSON response.

**How to avoid:**
Keep filtering server-side. The period filter is a new searchParam. `page.tsx` reads both `tab` and `period` from `searchParams`, passes them to the same `getTeamDashboardData()` call, and filters the result:
```tsx
const { tab = 'daily', period = 'this-week' } = await searchParams;
const data = await getTeamDashboardData();
const filteredDaily = filterByPeriod(data.daily, period);
```
`filterByPeriod` is a pure function in `lib/period-filter.ts` — no new API calls, just slicing the already-fetched array. The server round-trip is the existing page navigation, not an additional fetch.

**Warning signs:**
- A Client Component imports `useState` for the selected period
- KPI cards or chart components have `"use client"` added to handle period state
- The period selector component calls `setData()` or similar to update filtered data

**Phase to address:**
Period filter phase — architectural decision must be locked in before writing any UI.

---

### Pitfall 3: Week Boundary Calculation Diverges From the Sheet's "주차" Convention

**What goes wrong:**
The `이번 주 / 지난 주` filter must map to the same week boundaries as the sheet's `주차별` records. The sheet likely uses Korean business-week convention (Monday = week start), but JavaScript's `Date.getDay()` uses Sunday = 0. If `startOfWeek` is called without `{ weekStartsOn: 1 }`, "this week" includes Sunday of last week and excludes Monday of the current week. A "this week" filter applied to the Daily sheet returns one wrong day on Mondays.

For the Daily sheet, there is no "주차" column — filter must be computed from `date` strings (format: `"YYYY-MM-DD"`). For the Weekly sheet, filtering means selecting `week` label strings (format: `"N주차"` or `"N월 M주차"`). These are different filtering strategies for different data sources, and mixing them produces inconsistent KPI vs. chart comparisons.

**Why it happens:**
The Daily sheet stores absolute dates; the Weekly sheet stores opaque Korean week labels. A developer implementing one filter path assumes it works for both. The Korean week label format is not ISO standard — "1주차" in January means ISO week 1, but "3월 2주차" means the 2nd week of March, which may be ISO week 10 or 11 depending on the year.

**How to avoid:**
1. Use `date-fns` with explicit `{ weekStartsOn: 1 }` for ALL week start/end calculations.
2. Treat Daily and Weekly filtering as separate code paths. Daily: filter by `date` string range. Weekly: filter by matching `week` label patterns (regex or string matching the label format from the existing sheet).
3. Document the week label format as a constant in `lib/period-filter.ts` so future maintainers know the expected format.
4. Test the boundary: on the Monday of a new week, "이번 주" should include today, not yesterday.

**Warning signs:**
- "이번 주" filter on a Monday morning returns zero records from the Daily sheet
- Weekly KPI shows a different week than the Daily KPI for the same "이번 주" selection
- Console warnings from `parseKoreanNumber` for week-label strings being passed to the number parser (symptom of mismatched filter logic)

**Phase to address:**
Period filter phase — write a `lib/period-filter.ts` utility with unit tests covering Monday boundaries before integrating with any component.

---

### Pitfall 4: "이번 달 / 지난 달" Filter Produces Misleading MTD Comparisons

**What goes wrong:**
If today is February 5 and the filter is "이번 달 vs 지난 달," a naive implementation compares February 1-5 (5 days) against ALL of January (31 days). Revenue for January appears ~6x higher than February, making this month look catastrophically bad. The team draws wrong business conclusions.

**Why it happens:**
"이번 달" naturally means "from the first of this month to today." "지난 달" is ambiguous — it can mean "all of last month" (full 31 days) or "the same elapsed days of last month" (January 1-5). The correct business interpretation is the same elapsed days (MTD vs same-period MTD). This requires knowing "today" at render time, which is a server-side concern.

**How to avoid:**
Define the filter semantics explicitly in code comments:
- "이번 달": `startOfMonth(today)` to `today`
- "지난 달": `startOfMonth(subMonths(today, 1))` to `addDays(startOfMonth(subMonths(today, 1)), elapsedDays - 1)` where `elapsedDays = today.getDate()`

This requires the filter function to receive `today` as a parameter (not `new Date()` called inside the function), so it can be tested with a fixed date.

**Warning signs:**
- At the start of a month, "이번 달" KPI looks terrible compared to "지난 달"
- At the end of a month, "이번 달" and "지난 달" appear equal regardless of actual performance
- The "이번 달" record count differs wildly from "지난 달" record count

**Phase to address:**
Period filter phase — this is a business logic decision that must be documented and tested before the UI is built.

---

### Pitfall 5: CSV Export Produces Garbled Korean Characters in Excel (Missing UTF-8 BOM)

**What goes wrong:**
A plain UTF-8 CSV file downloaded from the browser opens in Excel on Windows with Korean characters replaced by `???` or random symbols. Excel on Windows defaults to the system code page (CP949/EUC-KR) for CSV files unless a Byte Order Mark (BOM) signals UTF-8 encoding. Without the BOM prefix `\uFEFF`, Korean headers like `일자`, `매출`, `이용건수` become unreadable. Users think the export is broken.

**Why it happens:**
`Blob` created with a plain UTF-8 string lacks the BOM that Excel needs. This is a well-known issue specific to CSV + Excel + East Asian characters. It does not manifest in Google Sheets, LibreOffice, or macOS Numbers (which default to UTF-8), so it may not appear in developer testing.

**How to avoid:**
Prefix the CSV string with the UTF-8 BOM character before creating the Blob:
```typescript
const BOM = '\uFEFF';
const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
```
This is a one-line fix but must be intentional — it is not added automatically by any serialization utility.

**Warning signs:**
- Export works correctly when opened in Google Sheets or LibreOffice but not Excel
- Korean column headers appear as `ÀÏÀÚå` or similar in Excel
- The file download itself succeeds (correct file size, no JS error)

**Phase to address:**
Export phase — add the BOM to the initial CSV generation implementation, not as a post-hoc fix.

---

### Pitfall 6: Excel Export Library Bundle Adds 1MB+ to the Client Bundle

**What goes wrong:**
ExcelJS (bundled: ~1.08MB) and SheetJS/xlsx (bundled: ~1.03MB) are heavy libraries. If imported directly in a Client Component, they are included in the page's JavaScript bundle and downloaded by every user who loads the dashboard — even users who never click "내보내기." This significantly increases initial load time for a tool that should feel instant.

**Why it happens:**
The natural implementation puts the export handler in a Client Component (`"use client"`) and imports the library at the top. Next.js bundles all imports of Client Components eagerly. There is no automatic tree-shaking for dynamically-used export libraries.

**How to avoid:**
Choose one of two approaches:

**Option A — Dynamic import (recommended for this project):** Keep CSV export as a pure client-side operation (no server round-trip) but lazily load the formatting logic:
```typescript
// Only imported when the button is clicked, not at page load
const { generateCSV } = await import('@/lib/csv-export');
```
For a simple CSV export, no external library is needed at all — hand-roll the CSV serialization in ~20 lines. This keeps the bundle delta at 0KB.

**Option B — Server-side export via Route Handler:** For Excel (.xlsx) format, use a Next.js Route Handler (`app/api/export/route.ts`). The heavy library (ExcelJS) lives in the server bundle only. The client makes a `fetch()` request and receives a binary blob. No client bundle impact.

For this project, Option A for CSV and Option B for Excel is the cleanest split. Do not use a large library client-side for a feature that is used occasionally.

**Warning signs:**
- Lighthouse/bundle analyzer shows a 1MB+ chunk named `exceljs` or `xlsx`
- First page load is slower after adding the export feature
- The export library is imported at the top level of a `.tsx` file with `"use client"`

**Phase to address:**
Export phase — decide the architecture (client CSV vs. server Excel) before adding any dependency to `package.json`.

---

### Pitfall 7: SheetJS Public npm Package Has Known Security Vulnerabilities

**What goes wrong:**
The `xlsx` package available on the public npm registry (the last version is 0.18.5, published 2022) has high-severity vulnerabilities: Denial of Service via memory/CPU exhaustion (CVE-2023-30533) and prototype pollution (affects versions through 0.19.2). Even though this project only generates files (not parsing untrusted input), using a vulnerable package introduces supply chain risk and will fail dependency audits.

**Why it happens:**
SheetJS moved its development to a private registry after 2022. The public npm package is abandoned and frozen at a vulnerable version. Developers who search "xlsx npm" and install it get the abandoned version without a clear warning.

**How to avoid:**
Do not install `xlsx` from the public npm registry. Options:
1. For CSV: no library needed — hand-roll the serializer.
2. For Excel: use `exceljs` (actively maintained, public npm, no known high-severity CVEs as of 2026-02-27).
3. If SheetJS is required: use the SheetJS Pro/private registry — this is not free and adds procurement complexity. Not recommended for this project.

Run `npm audit` after any new package install. If the report shows `xlsx` vulnerabilities, remove the package.

**Warning signs:**
- `npm install xlsx` completes without errors (because the abandoned version is still there)
- `npm audit` reports HIGH severity vulnerabilities referencing `xlsx` or `sheetjs`
- Package.json shows `"xlsx": "^0.18.x"` or similar version in the 0.x range

**Phase to address:**
Export phase — package selection decision must be made before installing anything.

---

### Pitfall 8: Sparkline Chart in KPI Card Causes Hydration Mismatch From `useTheme`

**What goes wrong:**
Sparkline charts inside KPI cards use Recharts (`"use client"`) and `useTheme` for color resolution — same pattern as the existing full-size charts. During server-side rendering, `useTheme` returns `undefined` for `resolvedTheme`. The chart renders with the default (light) theme colors. On the client, after hydration, `resolvedTheme` resolves to `"dark"`. React detects a mismatch between server HTML and client rendering, logs a hydration error, and the chart may flicker or fail to render.

This problem is latent in the existing charts but less visible because full-size charts are rendered in dedicated components that Next.js already handles as CSR boundaries. Sparklines embedded inside the KPI card — which is currently a Server Component — add a new CSR boundary in an unexpected place.

**Why it happens:**
`KpiCard` is currently a Server Component (no `"use client"` directive). Adding a Recharts sparkline inside it forces the entire component to become a Client Component, or requires a new child `SparklineChart` Client Component. If the parent KPI card remains a server component and the sparkline is a client child, `useTheme`'s SSR behavior (returning `undefined` initially) causes the theme mismatch.

**How to avoid:**
1. Keep `KpiCard` as a Server Component. Create a separate `SparklineChart` Client Component that is imported inside `KpiCard`. This is the correct Next.js pattern for mixing server/client within a component tree.
2. In `SparklineChart`, guard against the SSR `resolvedTheme === undefined` case:
```typescript
const { resolvedTheme } = useTheme();
const colors = getChartColors(resolvedTheme === 'dark'); // false when undefined — safe default
```
3. The existing `getChartColors(isDark: boolean)` function in `chart-colors.ts` already handles this pattern — use it directly, same as the existing charts.
4. Do NOT add `suppressHydrationWarning` to the chart element as a workaround — it hides the symptom without fixing the cause.

**Warning signs:**
- Browser console shows "Hydration failed because the initial UI does not match"
- KPI card sparklines flash from light to dark colors on page load
- TypeScript error: "Server Component cannot use React hooks" — meaning `useTheme` was added to a Server Component

**Phase to address:**
Sparkline phase — component boundary decision must be made before any sparkline code is written.

---

### Pitfall 9: Recharts `ResponsiveContainer` Renders at Zero Dimensions Inside a KPI Card

**What goes wrong:**
KPI cards use `CardContent` with fixed heights and padding. When `ResponsiveContainer width="100%" height={60}` (a typical sparkline height) is placed inside a flex card layout, Recharts may calculate 0 width during the first render pass and log: "The width(0) and height(0) of chart should be greater than 0." The chart appears invisible until a window resize event triggers a recalculation. This is a known Recharts issue, particularly in constrained-width containers and during Suspense boundary mounting.

**Why it happens:**
`ResponsiveContainer` uses a `ResizeObserver` to measure its container. If the container is inside a CSS flex or grid layout that hasn't fully painted, the initial measurement may return 0. The existing full-size charts avoid this because their parent containers (`Card` in `ChartsSection`) have explicit widths defined by the grid. KPI cards in a 5-column grid have narrower, more constrained widths.

**How to avoid:**
Add explicit `minWidth` to `ResponsiveContainer`:
```tsx
<ResponsiveContainer width="100%" height={60} minWidth={80}>
```
Also verify that the sparkline container element has a non-zero CSS width before Recharts mounts. A fallback fixed-width wrapper (`<div style={{ width: '100%', minWidth: '80px' }}>`) around `ResponsiveContainer` resolves most cases.

Alternatively, for sparklines specifically, consider a fixed-dimension SVG approach (`<svg width={120} height={40}>`) without `ResponsiveContainer`. A sparkline does not need to be responsive in the same way as a full-size chart.

**Warning signs:**
- Sparklines invisible on first load but appear after window resize
- Browser console: "The width(0) and height(0) of chart should be greater than 0"
- Sparklines render in Chrome but not in Firefox (different ResizeObserver timing)

**Phase to address:**
Sparkline phase — test in a narrow KPI card container before considering the implementation complete.

---

### Pitfall 10: Sparkline Data Is the Same Full Dataset as Charts — Large Data Passed to Every KPI Card

**What goes wrong:**
If the sparkline receives the full `DailyRecord[]` (potentially 365 records) for its trend line, all 365 records are passed as props to 5 KPI card sparklines = 5 × 365 = 1825 objects in the React component tree. For a Server Component passing data to Client Components, this data is serialized to JSON in the RSC payload. Large RSC payloads slow time-to-interactive and increase bandwidth.

**Why it happens:**
The existing `KpiCards` component receives `data: TeamDashboardData` and uses `data.daily` for all its logic. It's natural to pass the same array to the sparkline. The problem is invisible in development (fast network, small dataset) and only appears with real production data accumulated over months.

**How to avoid:**
Slice the sparkline data in the Server Component before passing to the Client sparkline:
```tsx
// In KpiCards (Server Component) — pass only last N records
const sparklineData = sorted.slice(-30); // last 30 days for the sparkline
```
30 records is sufficient for a trend sparkline. The full dataset is already used for KPI calculation; the sparkline does not need it.

**Warning signs:**
- React DevTools Profiler shows 300+ items in the sparkline chart's data prop
- RSC payload in Network tab is unexpectedly large (>100KB)
- Page feels slow to interactive on first load despite no API changes

**Phase to address:**
Sparkline phase — establish the data slicing pattern in the first sparkline implementation.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Client-side period filtering with useState | No server round-trip on period change | Full dataset sent to browser; period state not in URL (not shareable); breaks Server Component architecture | Never — use searchParams + server-side filter |
| Inline CSV generation in event handler | Fast to implement | Encoding bugs (missing BOM), no type safety, duplicated logic if reused | Only in a throwaway prototype |
| Importing ExcelJS at top level of Client Component | Zero API design work | 1MB+ bundle added to every page load | Never — use dynamic import or Route Handler |
| Using `xlsx` from public npm | npm install just works | Known high-severity CVEs; fails security audits | Never — use exceljs or hand-rolled CSV |
| Adding `useTheme` directly to KpiCard | Simplest code path | Forces entire KpiCard to be Client Component, moves data fetching complexity | Never — keep KpiCard as Server Component, use child Client Component for sparkline |
| Hard-coding "이번 주 = last 7 days" | Simple implementation | Wrong on Mondays (Sunday included, Monday excluded); diverges from sheet's week convention | Never — use date-fns with weekStartsOn: 1 |
| "지난 달" = all records from previous calendar month | Intuitive | MTD comparison is misleading (e.g., 5 days vs 31 days at month start) | Never for KPI comparison; acceptable only for "show all data" view mode |

---

## Integration Gotchas

Common mistakes when connecting the new features to the existing system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Period filter + searchParams | Adding `period` param to only some Suspense keys | Add `period` to ALL Suspense keys that depend on filtered data: `${tab}-${period}` composite key |
| Period filter + Tab Nav | Creating a separate period selector that manages its own URL params independently | Use the same `new URLSearchParams(searchParams.toString())` pattern as `TabNav` — preserve existing params, only update the changed key |
| CSV export + Korean data | Using `new Blob([csvContent], { type: 'text/csv' })` | Prepend `'\uFEFF'` (UTF-8 BOM): `new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })` |
| Excel export + Next.js | Importing `exceljs` in a `"use client"` component | Use a Route Handler (`app/api/export/route.ts`) — heavy library stays server-side, client receives blob via `fetch()` |
| Sparkline + Server/Client boundary | Calling `useTheme` in KpiCard Server Component | Extract `SparklineChart` as a `"use client"` child component; `KpiCard` stays as a Server Component |
| Sparkline + existing chart colors | Duplicating `getChartColors` logic inline | Import and reuse the existing `getChartColors` from `components/dashboard/charts/chart-colors.ts` |
| Period filter + mock data | Mock data has fixed dates that may not fall in "이번 주" | Update mock data dates to be relative to today (e.g., last 30 days from `new Date()`), or document that period filter shows "no data" with mock data |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full 365-row dataset as sparkline props | Large RSC payload, slow hydration | Slice to last 30 records before passing to sparkline Client Components | When daily sheet accumulates 3+ months of data (~90 rows triggers noticeable slowdown) |
| ExcelJS imported in client bundle | 1MB+ JS downloaded by all users on every page load | Dynamic import on button click, or server-side Route Handler | Immediately on first deploy — bundle analyzer shows the problem |
| Period selector triggers full page navigation on every change | Visible loading flash on each period toggle | Acceptable with `force-dynamic` + fast Sheets API; add `useTransition` wrapper if flash is jarring | When Google Sheets API latency exceeds 300ms (network or quota issues) |
| Google Sheets API called per period change | Quota exhaustion with multiple simultaneous users changing periods rapidly | Acceptable for team of ~10 users (100 req/100s limit per user); document the quota ceiling | If users rapidly cycle through 4 periods, they make 4 × 2 sheet fetches = 8 API calls. With 10 users doing this simultaneously, approaching the 100 req/100s per-user limit |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| CSV/Excel export exposes raw financial data in browser network tab | Financial data (매출, 손익) appears in a plaintext CSV download — acceptable for internal tool, but if users share exported files without realizing they contain sensitive data | Add a visible header to exported files: "경남울산사업팀 내부 자료 — 외부 공유 금지" as the first row of the export |
| Installing `xlsx` from public npm | High-severity CVE (prototype pollution, DoS) in the abandoned public registry version | Use `exceljs` or hand-rolled CSV. Run `npm audit` and treat HIGH findings as blocking. |
| Export Route Handler without authentication check | `/api/export` would be publicly accessible if auth middleware is not applied | Verify that `proxy.ts` (the existing middleware) covers the `/api/export` path, or add explicit auth check inside the Route Handler using `auth()` from `next-auth` |
| Period filter state in client cookie instead of URL | Session-based period state can persist stale period across different logins or tabs | Use URL searchParams only — stateless, shareable, no persistence issues |

---

## UX Pitfalls

Common user experience mistakes when adding these specific features.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Period selector only shows current options without indicating active selection | Team cannot tell which period they are viewing | Active period button must have clear visual state (e.g., solid background vs. outline); match the existing `TabNav` visual pattern |
| "내보내기" button exports ALL data ignoring the active period filter | User selects "이번 주" expecting to export only this week's data, but gets the full dataset | Export function must respect the active `period` searchParam — pass it to the export logic |
| No loading state during export generation | User clicks export, nothing happens for 1-3 seconds (especially for Excel via Route Handler), then file appears | Disable the export button and show a spinner during the async operation; re-enable on completion or error |
| Period filter resets when switching Daily/Weekly tabs | User sets "이번 달" on Daily tab, switches to Weekly tab, period resets to "이번 주" | Preserve `period` param across tab switches using the same `URLSearchParams` preservation pattern as `TabNav` |
| Sparkline shows the same data range as the main chart (full history) | Sparkline purpose is to show recent trend; showing 12 months of data makes the sparkline unreadable | Limit sparkline to last 30 days (Daily) or last 8 weeks (Weekly) regardless of period filter |
| Mock data period filter shows "데이터 없음" with no explanation | Team confused why filter produces no data in development | Show an indicator when mock data is active; note that period filter uses static mock dates |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Period filter — BOM on KPI keys:** Suspense key includes both `tab` AND `period` — verify by switching periods and confirming the KPI skeleton appears
- [ ] **Period filter — Monday boundary:** "이번 주" on a Monday includes today, not yesterday — verify with a fixed test date of a Monday
- [ ] **Period filter — MTD semantics:** "이번 달" on the 5th compares 5 days vs 5 days of last month, not 5 days vs full last month — verify with a hardcoded test date of the 5th
- [ ] **Period filter — URL preservation on tab switch:** Switching from Daily to Weekly preserves the `period` param — verify the URL shows `?tab=weekly&period=this-month` after switching
- [ ] **Period filter — empty state:** Selecting "지난 주" when the sheet has only this week's data shows "데이터 없음" gracefully, not a crash
- [ ] **CSV export — BOM:** Downloaded CSV opens in Excel on Windows with Korean headers readable — verify on a Windows machine with Excel (not Google Sheets)
- [ ] **CSV export — period aware:** Exporting while "이번 주" is active exports only this week's rows, not all rows
- [ ] **Excel export — auth protected:** `/api/export` Route Handler returns 401 for unauthenticated requests — verify by calling the endpoint without a session cookie
- [ ] **Excel export — bundle neutral:** Lighthouse bundle analysis shows no new large chunks after adding the export feature — verify with `npm run build` output
- [ ] **Sparkline — hydration clean:** Browser console shows zero hydration warnings after adding sparklines — verify in production build (`npm run build && npm start`)
- [ ] **Sparkline — dark mode:** Sparklines show correctly colored lines in both light and dark mode — verify by toggling theme after page load
- [ ] **Sparkline — zero width:** Sparklines render correctly on first load without window resize — verify in Firefox (stricter ResizeObserver timing) and in a narrow browser window

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing `period` in Suspense key | LOW | Add `period` to composite key string. One-line change in `page.tsx`. |
| Client-side period filtering (wrong architecture) | MEDIUM | Extract filter logic to `lib/period-filter.ts` pure function. Move state from `useState` to `searchParams`. Convert Client Component consumers back to Server Components or prop-drilling pattern. Requires touching page.tsx, the filter component, and every component that consumed the client state. |
| Week boundary wrong (Sunday instead of Monday) | LOW | Add `{ weekStartsOn: 1 }` to date-fns `startOfWeek` call. Write unit tests for the Monday case. |
| MTD semantics wrong (full month vs elapsed days) | LOW | Rewrite the "지난 달" boundary calculation in `lib/period-filter.ts`. Isolated to one function, no component changes. |
| Missing UTF-8 BOM in CSV export | LOW | Prepend `'\uFEFF'` to CSV string before Blob creation. One-line change. |
| ExcelJS in client bundle | MEDIUM | Move to Route Handler pattern. Requires creating `app/api/export/route.ts`, changing the client export handler to a `fetch()` call, and testing the binary download. ~1-2 hours of rework. |
| `xlsx` CVE discovered in `npm audit` | LOW | `npm uninstall xlsx`. Replace with `exceljs` or hand-rolled CSV. Route Handler approach unaffected. |
| Sparkline hydration mismatch | LOW | Extract sparkline into a dedicated `"use client"` child component. Guard `resolvedTheme === undefined` in `getChartColors` call. Already the established pattern in the codebase. |
| Sparkline renders at zero width | LOW | Add `minWidth` to `ResponsiveContainer`. Or switch to fixed-dimension SVG for sparklines. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing `period` in Suspense keys | Period filter phase | Switch periods: KPI skeleton must appear on each switch |
| Client-side filtering architecture | Period filter phase — decide architecture first | No `useState` for data in any component consuming period filter |
| Week boundary (Sunday vs. Monday) | Period filter phase — `lib/period-filter.ts` with unit tests | Unit test: `getWeekRange(monday)` includes `monday` as first day |
| MTD misleading comparison | Period filter phase — document semantics, add tests | Unit test: on day 5, "이번 달" returns 5 records, "지난 달" returns 5 records of same period |
| CSV BOM missing | Export phase — first CSV implementation | Manual test: open exported CSV in Excel on Windows, Korean headers readable |
| ExcelJS client bundle bloat | Export phase — architecture decision before `npm install` | `npm run build` output shows no new chunks >50KB in client bundle |
| SheetJS CVE | Export phase — library selection | `npm audit` shows zero HIGH or CRITICAL vulnerabilities |
| Sparkline hydration mismatch | Sparkline phase — component boundary decision first | `npm run build && npm start`: zero hydration errors in browser console |
| ResponsiveContainer zero width | Sparkline phase — test in narrow card before done | Sparkline visible on first page load in Firefox without resize |
| Large dataset as sparkline props | Sparkline phase — slice data before passing | RSC payload in Network tab <50KB for full dashboard page |

---

## Sources

- Codebase analysis: `app/(dashboard)/dashboard/page.tsx` — existing Suspense key pattern (`key={activeTab}`) that must be extended
- Codebase analysis: `components/dashboard/tab-nav.tsx` — URL searchParams preservation pattern to replicate for period selector
- Codebase analysis: `components/dashboard/charts/revenue-trend-chart.tsx` — existing `useTheme` + `getChartColors` pattern for sparklines to follow
- Codebase analysis: `components/dashboard/kpi-card.tsx` — Server Component structure that must be preserved when adding sparkline child
- Codebase analysis: `types/dashboard.ts` — `DailyRecord.date` format `"YYYY-MM-DD"` confirms date-based filtering is feasible
- Codebase analysis: `package.json` — no `date-fns`, `exceljs`, or `xlsx` currently installed; all are new additions
- Official Next.js docs: [useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) — Suspense boundary requirements; layout vs. page searchParams behavior
- Next.js GitHub Discussion #49540: searchParams causes server component to rerun — confirms server round-trip on param change is expected and correct
- Next.js GitHub Discussion #88535: stale searchParams with Cache Components in Next.js 16 — `force-dynamic` already set in page.tsx mitigates this
- [Korean CSV BOM article](https://hyunbinseo.medium.com/save-csv-file-in-utf-8-with-bom-29abf608e86e) — UTF-8 BOM requirement for Excel Korean compatibility (HIGH confidence, verified)
- [Recharts ResponsiveContainer issues #172, #6716](https://github.com/recharts/recharts/issues/172) — zero-width rendering in constrained containers (HIGH confidence, multiple reports)
- [ExcelJS bundlephobia](https://bundlephobia.com/package/exceljs) — ~1.08MB bundle size (HIGH confidence)
- [SheetJS CVE](https://github.com/SheetJS/sheetjs/issues/694) — public npm registry package abandoned with known vulnerabilities (HIGH confidence)
- date-fns docs: [startOfWeek](https://date-fns.org/docs/startOfWeek) — `weekStartsOn: 1` for Monday-start weeks (HIGH confidence)
- Google Sheets API: [Quota limits](https://developers.google.com/workspace/sheets/api/limits) — 100 req/100s per user (HIGH confidence, official source)

---
*Pitfalls research for: v1.1 feature additions to Korean sales dashboard (기간 선택기, CSV/Excel 내보내기, KPI 스파크라인)*
*Researched: 2026-02-27*
