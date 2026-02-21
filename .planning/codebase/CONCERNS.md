# Codebase Concerns

**Analysis Date:** 2026-02-21

## Tech Debt

**Hardcoded Data Ranges in Sheet Fetching:**
- Issue: Google Sheets ranges are hardcoded as fixed strings ("KPI!A1:B5", "매출!A1:B13", etc.) in `lib/data.ts`
- Files: `lib/data.ts` (lines 76-81)
- Impact: Any structural change to Google Sheets (adding rows/columns) requires code changes and redeployment. No flexibility for different sheet layouts.
- Fix approach: Move sheet ranges to environment variables or configuration file. Create a configuration object mapping data types to their ranges: `SHEET_CONFIG='{"kpi":"KPI!A1:B5","revenue":"매출!A1:B13"}'`

**Implicit Type Coercion in Data Parsing:**
- Issue: Multiple parsers in `lib/data.ts` use `Number(value ?? 0)` which silently converts invalid strings to `NaN` or `0`, masking data integrity issues
- Files: `lib/data.ts` (lines 19, 32, 40, 51)
- Impact: Bad data from Google Sheets goes undetected. Users see `0` or `NaN` without knowing the source data was malformed.
- Fix approach: Add validation layer before type conversion. Throw or log warnings when data doesn't match expected format. Consider returning union type `{success: boolean, data?, error?}` from parsers.

**No Error Specificity in Sheets API:**
- Issue: `lib/sheets.ts` doesn't differentiate between authentication failures, missing sheets, quota exceeded, or network errors
- Files: `lib/sheets.ts` (lines 34-48)
- Impact: All failures silently fall back to mock data, making production debugging difficult. Users can't tell if they're viewing real or mock data.
- Fix approach: Catch and handle specific error types. Add error logging to distinguish between recoverable errors (network) and critical ones (auth). Consider exposing data source status to UI.

**Unvalidated Environment Variables:**
- Issue: No runtime validation that critical env vars are properly formatted (e.g., `GOOGLE_PRIVATE_KEY` might be malformed, `ALLOWED_EMAILS` list might be invalid)
- Files: `auth.ts` (lines 9-21), `lib/sheets.ts` (lines 5-21)
- Impact: Configuration errors cause silent failures at runtime rather than fast-fail at startup.
- Fix approach: Add initialization check in app startup (e.g., `lib/validate-env.ts`) that validates and parses all env vars, throwing clear errors if malformed.

**Development Mode Security Risk:**
- Issue: Credentials Provider in `auth.ts` allows ANY email to login when Google OAuth is not configured
- Files: `auth.ts` (lines 30-54)
- Impact: In development that touches production data, any email can access the dashboard without authentication.
- Fix approach: Enforce `ALLOWED_EMAILS` whitelist even in dev mode, or require explicit `DEV_MODE_ENABLED=true` flag to unlock unrestricted access. Log all dev mode logins.

## Known Bugs

**Race Condition in Mobile Sidebar:**
- Symptoms: Clicking navbar item doesn't reliably close mobile sidebar on first click; may require second click
- Files: `components/layout/sidebar.tsx` (lines 47-52, 86-90)
- Trigger: On mobile, tap menu item → sidebar remains open; must tap again or click overlay
- Cause: Mobile menu open state managed separately from click handler; no synchronized state update
- Workaround: Click the X button to close manually, or click outside the sidebar

**CSV/Invalid Data Handling in CategoryChart:**
- Symptoms: If category percentages don't sum to 100%, or if categories are empty, chart may not display correctly
- Files: `components/dashboard/category-chart.tsx` (lines 30-70)
- Trigger: Upload Google Sheet with categories that don't sum to 100% or have missing data
- Cause: No validation that percentages sum to expected total; PieChart may render unexpected layouts
- Workaround: Ensure percentages manually sum to 100% in source data

## Security Considerations

**Private Key Handling:**
- Risk: `GOOGLE_PRIVATE_KEY` environment variable contains raw private key material. If `.env.local` is accidentally committed or exposed, Google service account is compromised.
- Files: `.env.local` (not committed but present), `lib/sheets.ts` (line 19)
- Current mitigation: `.env.local` in `.gitignore`. Key is handled as environment variable only.
- Recommendations:
  - Use Google Cloud Secret Manager or similar vault instead of env vars for production
  - Rotate service account keys regularly
  - Add startup check to ensure `GOOGLE_PRIVATE_KEY` doesn't appear in logs/error messages
  - Document that `.env.local` must never be committed

