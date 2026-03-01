# Stack Research

**Domain:** v1.1 feature additions to existing Next.js 16 + Recharts + shadcn/ui sales dashboard
**Researched:** 2026-02-27
**Confidence:** HIGH

## Scope

This document covers only NEW stack requirements for v1.1 features. The existing stack (Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Recharts 3.7.0, shadcn/ui, NextAuth v5, Google Sheets API v4) is validated and unchanged.

**Three new features:**
1. 기간 선택기 — period filter toggle (이번 주 / 지난 주 / 이번 달 / 지난 달)
2. CSV/Excel 내보내기 — data export
3. KPI 스파크라인 — mini trend charts inside KPI cards

---

## Feature 1: 기간 선택기 (Period Filter Toggle)

### Recommendation: shadcn/ui ToggleGroup (zero new npm installs)

The period selector is a 4-option single-select toggle (이번 주 / 지난 주 / 이번 달 / 지난 달). shadcn/ui `ToggleGroup` with `type="single"` is the exact primitive for this UX pattern.

**Why ToggleGroup, not Tabs:**
- The existing `Tabs` component is already used for Daily/Weekly switching (tab-nav.tsx). Using a second Tabs pair for period selection creates semantic confusion — Tabs imply content panels, ToggleGroup implies a filter control.
- ToggleGroup renders as a segmented button row with `role="group"`, communicating "filter" rather than "view switch."
- Visually: `variant="outline"` gives a bordered button-group appearance appropriate for filter controls.

**Zero new npm installs required.** `@radix-ui/react-toggle-group@1.1.11` is already installed as a dependency of the `radix-ui@1.4.3` umbrella package (verified in `node_modules/radix-ui/package.json`). shadcn CLI generates a local `toggle-group.tsx` component file that imports from the already-installed package.

**State integration with existing URL searchParams pattern:**
The existing `tab-nav.tsx` already uses `useRouter` + `useSearchParams` + `router.replace()` to persist tab state in the URL. The period filter should follow the identical pattern — add a `period` searchParam alongside the existing `tab` param. This makes the selected period bookmarkable and shareable, consistent with the existing navigation architecture.

**Installation:**
```bash
npx shadcn@latest add toggle-group
```

**Date arithmetic approach — no date library:**
Period boundaries (start/end of current/previous week and month) require only 4 pure functions. The data already comes as `DailyRecord[]` with `date: string` (YYYY-MM-DD format). Filtering is string comparison on dates derived from `new Date()`. No `date-fns`, `dayjs`, or `moment` needed — those libraries are 10-70KB gzipped for functionality reducible to ~20 lines of native Date code.

---

## Feature 2: CSV/Excel 내보내기 (Data Export)

### Recommendation: Two-tier approach — CSV via Blob (no library) + Excel via Route Handler with ExcelJS

#### CSV Export: Zero dependencies, client-side Blob download

CSV export for a structured dataset (DailyRecord[] or WeeklyRecord[]) requires no library. The standard browser pattern:

```typescript
// Pure function, no library needed
function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

The `\uFEFF` BOM prefix ensures Korean characters (한글) display correctly when opened in Excel on Windows. This is the most important nuance for this project.

**Why not react-csv / export-to-csv:** These are thin wrappers around the identical Blob pattern, adding package weight for zero functional gain in this use case.

#### Excel (.xlsx) Export: ExcelJS via Next.js Route Handler (server-side)

For proper `.xlsx` files (not CSV renamed to .xlsx), ExcelJS is the recommended library. It runs server-side via a Next.js Route Handler, avoiding client-bundle size concerns (~1.5MB uncompressed for ExcelJS, unacceptable in a client bundle).

**Why ExcelJS over SheetJS (xlsx package):**
- The `xlsx` package on npm is frozen at version 0.18.5 with **known security vulnerabilities** (CVE-2024-22363: ReDoS, prototype pollution in earlier versions). SheetJS stopped publishing to npm at 0.18.5. Updated versions are available only from `cdn.sheetjs.com` via tarball — non-standard installation that complicates CI/CD and supply-chain auditing.
- ExcelJS v4.x is actively maintained on npm, has no known critical CVEs, and is the standard alternative recommended by the community post-SheetJS npm abandonment.
- ExcelJS is Node.js-native, making it ideal for a Route Handler that runs on the server. Client-side use via `exceljs/dist/es5/exceljs.browser.js` exists but is problematic (large bundle, documented issues in GitHub discussions).

**Route Handler pattern:**
```
GET /api/export?tab=daily&period=this-week → Response with xlsx attachment
```

The Route Handler receives query params, calls `getTeamDashboardData()`, filters by period, builds an ExcelJS workbook, and streams it as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The client-side export button makes a `fetch()` call and triggers a download from the blob response.

**Installation:**
```bash
npm install exceljs
```

ExcelJS v4.4.0 is the current stable version (as of research date).

---

## Feature 3: KPI 스파크라인 (KPI Sparkline Mini-Charts)

### Recommendation: Recharts LineChart (already installed, zero new dependencies)

A sparkline is a `LineChart` stripped of all decorations: no axes, no grid, no tooltip, no legend, no dots. It is rendered at small dimensions (e.g., 60px tall, 100% width of the card) inside the existing KpiCard.

**Why Recharts, not a dedicated sparkline library:**
- Recharts 3.7.0 is already installed and in active use for all existing charts. The project already has the `getChartColors(isDark)` theming pattern established.
- Dedicated sparkline libraries (react-sparklines, recharts-to-png, etc.) are either unmaintained (react-sparklines last updated 2019), add unnecessary dependencies, or are wrappers around Recharts/D3 anyway.
- A Recharts `LineChart` with `hide` on XAxis and YAxis and no CartesianGrid renders identically to a dedicated sparkline component.

**Integration with existing KpiCard:**
The current `kpi-card.tsx` is a Server Component (no `"use client"` directive). Adding a Recharts sparkline requires converting it to a Client Component because Recharts uses DOM measurement (`ResponsiveContainer`, `useLayoutEffect`) that requires browser execution.

Two implementation paths:

**Path A (recommended): Separate `KpiSparkline` Client Component**
Keep `kpi-card.tsx` as-is (Server Component). Add a `kpi-sparkline.tsx` with `"use client"`. The `kpi-cards.tsx` (Server Component) imports both and composes them. This follows the existing project pattern where Server Components own data, Client Components own interactive rendering (see `revenue-trend-chart.tsx` pattern).

**Path B: Convert KpiCard to Client Component**
Simpler implementation but makes the entire KPI card tree client-side, losing any Server Component rendering benefits. Less aligned with the existing architecture pattern.

**Path A implementation sketch:**
```typescript
// components/dashboard/kpi-sparkline.tsx
"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KpiSparklineProps {
  data: number[];
  color: string;
}

