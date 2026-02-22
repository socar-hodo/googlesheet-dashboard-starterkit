# Phase 1: Data Layer Foundation - Research

**Researched:** 2026-02-22
**Domain:** TypeScript 타입 교체, Google Sheets 파서, Korean 숫자 파싱, mock 데이터 폴백
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**타입 구조**
- DailyRow, WeeklyRow를 완전히 분리된 독립 인터페이스로 정의 (공유 베이스 타입 없음)
- 목표(target) 데이터는 **WeeklyRow에만** 포함 — Daily 시트에는 목표 컬럼 없음
  - _(ROADMAP 수정 사항 반영: Phase 1 성공 기준 1번 "Daily 시트에서 목표 데이터 파싱"은 실제 시트 구조와 다름)_

**파서 견고성**
- 빈 셀 또는 누락 필드 → `0`으로 대체 (숫자 필드), `""` (문자열 필드)
- 한국어 숫자 형식 파싱 실패(콤마, 원화 기호 '₩', '%' 등 제거 후 변환 실패) → `null` 반환
- Google Sheets API 요청 자체 실패(네트워크 오류, 권한 오류 등) → 전체 데이터를 mock으로 폴백 (개별 시트 분기 없음)

**Mock 데이터 충실도**
- 실제 업무 패턴 반영: 일 매출 ~1,000만원 수준, 실제 손익/가동률 변동 포함
- 목표 초과/미달 케이스 모두 포함하여 UI 조건부 색상 테스트 가능하게

### Claude's Discretion

- 날짜/주차 필드의 TypeScript 타입 (string vs Date vs 구조체)
- 컬럼 헤더 식별 방식 (이름 매칭 vs 인덱스 고정)
- Sheets ID와 시트 이름을 환경변수/하드코딩 중 어디에 둘지
- Mock 데이터 기간 범위

### Deferred Ideas (OUT OF SCOPE)

없음 — 논의가 Phase 1 범위 내에서 진행됨

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Google Sheets Daily 시트에서 일자별 매출, 손익, 이용시간, 이용건수, 가동률을 파싱한다 (목표 컬럼은 CONTEXT 수정에 따라 Weekly 전용) | parseDailySheet() 설계, 헤더 이름 매칭 패턴, open-ended range |
| DATA-02 | Google Sheets Weekly 시트에서 주차별 매출, 손익, 이용시간, 이용건수, 가동률, 목표를 파싱한다 | parseWeeklySheet() 설계, 주차 필드 string 타입 권고 |
| DATA-03 | 한국어 숫자 포맷("1,234,567", "₩1,234,567")을 NaN 없이 안전하게 Number로 변환한다 | parseKoreanNumber() 유틸리티 설계, null 반환 전략 |
| DATA-04 | Google Sheets 미연결 또는 API 실패 시 mock 데이터로 폴백하여 페이지가 정상 렌더링된다 | getTeamDashboardData() 에러 핸들링 패턴, 전체 폴백 전략 |
| DATA-05 | 기존 범용 타입(KpiData, MonthlyRevenue, CategoryDistribution, RecentOrder)을 팀 전용 타입(DailyRecord, WeeklyRecord, TeamDashboardData)으로 완전 교체한다 | 타입 마이그레이션 순서, 파괴적 교체 전략 |
| UX-02 | 페이지 접속 및 새로고침 시 Google Sheets에서 최신 데이터를 가져온다 | Server Component 패턴, no-store cache 설정 |

</phase_requirements>

---

## Summary

Phase 1은 UI가 없는 순수 데이터 레이어 작업이다. 세 개 파일(`types/dashboard.ts`, `lib/mock-data.ts`, `lib/data.ts`)을 교체하고, `lib/sheets.ts`는 건드리지 않는다. 결과적으로 `getDashboardData()` 또는 새로운 함수 이름으로 `TeamDashboardData`를 반환하는 단일 진입점이 존재하고, 기존 `dashboard/page.tsx`가 타입 오류를 발생시키더라도 그것은 Phase 2에서 수정하는 것이 자연스럽다.

