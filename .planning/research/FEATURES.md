# Feature Research

**Domain:** Korean B2B operations/sales dashboard (car-sharing/mobility team)
**Researched:** 2026-02-21
**Confidence:** MEDIUM (training data + codebase analysis; web search unavailable for verification)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| KPI summary cards (4-5 cards) | Every dashboard opens with headline numbers; team members need instant status check | LOW | Reuse existing `KpiCards` pattern. Replace generic KPIs with: 매출(revenue), 손익(P&L), 이용건수(usage count), 가동률(utilization rate). Each card shows current value + target achievement % |
| Target achievement indicator on KPI cards | Korean business culture is deeply target-driven (목표 대비 실적). Showing raw numbers without target context is meaningless | LOW | Show as percentage badge or progress bar beneath the value. Color-code: green >= 100%, yellow 80-99%, red < 80% |
| Daily/Weekly tab switching | PROJECT.md specifies two sheets (daily, weekly) on a single page. Users expect seamless toggle without page reload | LOW | shadcn/ui Tabs component (needs install). Server Component can fetch both datasets; client tab controls which renders |
| Revenue trend line chart (매출 추이) | Time-series revenue is the most fundamental sales visualization. Already exists as pattern | LOW | Reuse `RevenueChart` pattern. Adapt for daily (date x-axis) or weekly (week-number x-axis). Must support dual-line: actual vs target |
| P&L trend chart (손익 추이) | Team needs to see not just revenue but profit/loss trajectory. Korean ops teams track 손익 closely as it reveals operational efficiency | MEDIUM | Bar chart (positive=profit, negative=loss) or area chart. Recharts BarChart with positive/negative coloring. Separate from revenue chart for clarity |
| Utilization rate visualization (가동률) | Core KPI for vehicle fleet/car-sharing operations. 가동률 is the heartbeat metric -- it tells whether assets are being used | MEDIUM | Gauge/progress-style display on KPI card + line chart for trend. Percentage metric (0-100%). Color thresholds matter: green > 80%, yellow 60-80%, red < 60% |
| Period comparison (기간 비교) | PROJECT.md explicitly requires "이번 주 vs 지난 주, 이번 달 vs 지난 달". Korean sales reports always compare periods | MEDIUM | Show delta (change amount) and change rate (%) on KPI cards. E.g., "매출 ₩2,340만 (+12.3% vs 지난 주)". Requires computing comparison from sheet data |
| Data table with all metrics | Users need to see the raw daily/weekly data rows, not just charts. Especially for 팀원 who need to verify specific dates | LOW | Reuse existing `Table` component pattern from `RecentOrdersTable`. Columns: 일자/주차, 매출, 손익, 이용시간, 이용건수, 가동률 |
| Korean number formatting | Korean business context: 만원 (10K KRW) units for large amounts, Korean date formats (M월 D일 or YYYY-MM-DD), percentage with % suffix | LOW | Existing pattern: `₩${(amount / 10000).toLocaleString()}만`. Extend to 이용시간 (hours), 이용건수 (건), 가동률 (%) |
| Dark/light theme support | Already exists in codebase. Users expect it to work with new components too | LOW | Use existing CSS variable system. Ensure all new chart colors reference `--chart-*` variables |
| Responsive layout (mobile-friendly) | Team members check on phones during meetings or in the field. Existing layout is responsive | LOW | Existing grid system handles this. KPI cards stack on mobile (2-col or 1-col). Charts go full-width |
| Loading state | Google Sheets API has latency (1-3s). Users need feedback that data is loading, not broken | LOW | Server Component streaming with React Suspense. Show skeleton cards/charts while data loads |

### Differentiators (Competitive Advantage)