**Email Whitelist Bypass:**
- Risk: If `ALLOWED_EMAILS` is not set (empty string), all Google accounts gain access. Easy to misconfigure.
- Files: `auth.ts` (lines 14-21, 66-72)
- Current mitigation: Default is open (empty whitelist = all allowed), which requires explicit configuration
- Recommendations:
  - Add prominent warning in `.env.example` about security implications
  - Consider defaulting to DENY unless explicitly whitelisted
  - Log whitelist enforcement in authentication callbacks

**NextAuth Session Hijacking Risk:**
- Risk: JWT secret (`AUTH_SECRET`) must be generated and kept secure. Missing or weak secret allows session forgery.
- Files: `auth.ts` (lines 57-82), `.env.example` (line 3)
- Current mitigation: `.env.example` notes need for `openssl rand -base64 32`, but doesn't enforce it
- Recommendations:
  - Add startup validation to reject weak `AUTH_SECRET` values
  - Document rotation strategy for `AUTH_SECRET` in production
  - Monitor for token leakage in error logs

## Performance Bottlenecks

**Serial Sheet Data Fetching on Initial Load:**
- Problem: `getDashboardData()` uses `Promise.all()` for parallel fetching but is called once per page render. No caching layer means every navigation to dashboard re-fetches all 4 sheets.
- Files: `lib/data.ts` (lines 68-101), `app/(dashboard)/dashboard/page.tsx` (line 11)
- Current: ~4 parallel API calls per dashboard load × (avg 200-500ms per call) = 200-500ms latency
- Improvement path:
  - Add React Query or SWR for client-side caching with stale-while-revalidate strategy
  - Implement `revalidateTime` in Next.js Server Components to cache data server-side
  - Consider background refresh to keep cached data fresh without blocking user
  - Add loading skeleton/placeholder during initial fetch

**No Pagination for Orders Table:**
- Problem: All orders loaded at once (`recentOrders` array). If real data grows to thousands of orders, browser performance degrades.
- Files: `components/dashboard/recent-orders-table.tsx` (lines 27-76), `lib/mock-data.ts` (lines 38-120)
- Current: Shows 10 orders, acceptable now but not scalable
- Improvement path:
  - Implement server-side pagination: `fetchSheetData()` with offset/limit
  - Add pagination controls to table component
  - Consider virtualization (react-window) if very large datasets needed

**Charts Re-render on Every Parent Update:**
- Problem: Client components for charts (`RevenueChart`, `CategoryChart`) lack memoization. Parent rerender causes full chart recomputation.
- Files: `components/dashboard/revenue-chart.tsx`, `components/dashboard/category-chart.tsx`
- Current: Not critical at current data size, but unnecessary rendering
- Improvement path: Wrap components with `memo()` and ensure prop references are stable

## Fragile Areas

**Google Sheets Data Parser Coupling:**
- Files: `lib/data.ts` (lines 14-56)
- Why fragile: Parser assumes exact column order and presence (A=first, B=second, etc.). If Google Sheet columns are reordered or added, parser silently returns wrong data.
- Safe modification: Add JSDoc comments documenting exact expected column structure. Consider adding optional header row validation to detect mismatches. Add test fixtures with intentionally wrong column orders.
- Test coverage: No unit tests for parsers; parsers only tested via end-to-end data loads

**Sidebar State Management:**
- Files: `components/layout/sidebar.tsx` (lines 28-32)
- Why fragile: Mobile/desktop state separated into two different components (button and menu). Clicking link doesn't properly close mobile view. Responsive breakpoint at `md:` must match exactly.
- Safe modification: Consolidate state management. Consider using `useContext` to share sidebar open state across components. Add data-testid attributes for mobile/desktop testing.
- Test coverage: No tests for mobile responsive behavior or state synchronization

**Hardcoded Status Styles:**
- Files: `components/dashboard/recent-orders-table.tsx` (lines 20-25)
- Why fragile: Status-to-color mapping is hardcoded inline. Adding new status requires editing component. TypeScript doesn't enforce exhaustiveness check on styles vs. type definition.
- Safe modification: Move styles to separate `constants/order-status.ts`. Use `satisfies Record<RecentOrder["status"], string>` to enforce completeness at compile time.
- Test coverage: No tests for status badge rendering with different statuses

## Scaling Limits

**Google Sheets API Quota:**
- Current capacity: Google Sheets API has usage quotas (100 requests/100 seconds by default)
- Limit: If dashboard is accessed by many users simultaneously (10+ users at once), API quota can be exceeded, causing fallback to mock data
- Scaling path: Implement caching (Redis, Memcached) with configurable TTL to reduce API calls. Use request deduplication to batch concurrent requests. Consider upgrading to higher quota tier or implementing request throttling on server.