**핵심 발견 1:** CONTEXT.md에 목표(target) 데이터가 WeeklyRecord에만 있다고 명시되어 있으므로, DailyRecord에는 `monthlyTarget` 필드가 없다. ARCHITECTURE 연구 문서의 기존 타입 설계(`DailyRecord`에 `monthlyTarget` 포함)는 이 수정을 반영하지 않았으므로 이 RESEARCH.md의 정의가 우선한다.

**핵심 발견 2:** 현재 `lib/sheets.ts`의 `fetchSheetData()`는 `valueRenderOption`을 명시하지 않아 Google Sheets API 기본값인 `FORMATTED_VALUE`(한국어 콤마/₩ 포함)를 반환한다. 이것이 Korean 숫자 파싱 문제의 근원이다. 두 가지 해결책이 있으며 이 연구에서 권고 전략을 확정한다.

**핵심 발견 3:** `lib/sheets.ts`는 이 Phase에서 변경하지 않는다. 파서 레이어에서 한국어 포맷 문자열을 정규화하는 `parseKoreanNumber()` 유틸리티를 추가하는 방식으로 해결한다. 이는 `lib/sheets.ts`의 단순한 인터페이스를 유지하면서 데이터 정규화를 `lib/data.ts`에 집중시킨다.

**Primary recommendation:** `types/dashboard.ts` → `lib/mock-data.ts` → `lib/data.ts` 순서로 교체. 각 단계가 다음 단계의 전제 조건이다.

---

## Standard Stack

### Core (변경 없음 — 이미 설치됨)

| Library | Version | Purpose | Phase 1 사용 |
|---------|---------|---------|--------------|
| `googleapis` | 171.4.0 | Google Sheets API v4 클라이언트 | `lib/sheets.ts`를 통해 간접 사용 (이 Phase에서 직접 수정 없음) |
| TypeScript | ^5 | 인터페이스 정의, 타입 안전성 | `types/dashboard.ts` 완전 재작성 |
| Next.js | 16.1.6 | Server Component, `cache: 'no-store'` | UX-02 (최신 데이터 보장) |

### Phase 1에서 추가하는 것

새 npm 패키지 없음. 순수 TypeScript 코드만 작성한다.

---

## Architecture Patterns

### Phase 1 파일 범위 (명확한 경계)

```
변경 필요:
  types/dashboard.ts      → 완전 재작성 (새 팀 전용 타입)
  lib/mock-data.ts        → 완전 재작성 (새 타입에 맞는 mock 데이터)
  lib/data.ts             → 완전 재작성 (새 파서 + getTeamDashboardData)

변경 없음:
  lib/sheets.ts           → 그대로 유지 (fetchSheetData API 변경 없음)
  lib/utils.ts            → 그대로 유지
  app/(dashboard)/dashboard/page.tsx → Phase 1 완료 후 타입 오류 발생 (Phase 2에서 수정)
  components/dashboard/*  → Phase 2-5에서 수정
```

### Pattern 1: 새 타입 정의 (types/dashboard.ts 전체 교체)

**What:** 기존 범용 타입(`KpiData`, `MonthlyRevenue`, `CategoryDistribution`, `RecentOrder`, `DashboardData`)을 전부 삭제하고 팀 전용 타입으로 교체.