Features that set the product apart from a basic Google Sheets view. Not required, but make this dashboard worth using over just opening the spreadsheet.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Target achievement progress bar (목표 달성률 게이지) | Visual progress toward monthly target at a glance. The sheet has 매월 목표 data -- surfacing it as a visual progress indicator makes the dashboard dramatically more useful than the raw sheet | LOW | Horizontal progress bar or circular gauge on KPI card. `current / target * 100`. Most impactful differentiator for lowest effort |
| Conditional color coding throughout | Korean ops dashboards use red/yellow/green extensively. Cells, cards, chart segments that change color based on performance thresholds make patterns jump out | LOW | Apply to: KPI cards (achievement %), table cells (P&L positive=blue/negative=red), chart data points. Already have CSS variable system for theming |
| Sparkline mini-charts on KPI cards | Small inline trend indicators (last 7 days or last 4 weeks) directly on each KPI card, so users see direction without scrolling to full charts | MEDIUM | Recharts has `<LineChart>` that can render tiny. Requires passing recent subset of data to each card. Adds significant information density |
| Dual-axis or overlay chart (실적 vs 목표) | Overlay target line on top of actual performance bar/line chart. Korean sales teams live by 목표 대비 실적 -- seeing both on one chart is the canonical view | MEDIUM | Recharts ComposedChart: BarChart (actual) + Line (target) on same axes. Requires aligning daily target from monthly target (daily target = monthly target / business days) |
| Month-to-date (MTD) cumulative view | Show cumulative daily revenue vs cumulative daily target. Answers "are we on track this month?" -- the question every team lead asks every day | MEDIUM | Compute running sum of daily values. Overlay with linearly interpolated monthly target. Area chart works well. This is the single most useful derived view for sales teams |
| Week-over-week / Month-over-month delta badges | "+12.3% vs 지난 주" badges on each KPI card. Quick comparison without needing to mentally calculate | LOW | Compute from sheet data: (current period - previous period) / previous period * 100. Show with up/down arrow icons (lucide-react TrendingUp/TrendingDown) |
| Summary row in data table | Totals/averages row at bottom of daily/weekly table. 합계 매출, 평균 가동률, etc. | LOW | Compute from data array. Render as bold/highlighted row. Standard in Korean business tables |
| Print-friendly / screenshot-ready layout | Korean teams share dashboard screenshots in KakaoTalk/Teams. Clean layout that screenshots well is valued | LOW | Mainly CSS: ensure charts render with white background for screenshots, proper spacing. No interactive-only elements for key data |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in this context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time auto-refresh (polling/WebSocket) | "I want live data!" | Google Sheets API has rate limits (60 req/min per project). Polling 10+ users = quota burn. Sheet data updates at most a few times per day anyway. Adds complexity (client state management, stale data reconciliation) with near-zero value | Manual refresh on page load (current pattern). Add a visible "마지막 업데이트" timestamp so users know data freshness. Optionally add a manual refresh button |
| Data editing from dashboard | "Can I update numbers here?" | PROJECT.md explicitly scopes as read-only. Adding write would require: Sheets API write permissions, conflict handling, input validation, audit trail. Massive scope increase for a feature that Google Sheets already does well | Link to the source Google Sheet for editing. Show "시트에서 편집" button that opens Sheets in new tab |
| Complex date range picker | "I want to see March 5 to March 17 specifically" | Data comes from fixed daily/weekly sheet rows, not a queryable database. Arbitrary date ranges require client-side filtering logic, edge cases (partial weeks), and the UI complexity of a date picker for marginal value. Most users care about "today", "this week", "this month" -- not arbitrary ranges | Pre-defined period buttons: "이번 주", "지난 주", "이번 달", "지난 달". Covers 95% of use cases with zero UI complexity |
| Multi-team / multi-region support | "Other teams want this too" | PROJECT.md explicitly scopes to 경남울산사업팀 only. Multi-tenancy adds: data isolation, team selector UI, permission model, separate sheet configs. Premature generalization | Build for one team well. If other teams want it, clone and configure -- don't over-engineer multi-tenancy now |
| Export to Excel/PDF | "I want to download reports" | The data already lives in Google Sheets. Exporting from dashboard back to spreadsheet is circular. PDF generation requires server-side rendering libraries (puppeteer or similar), adding significant dependency weight | Link directly to source Google Sheet. For presentations, screenshot the dashboard (hence print-friendly layout differentiator) |
| Drill-down detail pages | "I want to click a day and see hourly breakdown" | Sheet data is daily/weekly granularity. There is no hourly data to drill into. Building empty drill-down pages creates false expectations | Keep flat: one page, two tabs (daily/weekly). If finer granularity is needed later, add it to the sheet first, then the dashboard |
| User-configurable dashboard (drag-and-drop widgets) | "Let me customize my layout" | Massive complexity (layout persistence, widget registry, drag-and-drop library). For a team of ~10-20 people all looking at the same 5 KPIs, customization adds cognitive overhead without value | Fixed, opinionated layout that shows the right data in the right order. Every team member sees the same view -- this is a feature, not a limitation |
| Notification/alert system | "Alert me when 가동률 drops below 70%" | Requires: background job runner, notification delivery (email/push/KakaoTalk), threshold configuration UI, subscription management. Out of scope per PROJECT.md and disproportionate complexity | Color-code thresholds visually on the dashboard itself. Users check the dashboard and see red/yellow indicators immediately |

## Feature Dependencies

```
[Google Sheets data parsing (daily + weekly)]
    |
    +---> [KPI summary cards] --requires--> [target data parsing from sheet]
    |         |
    |         +--enhances--> [target achievement progress bar]
    |         +--enhances--> [period comparison delta badges]
    |         +--enhances--> [sparkline mini-charts]
    |
    +---> [Revenue trend chart]
    |         +--enhances--> [dual-axis actual vs target overlay]
    |         +--enhances--> [MTD cumulative view]
    |
    +---> [P&L trend chart]
    |
    +---> [Utilization rate chart]
    |
    +---> [Data table] --enhances--> [summary row]
    |
    +---> [Conditional color coding] (cross-cutting, applies to all above)

[Daily/Weekly tab switching]
    +--controls--> [which dataset renders in all components above]

[Loading state (Suspense)]
    +--wraps--> [all data-dependent components]
```

