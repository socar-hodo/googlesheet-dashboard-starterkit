# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** Next.js 16 Server-First Dashboard with Route Groups and 3-Layer Data Abstraction

**Key Characteristics:**
- Server Components by default for data fetching, Client Components for interactivity
- Route groups for authentication vs. dashboard layouts
- Graceful fallback from Google Sheets API to mock data
- Conditional authentication (Google OAuth or development mode)
- CSS-variable-driven theming with next-themes support

## Layers

**Authentication Layer:**
- Purpose: Google OAuth with email whitelist + development credentials fallback
- Location: `auth.ts`, `app/api/auth/[...nextauth]/route.ts`
- Contains: NextAuth configuration, provider setup, email validation
- Depends on: NextAuth.js v5 beta, environment variables
- Used by: Route proxy (`proxy.ts`), session providers

**Route Protection Layer:**
- Purpose: Redirect unauthenticated users to login, authenticated users away from login
- Location: `proxy.ts`
- Contains: Auth check logic for `/dashboard` and `/login` paths
- Depends on: NextAuth session, NextResponse utilities
- Used by: All routes (applies as matcher-based proxy)

**Data Abstraction Layer (3-tier):**
- Purpose: Provide consistent DashboardData interface with fallback handling
- Location: `lib/sheets.ts`, `lib/data.ts`, `lib/mock-data.ts`
- Tier 1 - API Client: `lib/sheets.ts` (Google Sheets API wrapper)
  - Handles JWT service account auth
  - Provides `fetchSheetData(range)` for raw sheet reads
  - Returns null if credentials missing
- Tier 2 - Integration: `lib/data.ts` (data orchestration)
  - Parses raw sheet data into typed structures
  - Implements parallel fetching with Promise.all
  - Falls back to mock data per-section on individual sheet failure
  - Main export: `getDashboardData()`
- Tier 3 - Mock Data: `lib/mock-data.ts`
  - Exports `mockDashboardData: DashboardData`
  - Used as fallback when Google Sheets not configured or fetch fails
- Depends on: googleapis SDK, types/dashboard.ts
- Used by: Dashboard page (`app/(dashboard)/dashboard/page.tsx`)

**Presentation Layer (Components):**
- Purpose: Render dashboard data and handle user interaction
- Server Components (no interactivity):
  - `components/dashboard/kpi-cards.tsx` - 4 KPI summary cards
  - `components/dashboard/recent-orders-table.tsx` - Orders table
- Client Components (with state/hooks):
  - `components/dashboard/revenue-chart.tsx` - Recharts line chart
  - `components/dashboard/category-chart.tsx` - Recharts pie chart
  - `components/layout/sidebar.tsx` - Responsive sidebar with collapse
  - `components/layout/header.tsx` - User dropdown, theme toggle
- Depends on: shadcn/ui, Recharts, lucide-react, next-auth hooks
- Used by: Layout routes, page routes

**Layout Layer:**
- Purpose: Provide route group-specific layouts
- Root Layout: `app/layout.tsx`
  - Providers (SessionProvider, ThemeProvider)
  - Global styles, fonts
- Auth Layout: `app/(auth)/layout.tsx`
  - Center-aligned container for login
- Dashboard Layout: `app/(dashboard)/layout.tsx`
  - Two-column (sidebar + main) responsive grid

## Data Flow

**Page Load (Authenticated User):**

1. Request to `/dashboard` → `proxy.ts` checks session → NextResponse.next()
2. `app/(dashboard)/dashboard/page.tsx` (Server Component)
   - Calls `getDashboardData()`
3. `getDashboardData()` in `lib/data.ts`:
   - Checks if Google Sheets configured via `isGoogleSheetsConfigured()`
   - If not configured → Returns `mockDashboardData` immediately
   - If configured → Parallel fetch 4 sheets with `Promise.all`
   - Parses each sheet via `parseKpiFromSheet()`, `parseMonthlyRevenueFromSheet()`, etc.
   - Catches errors per-sheet → Substitutes mock data for failed sheets
4. Returns `DashboardData` (typed object with kpi, monthlyRevenue, categoryDistribution, recentOrders)
5. Dashboard page spreads data to child components:
   - `<KpiCards data={data.kpi} />`
   - `<RevenueChart data={data.monthlyRevenue} />`
   - `<CategoryChart data={data.categoryDistribution} />`
   - `<RecentOrdersTable data={data.recentOrders} />`
6. Client-side hydration: Recharts charts render (require DOM), sidebar/header mount with useState

**Authentication Flow (Login):**

1. Request to `/login` → `proxy.ts` checks session:
   - If authenticated → Redirect to `/dashboard`
   - If not → NextResponse.next() → Show login page
2. `app/(auth)/login/page.tsx` renders:
   - Google OAuth button (if `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` set)
   - OR email-only form (if Google keys missing)
3. User submits → `signIn("google")` or `signIn("credentials")`
4. `auth.ts` callbacks:
   - `signIn()` callback validates `ALLOWED_EMAILS`
   - If whitelist empty → Allow all emails
   - If whitelist set → Check against allowed list
5. On success → Session created (JWT strategy) → Redirect to `/dashboard`
6. On error → Redirect to `/login?error=ErrorCode` → Map to Korean message in component

**State Management:**