**CONTEXT.md 결정 반영:**
- `DailyRecord`와 `WeeklyRecord`는 공유 베이스 없이 완전히 독립
- 목표(target)는 `WeeklyRecord`에만 존재 (Daily 시트에는 목표 컬럼이 없음)
- 날짜 필드 타입: `string` 권고 (Claude's Discretion — 이유: 시트에서 파싱된 날짜를 Date 객체로 변환해도 Phase 2의 KPI 계산 외에 사용처가 없음. `string`으로 유지하면 `sheets.ts`의 `string[][]` 반환값과 직접 호환되고 직렬화 안전)

```typescript
// types/dashboard.ts — 이 Phase에서 작성할 최종 내용
// Source: CONTEXT.md 결정 + PROJECT.md 시트 구조

/** Daily 시트 한 행 — 일자별 기록 */
export interface DailyRecord {
  date: string;             // "2026-02-21" 또는 시트 형식 그대로 (YYYY-MM-DD 권고)
  revenue: number;          // 매출 (원)
  profit: number;           // 손익 (원, 음수 가능)
  usageHours: number;       // 이용시간 (시간)
  usageCount: number;       // 이용건수
  utilizationRate: number;  // 가동률 (%, 0-100)
  // monthlyTarget 없음 — CONTEXT.md: "목표 데이터는 WeeklyRow에만 포함"
}

/** Weekly 시트 한 행 — 주차별 기록 */
export interface WeeklyRecord {
  week: string;             // 시트 형식 그대로 (예: "1주차", "2월 3주차" 등)
  revenue: number;          // 매출 (원)
  profit: number;           // 손익 (원, 음수 가능)
  usageHours: number;       // 이용시간 (시간)
  usageCount: number;       // 이용건수
  utilizationRate: number;  // 가동률 (%, 0-100)
  weeklyTarget: number;     // 주차 목표 (원) — Weekly 전용
}

/** 대시보드 전체 데이터 (탭 공통 컨테이너) */
export interface TeamDashboardData {
  daily: DailyRecord[];
  weekly: WeeklyRecord[];
  fetchedAt: string;        // ISO 8601 타임스탬프 — UX-03용 (Phase 4에서 표시)
}
```

**Anti-pattern 회피:** 기존 타입을 `@deprecated`로 표시하거나 병렬 유지하지 말 것. 한 번에 전부 삭제. TypeScript 빌드 에러가 마이그레이션 가이드 역할을 한다.

### Pattern 2: 헤더 이름 기반 컬럼 매핑 (Claude's Discretion 결정)

**결정:** 컬럼 식별 방식으로 **헤더 이름 매칭**을 선택한다. 인덱스 고정 방식은 사용하지 않는다.

**근거:** `PITFALLS.md` Pitfall 1: "Column-Index Parsing Breaks Silently When Sheet Structure Changes" — 팀원이 Google Sheet 컬럼 순서를 변경하면 인덱스 고정 방식은 잘못된 필드에 값을 매핑한다. 헤더 이름 매칭은 순서 변경에 강건하다.

```typescript
// lib/data.ts — 헤더 이름 매칭 패턴
// Source: PITFALLS.md Pitfall 1 권고사항

const DAILY_HEADERS = {
  date: "일자",
  revenue: "매출",
  profit: "손익",
  usageHours: "이용시간",
  usageCount: "이용건수",
  utilizationRate: "가동률",
} as const;

const WEEKLY_HEADERS = {
  week: "주차",
  revenue: "매출",
  profit: "손익",
  usageHours: "이용시간",
  usageCount: "이용건수",
  utilizationRate: "가동률",
  weeklyTarget: "목표",  // 또는 "주차목표" — 실제 시트 컬럼명에 맞게 조정
} as const;

/** 헤더 행에서 컬럼 이름 → 인덱스 매핑 생성 */
function buildColumnIndex(headers: string[]): Map<string, number> {
  return new Map(headers.map((h, i) => [h.trim(), i]));
}
```

### Pattern 3: Korean 숫자 파싱 유틸리티 (DATA-03 핵심)

**문제 근원:** `lib/sheets.ts`의 `fetchSheetData()`는 `valueRenderOption`을 지정하지 않아 Google Sheets API 기본값 `FORMATTED_VALUE`를 사용한다. 한국어 로케일 시트는 숫자를 `"1,234,567"`, `"₩1,234,567"`, `"85.3%"` 형식으로 반환한다. `Number("1,234,567")` = `NaN`.

**결정:** `lib/sheets.ts`를 수정하지 않고, `lib/data.ts`에 `parseKoreanNumber()` 유틸리티를 추가한다. 이 방식이 격리가 명확하고 `sheets.ts`의 안정성을 유지한다.

**CONTEXT.md 결정:** 파싱 실패 시 `null` 반환 (빈 셀/누락 필드는 `0`으로 대체, 포맷 제거 후 변환 실패시만 `null`).

```typescript
// lib/data.ts — parseKoreanNumber 구현
// Source: CONTEXT.md "파서 견고성" + PITFALLS.md Pitfall 3

/**
 * 한국어 숫자 포맷 문자열을 Number로 변환한다.
 *
 * 처리 순서:
 * 1. 빈 문자열, undefined, null → 0 반환
 * 2. 공백 제거
 * 3. ₩ 기호 제거
 * 4. % 기호 제거
 * 5. 콤마(,) 제거
 * 6. Number() 변환 시도
 * 7. NaN이면 null 반환 (CONTEXT.md 결정)
 *
 * @returns number (성공) | null (파싱 불가 비정상 값)
 */
function parseKoreanNumber(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return 0;

  const cleaned = value
    .trim()
    .replace(/₩/g, "")
    .replace(/%/g, "")
    .replace(/,/g, "");

  const parsed = Number(cleaned);
  if (isNaN(parsed)) {
    console.warn(`[parseKoreanNumber] 파싱 실패: "${value}"`);
    return null;
  }
  return parsed;
}

/** 숫자 파싱 결과가 null이면 fallback(기본 0)으로 대체 */
function safeNumber(value: string | undefined | null, fallback = 0): number {
  return parseKoreanNumber(value) ?? fallback;
}
```

### Pattern 4: Daily/Weekly 파서

```typescript
// lib/data.ts — parseDailySheet 예시
// Source: PITFALLS.md Pitfall 1(헤더 이름 매칭) + Pitfall 6(open-ended range)

function parseDailySheet(rows: string[][]): DailyRecord[] {
  if (rows.length < 2) return [];  // 헤더만 있거나 비어있는 경우

  const colIndex = buildColumnIndex(rows[0]);

  // 헤더 검증 — 필수 컬럼 누락 시 경고 (PITFALLS.md Pitfall 1)
  for (const [field, headerName] of Object.entries(DAILY_HEADERS)) {
    if (!colIndex.has(headerName)) {
      console.warn(`[parseDailySheet] 컬럼 누락: "${headerName}" (field: ${field})`);
    }
  }

  return rows.slice(1)
    .filter(row => row.some(cell => cell !== ""))  // 빈 행 스킵
    .map(row => {
      const get = (header: string) => row[colIndex.get(header) ?? -1];
      return {
        date: get(DAILY_HEADERS.date)?.trim() ?? "",
        revenue: safeNumber(get(DAILY_HEADERS.revenue)),
        profit: safeNumber(get(DAILY_HEADERS.profit)),
        usageHours: safeNumber(get(DAILY_HEADERS.usageHours)),
        usageCount: safeNumber(get(DAILY_HEADERS.usageCount)),
        utilizationRate: safeNumber(get(DAILY_HEADERS.utilizationRate)),
      };
    });
}
```

### Pattern 5: 통합 데이터 페칭 함수 (UX-02 + DATA-04)

**UX-02 (최신 데이터 보장):** Next.js 16 App Router에서 Server Component는 기본적으로 요청별로 실행된다. `cache: 'no-store'`를 fetch 옵션에 지정하거나 `export const dynamic = 'force-dynamic'`을 page.tsx에 추가하면 캐싱 없이 항상 최신 데이터를 반환한다. `googleapis` SDK는 내부적으로 Node.js `https`를 사용하므로 Next.js의 fetch 캐싱이 적용되지 않는다 — googleapis 호출은 기본적으로 매 요청마다 새로 실행된다.

**DATA-04 폴백 전략 (CONTEXT.md 결정):** Google Sheets API 요청 실패 시 전체 데이터를 mock으로 폴백 (개별 시트 분기 없음). 기존 `lib/data.ts`의 per-sheet 독립 폴백 패턴을 제거한다.

```typescript
// lib/data.ts — getTeamDashboardData
// Source: CONTEXT.md + ARCHITECTURE.md Pattern 2

export async function getTeamDashboardData(): Promise<TeamDashboardData> {
  if (!isGoogleSheetsConfigured()) {
    return mockTeamDashboardData;
  }

  try {
    // open-ended range 사용 — PITFALLS.md Pitfall 6 참조
    // 시트 이름은 실제 Google Sheets 탭 이름에 맞게 설정
    const [dailyRows, weeklyRows] = await Promise.all([
      fetchSheetData("일별!A:F"),    // 실제 탭 이름 확인 필요 (Claude's Discretion)
      fetchSheetData("주차별!A:G"),  // 실제 탭 이름 확인 필요
    ]);

    return {
      daily: dailyRows ? parseDailySheet(dailyRows) : mockTeamDashboardData.daily,
      weekly: weeklyRows ? parseWeeklySheet(weeklyRows) : mockTeamDashboardData.weekly,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    // CONTEXT.md: API 실패 시 전체 mock 폴백 (개별 시트 분기 없음)
    console.error("Google Sheets 데이터 가져오기 실패, mock으로 폴백:", error);
    return { ...mockTeamDashboardData, fetchedAt: new Date().toISOString() };
  }
}
```

### Pattern 6: Mock 데이터 설계 (DATA-04 + CONTEXT.md 충실도 요건)

**CONTEXT.md 결정:**
- 일 매출 ~1,000만원 수준 (1,000만 = 10,000,000원)
- 목표 초과/미달 케이스 모두 포함 → Phase 2 KPI 카드의 색상 조건 테스트 가능
- 기간 범위: **Claude's Discretion** → 4주(Daily) + 8주(Weekly) 권고

**권고 기간 범위 근거:**
- Daily: 최근 4주(약 28일) — KPI 계산(이번 주 vs 지난 주)에 충분, 너무 많지 않아 코드가 간결
- Weekly: 최근 8주차 — 기간 비교(이번 달 vs 지난 달)에 충분

```typescript
// lib/mock-data.ts — 구조 예시 (실제 데이터는 Task에서 완성)
export const mockDailyRecords: DailyRecord[] = [
  // ~28개 행, 일 매출 800만~1,200만 범위로 변동
  // 가동률 55~92% (목표 80% 기준으로 초과/미달 혼재)
  // 손익 -50만~+200만 (일부 음수 포함)
  { date: "2026-01-26", revenue: 10200000, profit: 1500000, usageHours: 48, usageCount: 32, utilizationRate: 85.3 },
  { date: "2026-01-27", revenue: 8500000, profit: -300000, usageHours: 38, usageCount: 25, utilizationRate: 63.3 },
  // ...
];

export const mockWeeklyRecords: WeeklyRecord[] = [
  // ~8개 행, 주 매출 5,000만~7,000만 범위
  // weeklyTarget 포함 — 초과/미달 혼재
  { week: "1주차", revenue: 52000000, profit: 6000000, usageHours: 280, usageCount: 185, utilizationRate: 78.2, weeklyTarget: 60000000 },
  { week: "2주차", revenue: 63000000, profit: 9500000, usageHours: 310, usageCount: 210, utilizationRate: 88.6, weeklyTarget: 60000000 },
  // ...
];

export const mockTeamDashboardData: TeamDashboardData = {
  daily: mockDailyRecords,
  weekly: mockWeeklyRecords,
  fetchedAt: "2026-02-22T00:00:00.000Z",
};
```

### Anti-Patterns to Avoid

- **인덱스 고정 파싱:** `row[0]`, `row[1]` 방식 — 컬럼 순서 변경 시 잘못된 값 매핑. 헤더 이름 매칭 사용.
- **`Number()` 직접 사용:** `Number("1,234,567")` = `NaN`. `parseKoreanNumber()` 경유.
- **고정 행 범위:** `"일별!A1:F30"` — 데이터 성장 시 누락. `"일별!A:F"` 사용.
- **기존 타입 병렬 유지:** `KpiData` deprecated 처리. 전부 삭제, TypeScript 에러로 마이그레이션 가이드.
- **per-sheet 독립 폴백:** CONTEXT.md 결정: API 실패 시 전체 mock (기존 코드의 per-sheet 폴백 패턴 제거).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 한국어 숫자 정규화 | 복잡한 정규식 라이브러리 | `parseKoreanNumber()` 유틸리티 (5-10줄) | 케이스가 한정적: ₩, %, , 세 가지만 처리하면 됨 |
| Google Sheets 인증 | JWT 수동 구현 | `lib/sheets.ts` 그대로 (googleapis JWT 클라이언트) | 이미 작동 중. 변경 불필요 |
| 헤더-인덱스 매핑 | 복잡한 스키마 라이브러리 | `buildColumnIndex()` Map (3줄) | 단순한 Map으로 충분 |
| 날짜 파싱/변환 | `date-fns`, `dayjs` | `string` 타입 유지 | Phase 1에서 날짜 연산 없음. Phase 2 KPI 계산 시 결정 |

**Key insight:** Phase 1의 모든 문제는 5-15줄 이내의 유틸리티 함수로 해결 가능하다. 외부 라이브러리 추가는 Phase 1에서 불필요하다.

---

## Common Pitfalls

### Pitfall 1: target 데이터 위치 오해
**What goes wrong:** ROADMAP Success Criteria 1번에 "Daily 시트에서 목표 데이터 파싱"이라고 적혀 있지만 CONTEXT.md가 이를 수정했다. DailyRecord에 `monthlyTarget` 필드를 추가하면 실제 시트와 맞지 않아 항상 `0` 또는 파싱 오류가 발생한다.
**How to avoid:** `DailyRecord`에는 `monthlyTarget` 없음. `weeklyTarget`은 `WeeklyRecord`에만.
**Warning signs:** Daily 파서에서 목표 컬럼 누락 경고가 로그에 뜸.

### Pitfall 2: 시트 탭 이름 가정
**What goes wrong:** "일별", "주차별" 탭 이름을 하드코딩했지만 실제 Google Sheets 탭 이름이 다를 수 있다 ("daily", "Daily", "일일" 등).
**How to avoid:** 환경변수(`GOOGLE_DAILY_SHEET_NAME`, `GOOGLE_WEEKLY_SHEET_NAME`) 또는 상수로 분리. 실제 시트 이름을 확인 후 결정.
**Warning signs:** `fetchSheetData()` 반환값이 `null`이고 환경변수는 올바르게 설정됨.

### Pitfall 3: 빈 행 처리 누락
**What goes wrong:** Google Sheets API는 중간 빈 셀을 `""` 또는 `undefined`로 반환한다. 파서가 빈 행을 필터링하지 않으면 `{ date: "", revenue: 0, ... }` 같은 더미 레코드가 포함된다.
**How to avoid:** `rows.slice(1).filter(row => row.some(cell => cell !== ""))` 로 빈 행 제거.
**Warning signs:** Mock 데이터와 달리 실제 데이터에서 날짜가 빈 레코드가 배열 끝에 포함됨.

### Pitfall 4: `lib/sheets.ts` 수정 충동
**What goes wrong:** `valueRenderOption: "UNFORMATTED_VALUE"` 를 추가하면 반환 타입이 `any[][]`로 변경되어 `string[][]` 타입 계약이 깨진다. 기존 파서도 영향받는다.
**How to avoid:** `lib/sheets.ts`는 이 Phase에서 변경 금지. `parseKoreanNumber()`로 파서 레이어에서 처리.
**Warning signs:** `lib/sheets.ts` 변경으로 `fetchSheetData` 반환 타입 불일치 TypeScript 에러 다수 발생.

### Pitfall 5: 타입 마이그레이션 순서 오류
**What goes wrong:** `lib/data.ts`를 먼저 수정하면 아직 존재하는 구 타입들과의 충돌로 TypeScript 에러가 수백 개 발생하고 빌드가 완전히 깨진다.
**How to avoid:** 반드시 **types → mock-data → data.ts** 순서로 교체. page.tsx의 타입 에러는 Phase 2에서 수정하는 것이 정상이다.
**Warning signs:** `lib/data.ts` 수정 중 `KpiData not found` 에러가 아니라 예상치 못한 에러들.

---

## Code Examples

### 컬럼 인덱스 빌더

```typescript
// Source: PITFALLS.md Pitfall 1 권고 패턴
function buildColumnIndex(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((h, i) => {
    if (h.trim()) map.set(h.trim(), i);
  });
  return map;
}
```

### 헤더 검증 패턴

```typescript
// Source: PITFALLS.md Pitfall 1 권고 패턴
function validateHeaders(
  colIndex: Map<string, number>,
  requiredHeaders: readonly string[],
  sheetName: string
): void {
  for (const header of requiredHeaders) {
    if (!colIndex.has(header)) {
      console.warn(`[${sheetName}] 필수 컬럼 누락: "${header}"`);
    }
  }
}
```

### 전체 폴백 에러 핸들링

```typescript
// Source: CONTEXT.md "파서 견고성" 결정
// API 실패 시 개별 시트가 아닌 전체 mock 반환
try {
  // ... fetchSheetData 호출들
} catch (error) {
  console.error("Sheets API 실패, 전체 mock 폴백:", error);
  return { ...mockTeamDashboardData, fetchedAt: new Date().toISOString() };
}
```

### 가동률(%) 파싱 주의

```typescript
// 가동률이 시트에서 "85.3%" 형식이면 % 제거 후 파싱
// 가동률이 "0.853" (소수) 형식이면 * 100 필요
// → 실제 시트에서 형식 확인 후 파서에 반영
const utilizationRate = safeNumber(get(DAILY_HEADERS.utilizationRate));
// % 기호가 있으면 parseKoreanNumber가 이미 제거함
// 0-1 범위면 * 100 필요 (실제 시트 확인 필요)
```

---

## State of the Art

| Old Approach (현재 lib/data.ts) | New Approach (Phase 1 이후) | 이유 |
|--------------------------------|---------------------------|------|
| `Number(row[1] ?? 0)` 직접 변환 | `parseKoreanNumber()` → `safeNumber()` | 한국어 포맷 문자열 NaN 방지 |
| 컬럼 인덱스 고정 (`row[0]`, `row[1]`) | 헤더 이름 매칭 (`buildColumnIndex`) | 시트 구조 변경에 강건 |
| Per-sheet 독립 폴백 | 전체 mock 폴백 (CONTEXT.md 결정) | 단순화, 일관된 fallback 상태 |
| 고정 범위 (`"KPI!A1:B5"`) | Open-ended 범위 (`"일별!A:F"`) | 데이터 성장에도 누락 없음 |
| 범용 예시 타입 (`KpiData`, etc.) | 팀 전용 타입 (`DailyRecord`, `WeeklyRecord`) | 실제 시트 구조와 1:1 대응 |
| mock 데이터: 전자제품/의류 e-커머스 | mock 데이터: 일 매출 ~1,000만, 가동률 변동 | 팀 실무 패턴 반영 |

---

## Open Questions

1. **Google Sheets 탭 이름 (열린 질문)**
   - What we know: PROJECT.md에 "daily 시트", "weekly 시트"로 언급
   - What's unclear: 실제 Google Sheets 탭 이름이 한국어인지 영어인지 (예: "일별" vs "daily" vs "Daily")
   - Recommendation: `GOOGLE_DAILY_SHEET_NAME` 환경변수로 설정 가능하게 하거나, 플래너가 상수로 정의하고 Task에서 실제 시트명 확인 지시 추가. 환경변수 방식이 코드 변경 없이 시트 이름 조정 가능하여 권고.

2. **가동률(%) 시트 포맷 (열린 질문)**
   - What we know: 가동률은 0-100% 범위
   - What's unclear: 시트에서 `"85.3%"` (포맷 문자열) 인지 `"0.853"` (소수) 인지 `"85.3"` (숫자 문자열) 인지
   - Recommendation: `parseKoreanNumber()`가 `%` 기호를 제거하므로 `"85.3%"` → `85.3` (올바름). `"0.853"` 형식이면 파서에서 `* 100` 추가 필요. Task에서 실제 시트 셀 포맷 확인 지시 포함.

3. **주차(week) 필드 형식 (열린 질문)**
   - What we know: WeeklyRecord의 `week: string` 타입으로 결정
   - What's unclear: 시트에서 "1주차", "2월 3주차", "W5" 중 어떤 형식 사용
   - Recommendation: `string` 타입이므로 형식과 무관하게 파싱 가능. Phase 2 KPI 계산에서 주차 비교가 필요할 때 재평가. 이 Phase에서는 그대로 문자열로 저장.

---

## Sources

### Primary (HIGH confidence)

- `types/dashboard.ts` — 교체 대상 기존 타입 4개 직접 확인
- `lib/data.ts` — 기존 파서 패턴 (`Number()` 직접 변환, 인덱스 고정) 직접 확인
- `lib/sheets.ts` — `fetchSheetData()` 반환 타입 `string[][]`, `valueRenderOption` 미지정 확인
- `lib/mock-data.ts` — 교체 대상 기존 mock 데이터 (e-커머스 테마) 직접 확인
- `.planning/phases/01-data-layer-foundation/01-CONTEXT.md` — 모든 구현 결정의 1차 소스
- `.planning/REQUIREMENTS.md` — DATA-01~05, UX-02 요건 전체
- `.planning/PROJECT.md` — 시트 구조: `daily(일자|매출|손익|이용시간|이용건수|가동률|매월목표)`, `weekly(주차|매출|손익|이용시간|이용건수|가동률)`

### Secondary (MEDIUM confidence)

- `.planning/research/ARCHITECTURE.md` — 데이터 레이어 3티어 패턴, 타입 마이그레이션 순서
- `.planning/research/PITFALLS.md` — Pitfall 1(헤더 이름 매칭), Pitfall 3(Korean 숫자), Pitfall 6(open-ended range)
- `.planning/research/STACK.md` — 새 npm 패키지 불필요 확인
- `.planning/codebase/CONCERNS.md` — 기존 tech debt 항목 (`Number()` 암묵적 변환, 고정 범위)

### Tertiary (LOW confidence — 실제 시트 연결 시 검증 필요)

- 가동률 시트 포맷 (`%` 포맷 문자열 vs 소수): 실제 시트 연결 전까지 불확실
- 시트 탭 이름: 실제 Google Sheets 확인 필요

---

## Metadata

**Confidence breakdown:**
- 타입 구조 (DailyRecord, WeeklyRecord): HIGH — CONTEXT.md 결정 + PROJECT.md 시트 구조 직접 확인
- 파서 패턴 (헤더 이름 매칭, open-ended range): HIGH — PITFALLS.md + 기존 코드 직접 분석
- Korean 숫자 파싱 전략: HIGH — 기존 코드 NaN 문제 직접 확인 + CONTEXT.md 결정 (null 반환)
- Mock 데이터 내용: MEDIUM — 업무 패턴은 PROJECT.md 기반이나 구체적 수치는 추정
- 시트 탭 이름 / 가동률 포맷: LOW — 실제 Google Sheets 확인 전까지 불확실

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30일, 안정적 스택)