### Dependency Notes

- **All visualizations require sheet data parsing:** The daily and weekly sheet parsers are the foundation. Nothing renders without them. This must be Phase 1.
- **KPI cards require target data:** The daily sheet includes 매월 목표 (monthly target). Parsing this correctly is prerequisite for achievement % display. Target data is in the same sheet, so parsing both together is natural.
- **Period comparison requires historical data access:** Comparing "이번 주 vs 지난 주" means the sheet must contain both current and previous period data. The daily sheet likely has the full month; weekly sheet likely has multiple weeks. Parser must handle extracting and grouping by period.
- **Tab switching is independent of data:** Can be implemented as pure client-side UI that toggles between pre-fetched daily and weekly data. Both datasets fetched in parallel on page load.
- **Conditional color coding is cross-cutting:** Apply it incrementally as each component is built, not as a separate phase.
- **MTD cumulative view enhances revenue chart:** It is a derived computation (running sum) applied to daily data, displayed as an additional chart or chart mode toggle.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what replaces the current starter-kit dashboard with real team value.

- [ ] **Daily/Weekly sheet data parsing** -- Foundation for everything. Parse both sheets into typed structures. Include target extraction from daily sheet
- [ ] **New type definitions** -- Replace `KpiData`, `MonthlyRevenue`, etc. with `TeamDailyData`, `TeamWeeklyData`, `TeamKpiSummary` reflecting actual sheet columns (매출, 손익, 이용시간, 이용건수, 가동률, 목표)
- [ ] **KPI summary cards with target achievement** -- 4-5 cards: 매출 (with 목표 대비 %), 손익, 이용건수, 가동률. Color-coded achievement badges
- [ ] **Daily/Weekly tab switching** -- Single page, two tabs. Install shadcn/ui Tabs component
- [ ] **Revenue trend line chart** -- Daily or weekly 매출 over time. Dual-line: actual + target
- [ ] **P&L trend chart** -- Bar or area chart showing 손익 trajectory with positive/negative coloring
- [ ] **Utilization rate chart** -- 가동률 trend line with threshold coloring
- [ ] **Data table** -- Full daily/weekly data in sortable table format
- [ ] **Period comparison on KPI cards** -- Delta badges showing vs previous period
- [ ] **Korean formatting** -- 만원 units, Korean date format, percentage formatting
- [ ] **Loading skeleton** -- Suspense boundaries with skeleton cards/charts

### Add After Validation (v1.x)

Features to add once core is working and team is using the dashboard.

- [ ] **Target achievement progress bar** -- Visual gauge for monthly target progress. Add when team confirms target data structure is stable
- [ ] **MTD cumulative revenue view** -- Running total chart. Add when team asks "are we on pace this month?"
- [ ] **Sparkline mini-charts on KPI cards** -- Add when team wants more information density without scrolling
- [ ] **Summary row in data table** -- Totals and averages. Add alongside or shortly after data table
- [ ] **Manual refresh button** -- "새로고침" button with last-updated timestamp. Add if team complains about data staleness
- [ ] **Print/screenshot-optimized CSS** -- Add when team starts sharing screenshots in chat

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Dual-axis composed chart (bars + target line)** -- More complex Recharts composition. Defer until basic charts are validated
- [ ] **Period selector buttons** -- "이번 주 / 지난 주 / 이번 달 / 지난 달" quick filters. Defer until team expresses need beyond the default current-period view
- [ ] **Conditional formatting on data table cells** -- Color-code individual cells in the table. Nice polish but not essential for launch
- [ ] **이용시간 (usage hours) dedicated chart** -- Additional chart view. Only if team specifically asks; 매출/손익/가동률 are the primary KPIs

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Sheet data parsing (daily + weekly) | HIGH | MEDIUM | P1 |
| New type definitions | HIGH | LOW | P1 |
| KPI summary cards with target % | HIGH | LOW | P1 |
| Daily/Weekly tab switching | HIGH | LOW | P1 |
| Revenue trend chart (actual vs target) | HIGH | MEDIUM | P1 |
| P&L trend chart | HIGH | MEDIUM | P1 |
| Utilization rate chart | HIGH | LOW | P1 |
| Data table | MEDIUM | LOW | P1 |
| Period comparison deltas on KPI | HIGH | MEDIUM | P1 |
| Korean number/date formatting | HIGH | LOW | P1 |
| Loading skeleton (Suspense) | MEDIUM | LOW | P1 |
| Target achievement progress bar | HIGH | LOW | P2 |
| Conditional color coding (cards) | MEDIUM | LOW | P2 |
| Summary row in table | MEDIUM | LOW | P2 |
| MTD cumulative view | HIGH | MEDIUM | P2 |
| Sparkline mini-charts | MEDIUM | MEDIUM | P2 |
| Dual-axis composed chart | MEDIUM | MEDIUM | P3 |
| Period selector buttons | MEDIUM | MEDIUM | P3 |
| Print-optimized CSS | LOW | LOW | P3 |
| Manual refresh + timestamp | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- the dashboard is not useful without these
- P2: Should have, add shortly after launch -- these make the dashboard significantly better
- P3: Nice to have, future consideration -- polish and advanced features

