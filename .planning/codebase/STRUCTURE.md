# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
sheet-dashboard/
├── app/                          # Next.js App Router root
│   ├── layout.tsx                # Root layout (providers, fonts, global CSS)
│   ├── page.tsx                  # / → redirects to /dashboard
│   ├── api/
│   │   └── auth/[...nextauth]/
│   │       └── route.ts          # NextAuth API handlers
│   ├── (auth)/                   # Route group: authentication pages
│   │   ├── layout.tsx            # Center-aligned layout for login
│   │   └── login/
│   │       └── page.tsx          # Login page (Google OAuth + email fallback)
│   ├── (dashboard)/              # Route group: protected dashboard pages
│   │   ├── layout.tsx            # Dashboard layout (sidebar + header + main)
│   │   └── dashboard/
│   │       └── page.tsx          # Main dashboard (server component with data fetch)
│   └── globals.css               # Global styles, Tailwind directives, CSS variables
├── components/
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── category-chart.tsx    # Pie chart (client)
│   │   ├── kpi-cards.tsx         # 4 KPI summary cards (server)
│   │   ├── recent-orders-table.tsx # Orders table (server)
│   │   └── revenue-chart.tsx     # Line chart (client)
│   ├── layout/                   # Layout structure components
│   │   ├── header.tsx            # Top header with theme toggle + user dropdown (client)
│   │   ├── sidebar.tsx           # Left sidebar with nav (client, responsive)
│   │   └── theme-toggle.tsx      # Dark/light mode button (client)
│   ├── providers/                # Context/provider wrappers (all client)
│   │   ├── session-provider.tsx  # NextAuth SessionProvider wrapper
│   │   └── theme-provider.tsx    # next-themes ThemeProvider wrapper
│   └── ui/                       # shadcn/ui components (auto-generated)
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       └── table.tsx
├── lib/
│   ├── data.ts                   # Data orchestration (sheets + mock fallback)
│   ├── mock-data.ts              # Fallback mock data
│   ├── sheets.ts                 # Google Sheets API wrapper
│   └── utils.ts                  # Utilities (cn function)
├── types/
│   └── dashboard.ts              # TypeScript interfaces for dashboard data
├── auth.ts                        # NextAuth configuration (providers, callbacks)
├── proxy.ts                       # Route protection proxy (replaces middleware.ts)
├── tsconfig.json                 # TypeScript configuration with @ path alias
├── package.json                  # Dependencies and scripts
├── next.config.ts                # Next.js configuration
├── eslint.config.mjs             # ESLint configuration
├── postcss.config.mjs            # PostCSS + Tailwind setup
├── components.json               # shadcn/ui configuration
├── .env.example                  # Environment variable template
├── .env.local                    # Environment variables (not committed)
├── public/                       # Static assets
├── .gitignore                    # Git ignore patterns
├── CLAUDE.md                     # Project guidance for Claude
└── README.md                     # Project documentation
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js 16 App Router pages and layouts
- Contains: Page components, API routes, layout wrappers, global CSS
- Route groups organize auth vs. dashboard flows

**`components/`:**
- Purpose: Reusable React components
- Contains: UI primitives (shadcn), layout blocks, dashboard panels
- Organized by feature: `dashboard/`, `layout/`, `providers/`, `ui/`

**`lib/`:**
- Purpose: Business logic and utilities
- Contains: Data fetching (sheets.ts), data parsing (data.ts), mock data, helper functions
- No UI code here

**`types/`:**
- Purpose: TypeScript type definitions
- Contains: DashboardData interface and related types (KpiData, MonthlyRevenue, etc.)
- Imported by lib files and components

**`public/`:**
- Purpose: Static assets served as-is
- Contains: Images, favicons, fonts (if any)

## Key File Locations

**Entry Points:**

- `app/layout.tsx` (Root): Wraps all pages with SessionProvider + ThemeProvider, injects global CSS
- `app/(auth)/login/page.tsx` (Auth): Renders login UI, detects Google OAuth vs. dev mode
- `app/(dashboard)/dashboard/page.tsx` (Dashboard): Server component that fetches data and renders dashboard

**Configuration:**

- `auth.ts`: NextAuth providers, callbacks, session config, email whitelist logic
- `proxy.ts`: Route protection logic (session checks, redirects)
- `.env.example`: Template for required environment variables
- `tsconfig.json`: @ path alias configured to root directory
- `next.config.ts`: Next.js build configuration
- `postcss.config.mjs`: Tailwind CSS v4 setup
- `components.json`: shadcn/ui install options (new-york style)

**Core Logic:**

- `lib/sheets.ts`: Google Sheets API client (JWT auth, fetchSheetData function)
- `lib/data.ts`: Data orchestration (parallel sheet fetching, parsing, fallback logic)
- `lib/mock-data.ts`: Default mock data when Sheets not configured
- `types/dashboard.ts`: All data type definitions (KpiData, MonthlyRevenue, CategoryDistribution, RecentOrder, DashboardData)

**Testing:**

- No test files present in codebase

**Styling:**

- `app/globals.css`: Tailwind directives, CSS variables for colors (oklch), chart colors, sidebar colors

## Naming Conventions

**Files:**

- `*.tsx`: React components (default)
- `*.ts`: TypeScript utilities, config, types (no JSX)
- `[...nextauth]` and `[dynamic-segment]`: Next.js dynamic routes
- `(group-name)`: Route groups (not visible in URL)
- `page.tsx`: Route file
- `layout.tsx`: Layout wrapper file
- `route.ts`: API route handler

