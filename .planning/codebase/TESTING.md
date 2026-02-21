# Testing Patterns

**Analysis Date:** 2026-02-21

## Test Framework Status

**Current State:**
- No test framework configured
- No test files present in codebase
- No test runner dependencies (Jest, Vitest, etc.) in package.json
- No test configuration files (jest.config.*, vitest.config.*, etc.)

**Recommendation:**
When testing is needed, consider:
- **Vitest** for unit tests (modern, fast, TypeScript-native)
- **Playwright** or **Cypress** for E2E tests (Next.js optimized)
- **React Testing Library** for component tests (if needed)

## Testable Patterns in Current Code

While no tests exist, the codebase is structured with testing in mind:

### Data Layer (`lib/`)

**Characteristics that support testing:**
- Pure functions with no side effects
  - `parseKpiFromSheet(rows: string[][]): KpiData`
  - `parseMonthlyRevenueFromSheet(rows: string[][]): MonthlyRevenue[]`
  - `parseCategoryFromSheet(rows: string[][]): CategoryDistribution[]`
  - `parseOrdersFromSheet(rows: string[][]): RecentOrder[]`

**How to test these:**
1. Create mock data arrays (2D string arrays)
2. Call parsing functions with mock data
3. Assert returned objects match expected structure
4. Test edge cases: empty rows, missing fields, invalid numbers

**Example test structure (pseudo-code):**
```typescript
// lib/data.test.ts
describe('parseKpiFromSheet', () => {
  it('should parse KPI rows correctly', () => {
    const mockRows = [
      ['지표명', '값'],
      ['총 매출', '100000000'],
      ['주문 수', '500'],
      ['평균 주문 금액', '200000'],
      ['성장률', '5.5'],
    ];

    const result = parseKpiFromSheet(mockRows);

    expect(result.totalRevenue).toBe(100000000);
    expect(result.orderCount).toBe(500);
  });
});
```

### Configuration Functions

**Functions that should be tested:**
- `isGoogleSheetsConfigured(): boolean` - Check environment variables
- `isGoogleOAuthConfigured(): boolean` - Check environment variables
- `getAllowedEmails(): string[]` - Parse email list from environment

**How to test:**
1. Mock `process.env` values
2. Call configuration function
3. Assert correct parsing/validation

**Example test structure:**
```typescript
// auth.test.ts
describe('getAllowedEmails', () => {
  it('should parse comma-separated emails', () => {
    process.env.ALLOWED_EMAILS = 'admin@example.com, user@example.com';
    const emails = getAllowedEmails();
    expect(emails).toEqual(['admin@example.com', 'user@example.com']);
  });

  it('should trim whitespace', () => {
    process.env.ALLOWED_EMAILS = ' a@test.com , b@test.com ';
    const emails = getAllowedEmails();
    expect(emails).toEqual(['a@test.com', 'b@test.com']);
  });
});
```

### API Integration (`lib/sheets.ts`)

**Current pattern:**
- Wrapper around Google Sheets API
- Returns `Promise<string[][] | null>`
- No error throwing, returns null on misconfiguration

**Testing approach:**
- Mock googleapis client
- Mock environment variables
- Test authentication setup
- Test API call parameters

```typescript
// lib/sheets.test.ts
describe('fetchSheetData', () => {
  it('should return null when Google Sheets not configured', async () => {
    process.env.GOOGLE_SHEETS_ID = '';
    const result = await fetchSheetData('KPI!A1:B5');
    expect(result).toBeNull();
  });

  it('should fetch data from Google Sheets', async () => {
    // Mock googleapis
    // Mock environment variables
    // Assert correct range is requested
  });
});
```

### Component Testability

**Server Components (no interaction testing needed):**
- `KpiCards` - Pure data display, receive props, render
- `RecentOrdersTable` - Pure data display, no interaction
- `DashboardPage` - Data fetching, component composition

**How to test server components:**
1. Render component with mock data
2. Assert correct data is displayed
3. Verify snapshots (optional)

**Client Components (interaction testing):**
- `Sidebar` - useState for collapse/mobile, navigation links
- `Header` - useSession hook, dropdown menu interaction
- `RevenueChart` - Recharts chart rendering
- `CategoryChart` - Recharts chart rendering

**What to test in client components:**
1. State changes (collapse/expand sidebar)
2. Hook integration (useSession, useTheme)
3. Event handlers (click, form submit)
4. Conditional rendering

```typescript
// components/layout/sidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  it('should toggle collapsed state', () => {
    render(<Sidebar />);

    const toggleButton = screen.getByRole('button', { name: /toggle/i });
    fireEvent.click(toggleButton);

    // Assert sidebar width changes or state updates
  });
});
```

## Mock Data Strategy

**Current Pattern:**
- `lib/mock-data.ts` provides complete mock `DashboardData`
- Used as fallback when:
  - Google Sheets not configured (environment variables missing)
  - Individual sheet fetch fails
  - `getDashboardData()` catches errors

**Test Data Usage:**
- Mock data can be used in component tests
- Provides realistic sample structure
- Used in Storybook or visual testing (if added)

**Structure for testing:**
```typescript
// test/fixtures/dashboard.ts
import { mockDashboardData } from '@/lib/mock-data';

export const testDashboardData = {
  ...mockDashboardData,
  // Can override specific values for different test scenarios
};
```

## Areas That Need Testing

**Critical paths:**
1. Data parsing functions in `lib/data.ts`
   - Each parse function should test: normal data, empty data, malformed data
   - Risk if broken: Dashboard displays incorrect numbers or crashes

2. Authentication flow in `auth.ts`
   - Email whitelist validation
   - Google OAuth vs Credentials provider switching
   - Session creation
   - Risk if broken: Unauthorized access or login failures

3. Route protection in `proxy.ts`
   - Unauthenticated users redirect to login
   - Authenticated users on login page redirect to dashboard
   - Risk if broken: Security breach (unauth access) or UX breakage

4. Component rendering
   - Charts display with correct data
   - Tables render rows correctly
   - KPI cards show formatted values
   - Risk if broken: Dashboard appears broken, data misrepresented

## Testing Best Practices for This Codebase

**When adding tests:**

1. **Test parsing functions first** - They have the highest ROI (pure, isolated, deterministic)

2. **Mock external services** - Google Sheets API, NextAuth providers
   - Use jest.mock() or vitest.mock()
   - Mock environment variables

3. **Use test fixtures** - Based on mockDashboardData structure
   - Create variations (empty data, error scenarios)
   - Reuse across tests

4. **Server component tests** - Use React's renderToString or Playwright
   - Test data fetching
   - Test component composition
   - Don't test rendering details, test data flow

5. **Client component tests** - Use React Testing Library
   - Test user interactions
   - Test state changes
   - Test hook integration (useSession, useTheme)

6. **Integration tests** - Test data flow end-to-end
   - Mock API, test full getDashboardData flow
   - Test route protection

7. **E2E tests** - Use Playwright for critical paths
   - Login flow (Google OAuth + Credentials)
   - Dashboard data displays
   - Route protection

## Configuration Pattern for Testing

**When adding test infrastructure:**

Add to `package.json` scripts:
```json
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

---

*Testing analysis: 2026-02-21*