## Competitor/Reference Feature Analysis

Note: Based on training data knowledge of Korean B2B dashboard products. Confidence: MEDIUM.

| Feature | Korean BI Tools (Tableau/Power BI Korea usage) | Custom Internal Dashboards (Korean enterprise) | Google Sheets (current workflow) | Our Approach |
|---------|-----------------------------------------------|-----------------------------------------------|--------------------------------|--------------|
| KPI cards | Standard top-row cards with comparison | Common pattern, usually 4-6 cards | Manual cell formatting | 4-5 cards with achievement %, delta badges. Simple and focused |
| Target vs Actual | Built-in goal lines, bullet charts | Dual-line or bar+line composed charts | Conditional formatting cells | Dual-line chart: actual solid line + target dashed line |
| Period comparison | Filter-driven comparison mode | Usually hardcoded current vs previous | Manual side-by-side columns | Computed deltas on KPI cards + potential toggle for chart overlay |
| 가동률 (utilization) | Gauge widgets | Custom gauge or progress bars | Plain percentage cell | KPI card with progress bar + trend line chart |
| Data granularity | Drill-down to any level | Fixed to available data | Row-level in sheet | Fixed daily/weekly tabs matching sheet granularity |
| Interactivity | Full filtering, cross-filtering | Limited, mostly view-only | Full cell editing | Minimal: tab switch only. Dashboard is for viewing, sheet is for editing |
| Mobile access | Responsive or dedicated mobile app | Often desktop-only | Google Sheets app | Fully responsive via existing Tailwind grid system |
| Update frequency | Real-time or scheduled refresh | Varies (API polling, manual) | Manual entry | Page-load fetch. Matches data entry frequency |

## Korean Business Dashboard UX Conventions

These conventions are specific to the Korean B2B context and should inform design decisions. Confidence: MEDIUM (based on training data patterns, not verified with live sources).

### Number Display Conventions
- Large amounts in 만원 (10,000 KRW) units: `₩2,340만` not `₩23,400,000`
- Negative amounts in red with minus sign: `-₩120만`
- Percentages with one decimal: `87.3%` not `87%`
- Growth/change with explicit sign: `+12.3%` or `-5.1%`
- Usage counts with 건 suffix: `1,234건`
- Hours with 시간 suffix: `456시간`

### Color Conventions
- Achievement >= 100%: Blue or Green (success)
- Achievement 80-99%: Yellow/Orange (caution)
- Achievement < 80%: Red (warning)
- Profit (positive P&L): Blue
- Loss (negative P&L): Red
- These map to Korean financial reporting conventions

### Layout Conventions
- KPI cards at top (overview first)
- Charts in middle (trends and patterns)
- Detail table at bottom (drill into specifics)
- This top-down flow matches how Korean managers scan reports: summary -> trend -> detail

### Tab/Navigation Conventions
- "일별" (Daily) and "주별" (Weekly) are the standard Korean labels for period tabs
- Current period shown by default; toggle to see historical
- Period labels use Korean format: "2월 3주차" (February Week 3), "2/21(금)" (2/21 Fri)

## Sources

- Codebase analysis: `types/dashboard.ts`, `lib/data.ts`, `components/dashboard/*.tsx` (HIGH confidence -- direct code inspection)
- Project requirements: `.planning/PROJECT.md` (HIGH confidence -- project owner validated)
- Existing architecture: `.planning/codebase/ARCHITECTURE.md` (HIGH confidence -- codebase scan)
- Korean B2B dashboard patterns: Training data (MEDIUM confidence -- common patterns in Korean enterprise software, but not verified with live sources in this session)
- Recharts capabilities: Training data knowledge of Recharts API (MEDIUM confidence -- LineChart, BarChart, ComposedChart, AreaChart, PieChart are well-established, but specific v3 features not verified)
- Car-sharing/mobility KPIs: Training data (MEDIUM confidence -- 가동률/이용건수/이용시간 are standard fleet operations metrics)

---
*Feature research for: Korean B2B operations/sales dashboard (car-sharing/mobility team)*
*Researched: 2026-02-21*
