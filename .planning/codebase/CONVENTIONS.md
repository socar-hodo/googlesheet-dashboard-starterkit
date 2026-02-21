# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- Components: PascalCase filename with `.tsx` extension
  - Example: `Sidebar.tsx`, `KpiCards.tsx`, `RevenueChart.tsx`
- Utilities/Services: camelCase filename with `.ts` extension
  - Example: `sheets.ts`, `data.ts`, `utils.ts`, `mock-data.ts`
- Pages: lowercase filename with `.tsx` extension
  - Example: `page.tsx`, `layout.tsx`
- Types: camelCase filename with `.ts` extension
  - Example: `dashboard.ts`

**Functions:**
- camelCase for all function names (both exports and internals)
  - Example: `getDashboardData()`, `fetchSheetData()`, `parseKpiFromSheet()`
- Utility functions with verb prefixes
  - Example: `get*`, `fetch*`, `parse*`, `is*` (isGoogleSheetsConfigured), `getAllowedEmails()`

**Variables:**
- camelCase for variable declarations
  - Example: `totalRevenue`, `orderCount`, `averageOrderValue`, `mobileOpen`, `collapsed`
- CONSTANT_CASE for module-level constants
  - Example: `CHART_COLORS`, `navItems`, `errorMessages`
- Private functions start with lowercase (no underscore prefix)
  - Example: `getAuthClient()`, `getProviders()`, `parseOrdersFromSheet()`

**Types/Interfaces:**
- PascalCase for type/interface names
  - Example: `KpiData`, `MonthlyRevenue`, `CategoryDistribution`, `RecentOrder`, `DashboardData`
- Properties in interfaces use camelCase
  - Example: `totalRevenue`, `customerName`, `averageOrderValue`
- Type unions for strings use Korean characters as literal values
  - Example: `status: "완료" | "처리중" | "취소"`

## Code Style

**Formatting:**
- No dedicated formatter (Prettier not configured)
- Default ESLint formatting applies (ESLint v9 with Next.js config)
- Indentation: 2 spaces (standard Next.js convention)
- Line length: No explicit limit observed, but keep reasonable

**Linting:**
- Tool: ESLint 9 with Next.js core web vitals and TypeScript presets
- Config: `eslint.config.mjs` uses `eslint/config` and `eslint-config-next`
- Run with: `npm run lint`
- Key enforced rules: Next.js core web vitals compliance, TypeScript strict mode

**Comments:**
- JSDoc style with `/** ... */` for exported functions
  - Include `@param` for parameters
  - Include `@returns` for return type
  - Include `@example` for complex functions
  - Example from `lib/sheets.ts`:
    ```typescript
    /**
     * 스프레드시트에서 특정 범위의 데이터를 가져옵니다.
     *
     * @param range - 시트 범위 (예: "KPI!A1:B5", "매출!A1:B13")
     * @returns 2차원 문자열 배열 또는 null (환경변수 미설정 시)
     *
     * @example
     * const rows = await fetchSheetData("매출!A1:B13");
     * // rows = [["월", "매출"], ["1월", "8500000"], ...]
     */
    ```
- Single-line comments with `//` for implementation details
  - Inline comments explain "why" not "what"
  - Example: `// .env 파일에서 \\n을 실제 줄바꿈 문자로 변환`

**Language Convention:**
- Code comments: Korean (한국어)
- Commit messages: Korean (한국어)
- Variable/function names: English (영어)
- String constants/UI text: Korean (한국어)
  - Example: `title: "총 매출"`, `label: "대시보드"`, `status: "완료"`

## Import Organization

**Order:**
1. Next.js/React imports (`import type`, `import { ... } from "next"`, `import { ... } from "react"`)
2. Third-party library imports (shadcn/ui, lucide-react, recharts, etc.)
3. Local utility imports (`@/lib/...`, `@/utils/...`)
4. Local component imports (`@/components/...`)
5. Local type imports (`import type { ... } from "@/types/..."`)

