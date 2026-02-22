# Phase 2: Dashboard Shell + KPI Cards - Research

**Researched:** 2026-02-22
**Domain:** Next.js App Router (searchParams / Suspense), shadcn/ui (Tabs, Progress, Skeleton), KPI card UI patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **카드 표시 정보**: KPI명, 실적값, 목표값, 달성률(%) + 프로그레스 바 모두 포함
- **달성률 표시**: 숫자("85%")와 프로그레스 바를 함께 표시
- **기본 탭**: 페이지 진입 시 Daily 탭이 기본으로 선택됨
- **URL searchParams**: 탭 상태가 URL searchParams에 반영됨 (공유/북마크 가능)
- **델타 위치**: KPI 수치 바로 아래 서브텍스트로 표시
- **델타 형식**: 퍼센트 + 절대값 둘 다 표시 (예: "▲ 12% / ₩120만")
- **델타 색상**: 모든 KPI에서 오르면 녹색, 내리면 빨간색 (방향 무관하게 단순 증감 기준)
- **달성률 색상**: 80%+ 녹색, 60~80% 주황, 60% 미만 빨간 (ROADMAP 성공 기준에 명시됨 — 반드시 구현)
- **에러 상태**: API 실패 시 에러 카드 또는 모달로 사용자에게 안내

### Claude's Discretion

- 5개 KPI 카드 배치 순서 및 그리드 방식 (화면 너비에 맞게 반응형 그리드)
- Daily/Weekly 탭 UI 컴포넌트 선택 (shadcn Tabs 등)
- Daily 탭 기본 표시 데이터 범위 (가장 최근 날짜 단일 vs 현재 주 집계 등)
- 기간 비교 기준 정의 (Daily: 전일 vs 최신일, Weekly: 전주 vs 이번 주)
- 로딩 스켈레턴 모양 (카드 형태 맞춤 또는 일반 블록)
- Google Sheets 미연결 시 mock 데이터 표시 여부 안내 방식
- 에러 안내 시 유도할 행동 (재시도 버튼 등)

### Deferred Ideas (OUT OF SCOPE)

없음 — 논의가 Phase 2 범위 내에서 진행됨
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TAB-01 | 단일 페이지에서 Daily/Weekly 탭 전환이 가능하다 | shadcn Tabs 컴포넌트 설치 + `radix-ui` Tabs 프리미티브 (이미 설치됨) |
| TAB-02 | 탭 상태가 URL searchParams(?tab=daily\|weekly)에 저장되어 공유/북마크가 가능하다 | Next.js 16 Page searchParams (비동기 Promise) + Client Component useSearchParams + router.replace 패턴 |
| TAB-03 | 탭 전환 시 해당 시트의 최신 데이터를 서버에서 새로 가져온다 | searchParams 변경 시 Server Component 재실행 + `export const dynamic = 'force-dynamic'` + Suspense key 패턴 |
| KPI-01 | 매출, 손익, 이용건수, 가동률, 이용시간 총 5개 KPI 카드를 표시한다 | 기존 `DailyRecord` / `WeeklyRecord` 타입에서 5개 필드 직접 매핑 |
| KPI-02 | 각 KPI 카드에 목표 대비 달성률(%)을 숫자로 표시한다 | `WeeklyRecord.weeklyTarget` 존재, Daily는 목표 없음(CONTEXT.md 결정) — Daily 카드는 달성률 표시 생략 또는 월 합산 계산 필요 |
| KPI-03 | 각 KPI 카드에 목표 달성 프로그레스 바(0~100% 게이지)를 표시한다 | shadcn Progress 컴포넌트 설치 + `radix-ui` Progress 프리미티브 (이미 설치됨) |
| KPI-04 | 각 KPI 카드에 기간 비교 델타(이번 주 vs 지난 주 또는 이번 달 vs 지난 달 증감)를 표시한다 | `DailyRecord[]` / `WeeklyRecord[]` 배열에서 최신 2개 항목 비교 로직 |
| KPI-05 | 달성률에 따라 KPI 카드 색상이 조건부로 적용된다 (80%+ 녹색, 60~80% 주황, 60% 미만 빨간) | Tailwind CSS 조건부 클래스 (cn() 유틸리티 활용) |
| UX-01 | 데이터 로딩 중 스켈레턴 플레이스홀더를 표시한다 | shadcn Skeleton 컴포넌트 설치 + React Suspense fallback |
</phase_requirements>