**Mock Data Size:**
- Current capacity: Mock data hardcoded in `lib/mock-data.ts` (~120 lines)
- Limit: If testing with larger datasets, mock data doesn't scale. No way to dynamically generate test data.
- Scaling path: Create mock data generator function that accepts parameters (num_orders, num_months, etc.). Use seed-based randomization for reproducibility.

**Browser Rendering (Chart Size):**
- Current capacity: Fixed chart heights (300px) with Recharts
- Limit: Very small screens (<320px width) may render charts as blank due to layout constraints
- Scaling path: Implement responsive chart heights based on viewport. Test on phones < 375px width. Consider alternative compact chart layouts for mobile.

## Dependencies at Risk

**NextAuth.js v5 Beta:**
- Risk: Using `next-auth@5.0.0-beta.30` (beta version). API may change before 5.0 stable release; security patches may be delayed.
- Files: `package.json` (line 17), `auth.ts` (entire file)
- Impact: Breaking changes in final 5.0 release would require refactoring `auth.ts` and all session code
- Migration plan: Monitor NextAuth.js releases. Create spike task to upgrade once v5.0 stable released (likely mid-2024). Test Google OAuth flow extensively after upgrade.

**Recharts:**
- Risk: Recharts v3.7.0 is relatively new. Certain SVG rendering edge cases may exist (especially with CSS variables)
- Files: `components/dashboard/revenue-chart.tsx`, `components/dashboard/category-chart.tsx`
- Impact: Charts may render incorrectly in specific browsers or with certain data patterns
- Migration plan: Have fallback chart library (Chart.js) identified. Monitor Recharts issues. Test charts in all supported browsers.

**Google Sheets API (googleapis v171.4.0):**
- Risk: googleapis package is community-maintained wrapper around Google API client. May have gaps or outdated behavior.
- Files: `lib/sheets.ts` (line 3)
- Impact: If Google Sheets API changes backend, googleapis may not update quickly
- Migration plan: Monitor googleapis updates. Consider switching to native Google Sheets API client if stability becomes issue.

## Missing Critical Features

**Data Export:**
- Problem: No way to export dashboard data as CSV/Excel. Users must manually copy from dashboard.
- Blocks: Reporting workflows, backup/archival of historical data

**Audit Logging:**
- Problem: No logging of who accessed dashboard, when, or what data changes were made in Google Sheets.
- Blocks: Compliance requirements, debugging data discrepancies, security investigations

**Offline Support:**
- Problem: Dashboard requires network connection to load data. No offline-first or progressive enhancement.
- Blocks: Access when network unavailable, pre-loading data for airplane mode

**Real-time Data Refresh:**
- Problem: Dashboard data only refreshes on page reload. No auto-refresh or live update when Google Sheets changes.
- Blocks: Real-time monitoring use cases, sharing dashboard with stakeholders who expect fresh data

## Test Coverage Gaps

**No E2E Tests:**
- What's not tested: Full login flow (Google OAuth), dashboard data loading, logout, error scenarios
- Files: `app/(auth)/login/page.tsx`, `app/(dashboard)/dashboard/page.tsx`, `lib/data.ts`
- Risk: Breaking changes to auth flow or data loading go undetected until production
- Priority: **High** - auth is critical path and most likely point of failure

**No Unit Tests for Data Parsers:**
- What's not tested: Handling of malformed data, missing columns, unexpected data types in sheets
- Files: `lib/data.ts` (parseKpiFromSheet, parseMonthlyRevenueFromSheet, etc.)
- Risk: Bad data in Google Sheets silently produces wrong numbers in dashboard
- Priority: **High** - data correctness is core requirement

**No Component Tests for UI:**
- What's not tested: Table rendering with various status types, chart rendering with edge cases (0% categories, empty months), responsive layout behavior
- Files: `components/dashboard/recent-orders-table.tsx`, `components/dashboard/revenue-chart.tsx`, `components/layout/sidebar.tsx`
- Risk: UI breaks silently, users see broken layouts without knowing
- Priority: **Medium** - visual issues obvious to users, but responsive behavior on mobile needs testing

**No Integration Tests for Auth:**
- What's not tested: Whitelist enforcement, session persistence, logout flow
- Files: `auth.ts` (callbacks and whitelist logic)
- Risk: Security logic fails silently; unauthorized users might gain access
- Priority: **High** - security-critical

---

*Concerns audit: 2026-02-21*