**Example from `components/layout/header.tsx`:**
```typescript
"use client";

// React/Next.js
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

// shadcn/ui
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, ... } from "@/components/ui/dropdown-menu";

// Local components
import { ThemeToggle } from "./theme-toggle";

// Types (inline in interface)
interface HeaderProps {
  title: string;
}
```

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Used for all non-relative imports
  - Never use relative paths like `../../../lib/utils`
  - Always use: `@/lib/utils`, `@/components/ui/card`

## Error Handling

**Patterns:**
- Try-catch blocks for async operations that might fail
  - Example in `lib/data.ts`: Wraps `Promise.all()` for sheet fetches, logs error, returns mock data as fallback
- Graceful degradation: Individual sheet failures use mock fallback for that section only
  - Example: If KPI fetch fails, KPI uses mock but revenue chart still uses real data if available
- Error messages logged with context
  - Example: `console.error("Google Sheets 데이터 가져오기 실패, mock 데이터로 대체:", error)`
- User-facing errors mapped to Korean messages
  - Example in `app/(auth)/login/page.tsx`: `errorMessages` record maps NextAuth codes to Korean UI text

**Type Safety:**
- No `any` types observed
- Type coercion with `as` casting only when necessary
  - Example: `(row[4] as RecentOrder["status"]) ?? "처리중"`
- Nullish coalescing (`??`) for default values
  - Example: `row[0] ?? ""`, `Number(row[1] ?? 0)`

## Function Design

**Size:**
- Most functions 10-40 lines
- Parsing functions: 5-10 lines (short, focused)
- Component functions: 20-60 lines total (render + helper data)

**Parameters:**
- Single object parameter for components (destructured)
  - Example: `export function KpiCards({ data }: KpiCardsProps)`
  - Never more than 2 inline parameters
- Props defined as separate interfaces
  - Example: `interface KpiCardsProps { data: KpiData; }`
  - Always use `readonly` for component props implicitly (not explicitly marked)

**Return Values:**
- Promise-based functions explicitly return `Promise<Type>`
  - Example: `async function fetchSheetData(range: string): Promise<string[][] | null>`
- JSX components return implicit `React.ReactElement` or `JSX.Element`
- Null as failure indicator
  - Example: `fetchSheetData` returns `null` when not configured
- Fallback mechanism: Return mock data on error instead of throwing

## Module Design

**Exports:**
- Named exports for components and utilities
  - Example: `export function KpiCards() { ... }`
  - Example: `export async function getDashboardData() { ... }`
- Default exports used only for Next.js pages
  - Example: `export default async function DashboardPage() { ... }`

**File Organization:**
- One component per file (except shadcn/ui which is auto-generated)
- Interfaces defined in same file or in `types/` directory
  - Component props interfaces in same file
  - Shared data types in `types/dashboard.ts`
- Utilities grouped by domain in `lib/` directory
  - `lib/sheets.ts`: Google Sheets API wrapper
  - `lib/data.ts`: Data integration layer
  - `lib/utils.ts`: General utilities (currently just `cn()`)
  - `lib/mock-data.ts`: Mock data exports

**Constants:**
- Module-level constants defined at top of file after imports
  - Example: `const navItems = [ ... ]` in sidebar.tsx
  - Example: `const CHART_COLORS = [ ... ]` in category-chart.tsx
  - Example: `const errorMessages: Record<string, string> = { ... }` in login page

## Configuration & Environment

**TypeScript:**
- Config: `tsconfig.json`
- Strict mode enabled: `"strict": true`
- Target: ES2017
- Module: esnext
- Path aliases: `@/*` → current directory

**Environment Variables:**
- Auth: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (optional, switches providers)
- Sheets: `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`
- Feature flags: `ALLOWED_EMAILS` (comma-separated, optional, empty = allow all)
- All accessed via `process.env.VARIABLE_NAME`
- No `.env.local` file in repo (create locally)

## Type Annotations

**Approach:**
- Strict type annotations throughout
- Infer types only for obvious cases (e.g., map/filter results)
- Always annotate function parameters and return types
- React types imported from 'react': `React.ReactNode`, `React.FC` (rarely used)

**Server vs Client:**
- Server Components: No explicit type annotation, rendered on server
- Client Components: `"use client"` directive at top of file
- Async Server Components: `async function DashboardPage()`

---

*Convention analysis: 2026-02-21*