---

## Summary

Phase 2는 Next.js App Router의 Server Component + `searchParams` 패턴, shadcn/ui Tabs/Progress/Skeleton 컴포넌트, 그리고 Tailwind CSS 조건부 클래스로 구현된다. 스택은 이미 프로젝트에 설치된 라이브러리(`radix-ui`, `shadcn`) 범위 내에서 완결되며 추가 외부 의존성이 거의 없다.

가장 중요한 아키텍처 결정은 탭 전환(TAB-02, TAB-03)이다. Next.js 16에서 Page 컴포넌트의 `searchParams`는 **Promise** 타입이므로 반드시 `await`해야 한다. 탭 전환 시 서버에서 데이터를 새로 가져오려면 `export const dynamic = 'force-dynamic'`을 Page에 추가하고, Suspense `key` prop에 searchParams 값을 바인딩하여 탭 전환마다 스켈레턴이 표시되게 해야 한다. 탭 UI 자체는 `"use client"` Client Component로 구현하여 `useRouter`와 `useSearchParams`로 URL을 업데이트한다.

KPI 달성률(KPI-02, KPI-05)에서 주의할 점은, `DailyRecord`에는 목표값이 없고 `WeeklyRecord`에만 `weeklyTarget`이 있다는 것이다(Phase 1 결정). Daily 탭의 KPI 카드는 목표 대비 달성률을 표시할 수 없으므로, "당일 실적" 중심의 카드로 설계하고 주간 목표 달성률은 Weekly 탭에서만 표시하는 방식이 권장된다.

**Primary recommendation:** shadcn Tabs + Progress + Skeleton 컴포넌트를 설치하고, Page Server Component에서 `await searchParams`로 탭을 읽어 서버에서 데이터를 분기하며, 탭 UI는 Client Component로 URL을 업데이트하는 구조를 사용한다.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui Tabs | 최신 (radix-ui 경유) | Daily/Weekly 탭 UI | 프로젝트 이미 shadcn 사용; radix-ui 패키지에 Tabs 포함 확인됨 |
| shadcn/ui Progress | 최신 (radix-ui 경유) | KPI 달성률 프로그레스 바 | 프로젝트 radix-ui에 Progress 포함 확인됨 |
| shadcn/ui Skeleton | 최신 | 로딩 플레이스홀더 | Tailwind 기반 pulse 애니메이션, shadcn 표준 |
| shadcn/ui Card | 이미 설치됨 | KPI 카드 컨테이너 | components/ui/card.tsx 이미 존재 |
| Next.js searchParams | 16.1.6 (async Promise) | URL 탭 상태 | Page 컴포넌트 표준 prop |
| React Suspense | React 19 | 데이터 로딩 중 스켈레턴 | App Router 공식 패턴 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.563.0 | KPI 카드 아이콘 | 이미 설치됨, TrendingUp/Activity 등 활용 |
| parseKoreanNumber | Phase 1 구현 | 포맷팅 재사용 | KPI 값 표시 시 export function 재활용 |
| cn() (lib/utils.ts) | 이미 설치됨 | 조건부 Tailwind 클래스 | 달성률에 따른 색상 조건부 적용 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Tabs | 커스텀 탭 버튼 | shadcn이 접근성(aria), 키보드 내비게이션 자동 제공; 커스텀은 이를 수동 구현해야 함 |
| shadcn Progress | 커스텀 div 게이지 | shadcn Progress는 radix-ui 기반으로 접근성 속성(`aria-valuenow`) 자동 처리 |
| Suspense + key | polling / useEffect | Server Component 패턴과 일치; CSR 복잡성 없음 |

**Installation:**

```bash
npx shadcn@latest add tabs
npx shadcn@latest add progress
npx shadcn@latest add skeleton
```

---

## Architecture Patterns

### Recommended Project Structure