- **Session**: Managed by NextAuth, accessed via `useSession()` hook in Client Components
- **Theme**: Managed by next-themes `ThemeProvider`, toggled via `useTheme()` hook
- **Sidebar State**: Local useState in `components/layout/sidebar.tsx` (collapsed/mobileOpen)
- **No global state library**: Data flows down from server (getDashboardData) → page → components

## Key Abstractions

**DashboardData Interface:**
- Purpose: Unified contract for all dashboard content
- Location: `types/dashboard.ts`
- Structure:
  - `kpi: KpiData` (4 metrics)
  - `monthlyRevenue: MonthlyRevenue[]` (12 months)
  - `categoryDistribution: CategoryDistribution[]` (5 categories)
  - `recentOrders: RecentOrder[]` (10 orders)
- Pattern: Imported in `lib/data.ts` and `lib/mock-data.ts`, passed through page → components

**GoogleSheetsClient (via fetchSheetData):**
- Purpose: Encapsulate Google Sheets API calls with JWT auth
- Pattern: Single exported function `fetchSheetData(range: string)`
- Range format: `"SheetName!A1:C5"` (e.g., `"KPI!A1:B5"`, `"매출!A1:B13"`)
- Returns: 2D string array or null

**Data Parser Functions:**
- Purpose: Transform raw sheet rows to typed objects
- Examples in `lib/data.ts`:
  - `parseKpiFromSheet(rows: string[][]): KpiData`
  - `parseMonthlyRevenueFromSheet(rows: string[][]): MonthlyRevenue[]`
  - `parseCategoryFromSheet(rows: string[][]): CategoryDistribution[]`
  - `parseOrdersFromSheet(rows: string[][]): RecentOrder[]`
- Pattern: Slice rows[1:] to skip header, extract columns by index

**Route Group Pattern:**
- Purpose: Separate authentication and dashboard concerns
- `(auth)` group: `/login` page, center-aligned layout
- `(dashboard)` group: Protected dashboard pages, sidebar layout
- Root route `/` redirects to `/dashboard` via `redirect()`

## Entry Points

**Web Server Entry:**
- Location: `app/layout.tsx` (root)
- Triggers: HTTP request to any path
- Responsibilities: Wrap children in SessionProvider + ThemeProvider, inject fonts, load global CSS

**Authentication Entry:**
- Location: `app/(auth)/login/page.tsx`
- Triggers: User navigates to `/login` or session expires
- Responsibilities: Render login form (Google OAuth or credentials), display error messages

**Dashboard Entry:**
- Location: `app/(dashboard)/dashboard/page.tsx`
- Triggers: User navigates to `/dashboard` after login
- Responsibilities: Fetch data server-side, render KPI + charts + table

**Route Protection Entry:**
- Location: `proxy.ts`
- Triggers: Every non-static request (via matcher config)
- Responsibilities: Check auth status, redirect if needed

**API Entry:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: POST to `/api/auth/signin`, `/api/auth/callback/google`, etc.
- Responsibilities: Delegate to NextAuth handlers

## Error Handling

**Strategy:** Graceful degradation with fallbacks; errors logged but don't break page

**Patterns:**

- **Google Sheets Fetch Fails:** Individual sheet returns null → Parser receives null → Uses `mockDashboardData` for that section
  - Example: `kpiRows ? parseKpiFromSheet(kpiRows) : mockDashboardData.kpi`
  - Benefit: One broken sheet doesn't hide all data

- **Global Sheets Config Missing:** `isGoogleSheetsConfigured()` returns false → `getDashboardData()` returns mock immediately
  - No API calls attempted
  - Deterministic dev experience

- **Authentication Callback Fails:** Error code appended to URL (`/login?error=AccessDenied`)
  - Server component reads searchParams
  - Maps error code to Korean message via `errorMessages` object
  - User can retry

- **Console Logging:** `console.error()` in `lib/data.ts` on Sheets failure (falls through to catch)
  - Errors are visible in server logs
  - Do not crash the render

## Cross-Cutting Concerns

**Logging:**
- console.error in `lib/data.ts` on Google Sheets failures
- No dedicated logging framework

**Validation:**
- Email whitelist in `auth.ts` via `getAllowedEmails()` and `signIn` callback
- TypeScript types enforce shape of parsed data
- Range format is manual (string literals like `"KPI!A1:B5"`)

**Authentication:**
- NextAuth.js v5 with conditional provider selection
- Google OAuth for production, Credentials for dev
- Session strategy: JWT (required for Credentials provider)
- Callbacks: `signIn()` for email validation, `session()` to include user ID

**Styling:**
- Tailwind v4 with CSS variables in `app/globals.css`
- oklch color space for theme-aware colors
- CSS variables: `--chart-1` through `--chart-5` for chart colors
- `--sidebar-*` variables for sidebar theming
- `cn()` utility from `lib/utils.ts` (clsx + tailwind-merge)

**Theme Switching:**
- next-themes provider wraps app
- useTheme hook in `components/layout/theme-toggle.tsx`
- HTML tag has `suppressHydrationWarning` (required by next-themes)
- Automatic system theme detection

**Environment Configuration:**
- `.env.local` file (not committed)
- `.env.example` as template
- AUTH_* prefixed env vars auto-recognized by NextAuth v5
- GOOGLE_* prefixed vars for Sheets API
- ALLOWED_EMAILS for whitelist (comma-separated)