**Directories:**

- Plural noun for feature collections: `components/`, `lib/`, `types/`, `public/`
- Feature-based grouping: `dashboard/`, `layout/`, `providers/`, `ui/`
- Route groups in parentheses: `(auth)`, `(dashboard)`

**Functions and Variables:**

- camelCase for functions: `getDashboardData()`, `fetchSheetData()`, `parseKpiFromSheet()`
- camelCase for variables: `data`, `session`, `collapsed`, `mobileOpen`
- SCREAMING_SNAKE_CASE for constants: `statusStyles` (object), `errorMessages` (object), `navItems` (array)
- PascalCase for React components: `KpiCards`, `RevenueChart`, `Header`, `Sidebar`

**Types:**

- PascalCase interfaces: `KpiData`, `MonthlyRevenue`, `CategoryDistribution`, `RecentOrder`, `DashboardData`
- Suffix interfaces with intent: `Props` for component props (e.g., `KpiCardsProps`, `HeaderProps`)

## Where to Add New Code

**New Dashboard Feature (e.g., inventory chart):**

1. **Type Definition** → `types/dashboard.ts`
   - Add interface (e.g., `InventoryData`)
   - Extend `DashboardData` to include new field

2. **Data Layer** → `lib/data.ts`
   - Add parser function (e.g., `parseInventoryFromSheet()`)
   - Add sheet fetch in `getDashboardData()` Promise.all
   - Add mock data substitution

3. **Mock Data** → `lib/mock-data.ts`
   - Add mock objects to `mockDashboardData`

4. **Component** → `components/dashboard/inventory-chart.tsx`
   - Create Server or Client Component as needed
   - Import type, props interface, shadcn components

5. **Page Integration** → `app/(dashboard)/dashboard/page.tsx`
   - Add component to layout grid
   - Pass data prop from page data object

**New Page (e.g., reports):**

1. Create route file: `app/(dashboard)/reports/page.tsx` (or wrapped in new route group)
2. Add layout if needed: `app/(dashboard)/layout.tsx` (shared) or new group layout
3. Create component file in `components/` organized by feature
4. If data needed: Extend `lib/data.ts` with new fetch function
5. Update navigation in `components/layout/sidebar.tsx` `navItems` array

**New Utility Function:**

- Generic utilities (no feature-specific logic) → `lib/utils.ts`
- Example: formatCurrency, formatDate helper functions
- Alternatively create feature-specific file: `lib/formatters.ts`

**New Provider or Context:**

1. Create in `components/providers/` directory
2. Wrap in root `app/layout.tsx`
3. Follow pattern of `SessionProvider`, `ThemeProvider` (re-export with "use client")

**New UI Component:**

- Install via `shadcn` CLI: `npx shadcn add component-name`
- Install writes to `components/ui/component-name.tsx`
- Import and use in feature components

## Special Directories

**`app/globals.css`:**
- Purpose: Global Tailwind setup + CSS variables
- Generated: No (hand-written)
- Committed: Yes
- Contains: @tailwind directives, oklch color variables, chart color vars, sidebar vars

**`.next/`:**
- Purpose: Build output and cached data
- Generated: Yes (by `npm run build`)
- Committed: No (.gitignore)
- Created: At build time

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by npm/package manager)
- Committed: No (.gitignore)
- Contains: next, react, tailwindcss, googleapis, recharts, shadcn/ui, etc.

**`.env.local`:**
- Purpose: Environment variables (secrets, API keys)
- Generated: Manual
- Committed: No (.gitignore)
- Template: `.env.example`
- Contains: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, ALLOWED_EMAILS (optional)

**`.claude/`:**
- Purpose: Claude development tools metadata
- Generated: Yes (by Claude Code)
- Committed: No (.gitignore)
- Contains: GSD configuration, hooks, templates

**`public/`:**
- Purpose: Static assets (images, favicons)
- Generated: No
- Committed: Yes (if content added)
- Served: At `http://localhost:3000/filename`

## File Dependency Graph (Simplified)

```
Root Entry: app/layout.tsx
├── components/providers/session-provider.tsx
│   └── next-auth/react (SessionProvider)
├── components/providers/theme-provider.tsx
│   └── next-themes (ThemeProvider)
├── app/globals.css (Tailwind, CSS variables)
└── children:
    ├── proxy.ts (checks auth, redirects)
    │   └── auth.ts
    │       └── next-auth (NextAuth config)
    ├── app/(auth)/layout.tsx → app/(auth)/login/page.tsx
    │   └── auth.ts (signIn function)
    └── app/(dashboard)/layout.tsx
        ├── components/layout/sidebar.tsx (uses useState)
        ├── components/layout/header.tsx (uses useSession, useTheme)
        │   └── components/layout/theme-toggle.tsx
        └── app/(dashboard)/dashboard/page.tsx (Server Component)
            ├── lib/data.ts (getDashboardData)
            │   ├── lib/sheets.ts (fetchSheetData)
            │   └── lib/mock-data.ts (mockDashboardData)
            └── components/dashboard/*
                ├── kpi-cards.tsx (uses types/dashboard.ts)
                ├── revenue-chart.tsx (Client, Recharts)
                ├── category-chart.tsx (Client, Recharts)
                └── recent-orders-table.tsx
```