```
app/(dashboard)/dashboard/
├── page.tsx              # Server Component: searchParams await, 데이터 페칭, Suspense
├── loading.tsx           # (선택) route-level 스켈레턴 (탭 전환 시 활용 불가 — Suspense key 사용 권장)
components/dashboard/
├── tab-nav.tsx           # "use client" — 탭 UI, router.replace로 URL 업데이트
├── kpi-cards.tsx         # Server Component — 데이터 수신, 카드 렌더
├── kpi-card.tsx          # 단일 KPI 카드 (달성률, 프로그레스 바, 델타)
├── kpi-cards-skeleton.tsx # 스켈레턴 플레이스홀더 (5개 카드 형태)
```

### Pattern 1: searchParams-driven Server Fetching (TAB-02, TAB-03)

**What:** Page Server Component가 `searchParams`를 읽어 탭에 맞는 데이터만 서버에서 가져온다.
**When to use:** URL 탭 상태를 서버 데이터 페칭에 연결할 때.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page
// app/(dashboard)/dashboard/page.tsx

import { Suspense } from 'react'
import { getTeamDashboardData } from '@/lib/data'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { KpiCardsSkeleton } from '@/components/dashboard/kpi-cards-skeleton'
import { TabNav } from '@/components/dashboard/tab-nav'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ tab?: string }>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  // Next.js 16: searchParams는 Promise — await 필수
  const { tab = 'daily' } = await searchParams
  const activeTab = tab === 'weekly' ? 'weekly' : 'daily'

  const data = await getTeamDashboardData()

  return (
    <div className="space-y-6">
      <TabNav activeTab={activeTab} />
      {/* key prop으로 탭 전환 시 Suspense 리셋 → 스켈레턴 재표시 */}
      <Suspense key={activeTab} fallback={<KpiCardsSkeleton />}>
        <KpiCards data={data} tab={activeTab} />
      </Suspense>
    </div>
  )
}
```

### Pattern 2: Client Component Tab Navigation (TAB-01, TAB-02)

**What:** 탭 버튼 클릭 시 `router.replace`로 URL searchParams를 업데이트한다. Page 재요청을 트리거하여 서버에서 데이터를 새로 가져온다.
**When to use:** 탭 UI는 인터랙티브하므로 Client Component로 구현해야 한다.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-search-params
// components/dashboard/tab-nav.tsx
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TabNavProps {
  activeTab: string
}

export function TabNav({ activeTab }: TabNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    // scroll: false — 탭 전환 시 스크롤 위치 유지
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="daily">일별</TabsTrigger>
        <TabsTrigger value="weekly">주차별</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

### Pattern 3: KPI 달성률 색상 조건부 적용 (KPI-05)

**What:** 달성률 값에 따라 카드 테두리/배지 색상을 조건부로 적용한다.
**When to use:** 80%+ 녹색, 60~80% 주황, 60% 미만 빨간색 규칙.

```typescript
// Source: 프로젝트 lib/utils.ts의 cn() 함수 활용
import { cn } from '@/lib/utils'

function getAchievementColor(rate: number): string {
  if (rate >= 80) return 'text-green-600 dark:text-green-400'
  if (rate >= 60) return 'text-orange-500 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function getProgressColor(rate: number): string {
  if (rate >= 80) return '[&>div]:bg-green-500'
  if (rate >= 60) return '[&>div]:bg-orange-400'
  return '[&>div]:bg-red-500'
}
```

### Pattern 4: KPI 계산 로직

**What:** `DailyRecord[]` / `WeeklyRecord[]` 배열에서 최신 항목과 직전 항목을 비교하여 델타를 계산한다.

```typescript
// Daily: 배열 마지막 항목 = 최신 일자, 마지막-1 = 전일
// Weekly: 배열 마지막 항목 = 이번 주, 마지막-1 = 지난 주

function calcDelta(current: number, previous: number) {
  if (previous === 0) return { percent: 0, absolute: 0 }
  const absolute = current - previous
  const percent = Math.round((absolute / Math.abs(previous)) * 100)
  return { percent, absolute }
}

