# External Integrations

**Analysis Date:** 2026-02-21

## APIs & External Services

**Google Sheets:**
- Google Sheets API v4 - Fetches dashboard data (KPI, monthly revenue, category distribution, recent orders)
  - SDK/Client: `googleapis` 171.4.0
  - Auth: Service account (JWT auth)
  - Configuration: `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`
  - Implementation: `lib/sheets.ts` exports `fetchSheetData()` for querying specific ranges
  - Scope: `https://www.googleapis.com/auth/spreadsheets.readonly` (read-only)
  - Data fetching: `lib/data.ts` calls `getDashboardData()` which parallelizes requests via `Promise.all` for KPI, revenue, category, and order sheets
  - Fallback: Individual sheet failures trigger mock data for that section; complete failure returns full mock dataset

**Google OAuth:**
- Google OAuth 2.0 provider (conditional)
  - Auth: `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` env vars
  - Configuration: Enabled if both env vars are set; otherwise falls back to dev credentials
  - Implementation: `auth.ts` providers array uses NextAuth.js Google provider
  - Scope: Default OpenID/email scope (configured by NextAuth)
  - User data: Email, name, profile picture (via `lh3.googleusercontent.com`)

## Data Storage

**Databases:**
- None - Read-only dashboards; no persistent data storage in application
- Source of truth: Google Sheets spreadsheet (via API)

**File Storage:**
- None - Application does not upload or store files
- Remote images: Google profile pictures from `lh3.googleusercontent.com` (allowed via `next.config.ts`)

**Caching:**
- None - No caching layer detected
- Data freshness: Real-time from Google Sheets on each page load (server-side render)

## Authentication & Identity

**Auth Provider:**
- NextAuth.js 5.0.0-beta.30 (hybrid approach)

**Implementation Details:**
- **Primary**: Google OAuth (when `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` configured)
  - Provider: Google (via `next-auth/providers/google`)
  - Callback: `signIn` checks email against `ALLOWED_EMAILS` whitelist (empty list = all emails allowed)
  - Session strategy: JWT (required for Credentials provider compatibility)

- **Development Fallback**: Credentials Provider (when Google OAuth not configured)
  - Name: "개발 모드 로그인"
  - Auth: Email-only (no password required; `authorize()` accepts any email)
  - Returns user object with: `id`, `name`, `email`, `image: null`

**Session Management:**
- Strategy: JWT (via `session.strategy = "jwt"` in `auth.ts`)
- Callbacks:
  - `signIn()` - Validates email against whitelist
  - `session()` - Injects user ID from token into session

**Session Access:**
- Used in client components via `useSession()` hook (NextAuth.js)
- Protected routes checked via server-side `auth()` call
- Route protection mechanism: `proxy.ts` (replaced `middleware.ts` in Next.js 16)

## Monitoring & Observability

**Error Tracking:**
- Not detected - No third-party error tracking (Sentry, etc.)
- Console logging only: `console.error()` in `lib/data.ts` when Google Sheets fetch fails

**Logs:**
- Server-side console logs: Error messages logged when Sheets API calls fail
- Client-side: No structured logging detected

## CI/CD & Deployment

**Hosting:**
- Not specified - Application ready for deployment but no active integration detected
- Deployment targets: Vercel (typical for Next.js), self-hosted Node.js, or containerized

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI service integration

**Build Process:**
```bash
npm run build  # Production build (compiles TypeScript, optimizes assets)
npm run dev    # Development server (localhost:3000)
npm start      # Production server (after build)
npm run lint   # ESLint validation
```

## Environment Configuration

**Required env vars:**
- `AUTH_SECRET` - NextAuth JWT secret (generate via `openssl rand -base64 32`)
- `AUTH_GOOGLE_ID` - Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth client secret

**Optional env vars:**
- `ALLOWED_EMAILS` - Comma-separated emails (if empty, all emails allowed)
- `GOOGLE_SHEETS_ID` - Spreadsheet ID (if not set, uses mock data)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Service account private key (JSON format; `\\n` replaced with actual newlines)

**Secrets location:**
- `.env.local` (development) - Not committed to git
- Environment variables (production) - Set in deployment platform

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints for external services

**Outgoing:**
- None detected - Application only reads data from Google Sheets; no write operations or event publishing

## Image/Content Hosting

**External Image Sources:**
- `lh3.googleusercontent.com` - Google profile pictures (allowed via `next.config.ts` remote patterns)
- Only this domain whitelisted for image optimization

---

*Integration audit: 2026-02-21*