export function KpiSparkline({ data, color }: KpiSparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

`isAnimationActive={false}` is important for sparklines inside card grids — animation on 5 simultaneous sparklines creates visual noise.

**Data passed to sparkline:**
The sparkline shows the trend of the KPI metric over the visible dataset period. For daily tab: array of the last N daily values for that metric. For weekly tab: array of all weekly values for that metric. The parent `kpi-cards.tsx` already holds `data.daily` and `data.weekly` — it extracts `number[]` per metric and passes to each `KpiSparkline`.

---

## Summary: New Dependencies

| Package | Version | Purpose | Install Method | Why |
|---------|---------|---------|---------------|-----|
| `toggle-group` (shadcn) | uses `@radix-ui/react-toggle-group@1.1.11` | Period filter toggle UI | `npx shadcn@latest add toggle-group` | Already in node_modules via radix-ui umbrella, just needs shadcn component file generated |
| `exceljs` | ^4.4.0 | Server-side Excel (.xlsx) generation | `npm install exceljs` | Only library for xlsx with no npm security issues; runs server-side only |

**No new npm installs for:**
- CSV export (native Blob/URL API)
- Sparkline charts (Recharts 3.7.0 already installed)
- Period filter date arithmetic (native Date)
- ToggleGroup Radix primitive (already in radix-ui@1.4.3)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Period filter UI | shadcn ToggleGroup | Radix Select (dropdown) | A toggle-group is visually scannable at a glance; a dropdown requires an extra click to see options. For 4 fixed options, a segmented button is strictly better UX. |
| Period filter UI | shadcn ToggleGroup | shadcn/ui Tabs (second row) | Tabs semantically imply content panel switching. Existing Tabs are already used for Daily/Weekly. Two Tabs components for different concerns = semantic confusion. |
| CSV export | Native Blob + anchor | `react-csv`, `export-to-csv` | These are thin wrappers around the same Blob pattern. Adding a package dependency for 5 lines of code creates unnecessary maintenance surface. |
| Excel export | ExcelJS (server-side) | SheetJS xlsx (client or server) | SheetJS npm package is frozen at 0.18.5 with known CVEs. CDN tarball installation is non-standard for CI/CD. ExcelJS is the actively maintained alternative. |
| Excel export | ExcelJS (server-side) | ExcelJS (client-side bundle) | ExcelJS is ~1.5MB uncompressed. Shipping that in the client bundle degrades initial load performance significantly. Route Handler approach keeps it server-only. |
| Excel export | ExcelJS (Route Handler) | None — skip Excel, CSV only | CSV alone is acceptable for a v1.1 scope decision. However if Excel is required, ExcelJS server-side is the right answer. Mark as optional if scope is tight. |
| Sparkline | Recharts LineChart (existing) | `react-sparklines` | Last updated 2019, not maintained, doesn't support React 19. |
| Sparkline | Recharts LineChart (existing) | Tremor SparkAreaChart | Tremor wraps Recharts anyway. Adding Tremor is a full UI library (~50 components) just to use one sparkline type — massive over-install for this use case. |
| Sparkline | Recharts LineChart (existing) | MUI X SparklineChart | MUI X requires MUI base library as peer dependency — conflicts with existing shadcn/ui component system. |
| Date arithmetic | Native Date | date-fns | date-fns is 13KB gzipped (tree-shaken). The 4 period boundary calculations (start/end of this-week, last-week, this-month, last-month) require at most 20 lines of native Date. Not worth the dependency. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `xlsx` npm package (SheetJS) | Frozen at 0.18.5 with active CVEs (CVE-2024-22363 ReDoS). SheetJS stopped publishing to npm — installing from the npm registry gives a vulnerable version. | ExcelJS for xlsx, or CSV-only export |
| SheetJS CDN tarball install | Non-standard package source (`npm i https://cdn.sheetjs.com/...`) complicates security auditing, lock-file management, and CI environments. | ExcelJS on npm |
| ExcelJS in client bundle | ~1.5MB uncompressed bundle addition. ExcelJS has `exceljs.browser.js` but it's documented as problematic and large. | ExcelJS in Next.js Route Handler (server-side only) |
| `react-sparklines` | Unmaintained (last release 2019), no React 18/19 compatibility. | Recharts LineChart with axes hidden |
| date-fns / dayjs / moment | Overkill for 4 fixed period boundary calculations. Korean weekly boundaries align with standard Monday-Sunday or Monday-based ISO weeks — simple arithmetic suffices. | Native `Date` + 3-4 utility functions |
| Second shadcn Tabs for period filter | Semantic collision with existing Daily/Weekly Tabs. | shadcn ToggleGroup |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `exceljs` | ^4.4.0 | Node.js 18+, Next.js 16 Route Handler | Server-only. Do not import in "use client" files. |
| `@radix-ui/react-toggle-group` | 1.1.11 | `react@19.2.3`, `radix-ui@1.4.3` | Already installed via radix-ui umbrella package |
| Recharts LineChart (sparkline) | 3.7.0 (existing) | `react@19.2.3` | Already installed. `isAnimationActive={false}` recommended for inline sparklines. |

---

## Installation

```bash
# Excel export support (server-side only)
npm install exceljs

# Period filter toggle UI (generates component file using already-installed radix-ui)
npx shadcn@latest add toggle-group
```

**That is all.** CSV export and sparklines require zero new packages.

---

## Integration Points with Existing Code

| Feature | Existing Code to Modify | How |
|---------|------------------------|-----|
| 기간 선택기 | `components/dashboard/tab-nav.tsx` | Extend or add sibling component; mirror URL searchParams pattern with `period` param |
| 기간 선택기 | `app/(dashboard)/page.tsx` | Read `period` searchParam alongside `tab`, pass to KpiCards + Charts as filter |
| 기간 선택기 | `lib/data.ts` | Add `filterByPeriod(records, period)` utility function |
| CSV 내보내기 | New client component | Export button renders near DataTable; uses `data.daily` or `data.weekly` already in scope |
| Excel 내보내기 | New `app/api/export/route.ts` | Route Handler calls `getTeamDashboardData()`, filters, builds ExcelJS workbook, returns stream |
| KPI 스파크라인 | `components/dashboard/kpi-card.tsx` | Accept optional `sparklineData: number[]` + `sparklineColor: string` props; compose with new `KpiSparkline` client component |
| KPI 스파크라인 | `components/dashboard/kpi-cards.tsx` | Extract per-metric value arrays from `data.daily`/`data.weekly`, pass to each KpiCard |
| KPI 스파크라인 | New `components/dashboard/kpi-sparkline.tsx` | `"use client"` Recharts LineChart wrapper |

---

## Sources

- `node_modules/radix-ui/package.json` — verified `@radix-ui/react-toggle-group@1.1.11` is installed as a dependency
- `components/dashboard/charts/revenue-trend-chart.tsx` — established Recharts + `"use client"` + `getChartColors(isDark)` pattern for reference
- `components/dashboard/kpi-card.tsx` — current KPI card structure; confirmed no `"use client"` directive (Server Component)
- `package.json` — verified installed versions: recharts@^3.7.0, radix-ui@^1.4.3, next@16.1.6
- WebSearch: "SheetJS xlsx npm security CVE-2024-22363" — CVE-2024-22363 ReDoS confirmed, npm package frozen at 0.18.5 (MEDIUM confidence — multiple sources agree)
- WebSearch: "exceljs bundle size Next.js client side" — confirmed ~1.5MB uncompressed, client-side use problematic per GitHub issues (MEDIUM confidence)
- WebSearch: "shadcn toggle-group component 2025" — confirmed `npx shadcn@latest add toggle-group` is the install path (HIGH confidence — official shadcn/ui docs)
- WebSearch: "recharts sparkline hide axes no grid 2025" — confirmed LineChart + `hide` on XAxis/YAxis pattern (HIGH confidence — multiple verified examples)
- [shadcn/ui Toggle Group docs](https://ui.shadcn.com/docs/components/radix/toggle-group) — component API reference
- [SheetJS CVE-2024-22363](https://security.snyk.io/vuln/SNYK-JS-XLSX-6252523) — security vulnerability in xlsx npm package

---

*Stack research for: 경남울산사업팀 매출 대시보드 v1.1 (기간 선택기, CSV/Excel 내보내기, KPI 스파크라인)*
*Researched: 2026-02-27*