// 달성률 계산 (Weekly만 weeklyTarget 존재)
function calcAchievementRate(actual: number, target: number): number {
  if (target === 0) return 0
  return Math.round((actual / target) * 100)
}
```

### Pattern 5: 스켈레턴 플레이스홀더 (UX-01)

**What:** Suspense fallback으로 KPI 카드 모양의 스켈레턴을 표시한다.

```typescript
// Source: https://ui.shadcn.com/docs/components/skeleton
// components/dashboard/kpi-cards-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function KpiCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **탭 상태를 useState로만 관리**: URL에 반영되지 않아 TAB-02 위반. 반드시 `router.replace`로 URL 업데이트.
- **Layout에서 searchParams 읽기**: Next.js App Router의 Layout은 `searchParams` prop을 받지 않음. 반드시 Page에서 읽어야 함.
- **searchParams를 동기적으로 접근**: Next.js 16에서는 `searchParams`가 Promise. `await` 없이 접근하면 타입 오류 또는 런타임 오류 발생.
- **Suspense key 없이 탭 전환**: `key` prop 없으면 Suspense가 재활성화되지 않아 탭 전환 시 스켈레턴이 표시되지 않음.
- **Daily 카드에 달성률 표시 시도**: `DailyRecord`에는 목표값 없음(Phase 1 결정). `weeklyTarget`은 `WeeklyRecord` 전용.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 탭 UI (접근성) | 커스텀 button 탭 | shadcn `Tabs` (radix-ui 기반) | aria-selected, 키보드 방향키 내비게이션 자동 처리 |
| 프로그레스 바 | 커스텀 div 게이지 | shadcn `Progress` (radix-ui 기반) | aria-valuenow/min/max 속성 자동 처리; 값 오버플로 처리 포함 |
| 스켈레턴 애니메이션 | 커스텀 CSS keyframes | shadcn `Skeleton` | Tailwind `animate-pulse` 기반, 다크모드 자동 대응 |
| URL searchParams 파싱 | 수동 문자열 파싱 | `URLSearchParams` Web API + Next.js `searchParams` prop | Next.js가 파싱 제공; 수동 파싱은 인코딩 이슈 발생 가능 |

**Key insight:** shadcn 컴포넌트는 Radix UI 프리미티브 기반으로 WAI-ARIA를 자동 처리한다. 커스텀 구현은 접근성 속성을 누락하기 쉽다. `radix-ui` 패키지에 Tabs, Progress 모두 이미 설치되어 있으므로 shadcn 설치 명령만 실행하면 UI 컴포넌트 파일이 생성된다.

---

## Common Pitfalls

### Pitfall 1: searchParams를 동기적으로 접근 (Next.js 15/16 변경사항)

**What goes wrong:** `searchParams.tab` 처럼 직접 프로퍼티 접근하면 타입 오류 또는 deprecated 경고 발생.
**Why it happens:** Next.js 15부터 `searchParams`가 Promise로 변경됨.
**How to avoid:** Page를 `async function`으로 선언하고 `const { tab } = await searchParams` 사용.
**Warning signs:** TypeScript에서 `searchParams.tab`에 빨간 밑줄, 또는 `Promise<...>`를 프로퍼티처럼 접근하는 경고.

### Pitfall 2: 탭 전환 시 스켈레턴이 다시 표시되지 않음

**What goes wrong:** Suspense boundary가 처음 한 번 해소된 후, 탭을 바꿔도 스켈레턴이 표시되지 않음.
**Why it happens:** React는 동일한 Suspense 인스턴스를 재사용함. `key` prop이 없으면 이전 콘텐츠를 그대로 보여줌.
**How to avoid:** `<Suspense key={activeTab} fallback={<KpiCardsSkeleton />}>` 처럼 `key`를 searchParams 값으로 설정.
**Warning signs:** 탭 전환 후 이전 탭 데이터가 잠깐 보이다가 바뀌는 플래시 현상.

### Pitfall 3: Daily 탭에서 달성률 계산 시도

**What goes wrong:** `DailyRecord`에는 `weeklyTarget`이 없어서 달성률을 계산할 수 없음.
**Why it happens:** Phase 1 결정 — "Daily 시트에는 목표 컬럼이 존재하지 않음".
**How to avoid:** Daily 탭 KPI 카드는 달성률/프로그레스 바를 표시하지 않거나, "Weekly 탭에서 확인"이라는 안내 텍스트 표시.
**Warning signs:** `record.weeklyTarget` 접근 시 TypeScript 오류 (DailyRecord에 해당 필드 없음).

### Pitfall 4: Layout에서 searchParams 읽으려 시도

**What goes wrong:** `app/(dashboard)/layout.tsx`에서 `searchParams`를 prop으로 받으려 해도 전달되지 않음.
**Why it happens:** App Router의 Layout은 searchParams를 받지 않는다 — 공식 문서 명시.
**How to avoid:** searchParams 읽기는 반드시 `page.tsx` 내에서만 수행. TabNav는 Server Component로부터 `activeTab` prop을 받거나, Client Component에서 `useSearchParams()` 훅 사용.
**Warning signs:** Layout의 searchParams가 항상 undefined.

### Pitfall 5: force-dynamic 미설정으로 탭 전환 시 캐시된 데이터 반환

**What goes wrong:** 탭을 바꿔도 서버에서 동일한 데이터가 반환됨.
**Why it happens:** Next.js 기본 캐싱이 페이지를 정적으로 캐시할 수 있음.
**How to avoid:** `export const dynamic = 'force-dynamic'` 추가 (STATE.md에도 Pending Todo로 기록됨).
**Warning signs:** 탭 전환 후 네트워크 탭에서 서버 요청이 발생하지 않음.

### Pitfall 6: 탭 전환 시 scroll 위치 변경

**What goes wrong:** 탭 전환 시 페이지가 맨 위로 스크롤됨.
**Why it happens:** `router.push()`는 기본적으로 맨 위로 스크롤함.
**How to avoid:** `router.replace(url, { scroll: false })` 사용.
**Warning signs:** 탭 클릭 후 화면이 위로 튐.

---

## Code Examples

Verified patterns from official sources:

### shadcn Tabs 기본 사용

```typescript
// Source: https://ui.shadcn.com/docs/components/tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="daily">
  <TabsList>
    <TabsTrigger value="daily">일별</TabsTrigger>
    <TabsTrigger value="weekly">주차별</TabsTrigger>
  </TabsList>
  <TabsContent value="daily">일별 콘텐츠</TabsContent>
  <TabsContent value="weekly">주차별 콘텐츠</TabsContent>
</Tabs>
```

### shadcn Progress 사용

```typescript
// Source: https://ui.shadcn.com/docs/components/progress
import { Progress } from "@/components/ui/progress"

<Progress value={85} className="h-2" />
```

### shadcn Skeleton 사용

```typescript
// Source: https://ui.shadcn.com/docs/components/skeleton
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-4 w-[100px]" />
```

### Next.js 16 searchParams (async Promise)

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab = 'daily' } = await searchParams
  // ...
}
```

### KPI 델타 포맷팅 (CONTEXT.md 결정)

```typescript
// "▲ 12% / ₩120만" 형식
function formatDelta(percent: number, absolute: number): string {
  const arrow = percent >= 0 ? '▲' : '▼'
  const sign = percent >= 0 ? '+' : ''
  const absWon = Math.abs(absolute)
  const wonStr = `₩${(absWon / 10000).toLocaleString()}만`
  return `${arrow} ${sign}${percent}% / ${wonStr}`
}

function getDeltaColor(percent: number): string {
  // 오르면 녹색, 내리면 빨간색 (방향 무관하게 단순 증감 기준 — CONTEXT.md)
  return percent >= 0
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'
}
```

### 금액 포맷팅 (CLAUDE.md 규칙 준수)

```typescript
// Source: CLAUDE.md — "₩${(amount / 10000).toLocaleString()}만 (만원 단위)"
function formatRevenue(amount: number): string {
  return `₩${(amount / 10000).toLocaleString()}만`
}

// 이용시간: "42시간"
function formatHours(hours: number): string {
  return `${hours.toLocaleString()}시간`
}

// 이용건수: "35건"
function formatCount(count: number): string {
  return `${count.toLocaleString()}건`
}

// 가동률: "78.9%"
function formatRate(rate: number): string {
  return `${rate.toFixed(1)}%`
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Page searchParams 동기 접근 | `await searchParams` (Promise) | Next.js 15.0 (2024) | Page 컴포넌트를 async로 선언해야 함 |
| `@radix-ui/react-tabs` 개별 패키지 | `radix-ui` 통합 패키지 | 2025 shadcn migration | 프로젝트 이미 `radix-ui` 설치됨; shadcn 설치 명령으로 UI 파일만 생성 |
| loading.js route-level skeleton | `<Suspense key={...}>` inline skeleton | App Router 도입 후 | searchParams 탭 전환에서는 loading.js가 재활성화되지 않음; Suspense key 필요 |

**Deprecated/outdated:**
- `searchParams`를 동기적으로 접근하는 패턴 (Next.js 14 이하): Next.js 15+에서 deprecated, 16에서도 호환을 위해 작동하나 향후 제거 예정.
- `@radix-ui/react-*` 개별 스코프 패키지: `radix-ui` 통합 패키지로 마이그레이션됨 (shadcn 2025-06 changelog).

---

## Open Questions

1. **Daily 탭 KPI 달성률 처리**
   - What we know: `DailyRecord`에는 목표값이 없음 (Phase 1 결정). `weeklyTarget`은 `WeeklyRecord` 전용.
   - What's unclear: Daily 탭의 KPI 카드에서 달성률/프로그레스 바를 표시할지, 생략할지.
   - Recommendation: Daily 탭 카드는 달성률 숫자와 프로그레스 바를 숨기고 실적값만 표시. Weekly 탭만 달성률 + 프로그레스 바 표시. 이 방식이 데이터 정확성을 보장하며 사용자에게 혼란을 주지 않음.

2. **Daily 탭의 "기간 비교 델타" 기준일**
   - What we know: CONTEXT.md에서 "Daily: 전일 vs 최신일"이 Claude의 재량으로 지정됨.
   - What's unclear: "최신일"이 배열의 마지막 날짜인지, 아니면 현재 날짜(오늘)인지.
   - Recommendation: `DailyRecord[]` 배열을 날짜 내림차순 정렬 후 `[0]`이 최신, `[1]`이 전일로 처리. 오늘 데이터가 없으면 마지막 가용 데이터를 최신으로 사용.

3. **5개 KPI 카드 그리드 배치 (Claude의 재량)**
   - What we know: 화면 너비에 맞게 반응형 그리드.
   - What's unclear: 5개를 어떻게 배치할지 (5열, 또는 3+2, 2+3).
   - Recommendation: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` — xl 이상에서 5열, 그 이하에서는 줄바꿈. 카드 순서: 매출 → 손익 → 이용건수 → 가동률 → 이용시간 (비즈니스 중요도 순).

---

## Sources

### Primary (HIGH confidence)

- Next.js 공식 문서 (v16.1.6) — `searchParams` async Promise 패턴, Page props: https://nextjs.org/docs/app/api-reference/file-conventions/page
- Next.js 공식 문서 (v16.1.6) — loading.js + Suspense 패턴: https://nextjs.org/docs/app/api-reference/file-conventions/loading
- shadcn/ui 공식 문서 — Tabs 컴포넌트: https://ui.shadcn.com/docs/components/tabs
- shadcn/ui 공식 문서 — Progress 컴포넌트: https://ui.shadcn.com/docs/components/progress
- shadcn/ui 공식 문서 — Skeleton 컴포넌트: https://ui.shadcn.com/docs/components/skeleton
- 프로젝트 직접 검증 — `radix-ui` 패키지에 `Tabs`, `Progress` 포함 확인 (node -e 명령으로 검증)
- 프로젝트 코드 — `types/dashboard.ts`, `lib/data.ts`, `lib/mock-data.ts` 직접 읽기

### Secondary (MEDIUM confidence)

- Next.js 공식 `useSearchParams` 문서 — useSearchParams 훅 + Suspense boundary 권장사항: https://nextjs.org/docs/app/api-reference/functions/use-search-params
- shadcn/ui changelog 2025-06 — radix-ui migration: https://ui.shadcn.com/docs/changelog/2025-06-radix-ui

### Tertiary (LOW confidence)

- Community: Suspense key 패턴으로 탭 전환 시 스켈레턴 재활성화 (GitHub Discussion #42346) — 공식 문서에 직접 명시되지 않으나 다수의 커뮤니티 소스에서 검증됨.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 프로젝트에 설치된 패키지를 직접 검증; shadcn 설치 명령 공식 문서 확인
- Architecture: HIGH — Next.js 16 공식 문서에서 searchParams async 패턴 직접 확인
- Pitfalls: HIGH — 공식 문서 + 프로젝트 Phase 1 결정(DailyRecord 목표값 없음) 기반

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (Next.js와 shadcn은 빠르게 변화하지만 핵심 패턴은 안정적)
