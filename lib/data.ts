// 경남울산사업팀 매출 대시보드 — 데이터 페칭 및 파싱 레이어
import type { DailyRecord, WeeklyRecord, TeamDashboardData } from "@/types/dashboard";
import { fetchSheetData, isGoogleSheetsConfigured } from "./sheets";
import { mockTeamDashboardData } from "./mock-data";

// 실제 Google Sheets 탭 이름 — 환경변수로 재정의 가능 (PITFALLS.md Pitfall 2 대응)
const DAILY_SHEET = process.env.GOOGLE_DAILY_SHEET_NAME ?? "일별";
const WEEKLY_SHEET = process.env.GOOGLE_WEEKLY_SHEET_NAME ?? "주차별";

// 헤더 이름 상수 (RESEARCH.md Pattern 2 — 인덱스 고정 방식 사용 금지)
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
  weeklyTarget: "목표",
} as const;

// --- 유틸리티 함수 ---

/** 헤더 배열을 받아 헤더명 → 인덱스 Map을 반환한다. 빈 헤더 셀은 추가하지 않는다. */
function buildColumnIndex(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((header, index) => {
    const trimmed = header.trim();
    if (trimmed !== "") {
      map.set(trimmed, index);
    }
  });
  return map;
}

/**
 * 한국어 숫자 문자열을 파싱하여 숫자로 변환한다. (DATA-03 핵심)
 * - undefined, null, 빈 문자열 → 0 반환
 * - ₩ 기호, % 기호, 콤마(,) 제거 후 Number() 변환
 * - 변환 결과가 NaN이면 console.warn 후 null 반환
 */
export function parseKoreanNumber(value: string | null | undefined): number | null {
  // 빈 값 처리
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  // 전처리: 공백 제거 → ₩ 제거 → % 제거 → 콤마 제거
  const cleaned = value
    .trim()
    .replace(/₩/g, "")
    .replace(/%/g, "")
    .replace(/,/g, "");

  const result = Number(cleaned);

  if (Number.isNaN(result)) {
    console.warn(`[parseKoreanNumber] 변환 불가 값: "${value}"`);
    return null;
  }

  return result;
}

/** parseKoreanNumber 결과가 null이면 fallback(기본 0)을 반환한다. */
function safeNumber(value: string | null | undefined, fallback: number = 0): number {
  const parsed = parseKoreanNumber(value);
  return parsed === null ? fallback : parsed;
}

// --- 시트 파서 ---

/**
 * Daily 시트 raw 데이터를 DailyRecord 배열로 파싱한다. (DATA-01)
 * 헤더 이름 기반 컬럼 매핑을 사용하여 시트 구조 변경에 강건하다.
 */
function parseDailySheet(rows: string[][]): DailyRecord[] {
  if (rows.length < 2) return [];

  const colIndex = buildColumnIndex(rows[0]);

  // 필수 헤더가 없으면 경고
  for (const [, headerName] of Object.entries(DAILY_HEADERS)) {
    if (!colIndex.has(headerName)) {
      console.warn(`[parseDailySheet] 헤더를 찾을 수 없음: "${headerName}"`);
    }
  }

  const getCell = (row: string[], headerName: string): string | undefined => {
    const idx = colIndex.get(headerName);
    return idx !== undefined ? row[idx] : undefined;
  };

  // 빈 행(모든 셀이 빈 문자열) 필터링 후 파싱
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row): DailyRecord => ({
      date: (getCell(row, DAILY_HEADERS.date) ?? "").trim(),
      revenue: safeNumber(getCell(row, DAILY_HEADERS.revenue)),
      profit: safeNumber(getCell(row, DAILY_HEADERS.profit)),
      usageHours: safeNumber(getCell(row, DAILY_HEADERS.usageHours)),
      usageCount: safeNumber(getCell(row, DAILY_HEADERS.usageCount)),
      utilizationRate: safeNumber(getCell(row, DAILY_HEADERS.utilizationRate)),
    }));
}

/**
 * Weekly 시트 raw 데이터를 WeeklyRecord 배열로 파싱한다. (DATA-02)
 * weeklyTarget 필드를 포함하여 WeeklyRecord 객체를 생성한다.
 */
function parseWeeklySheet(rows: string[][]): WeeklyRecord[] {
  if (rows.length < 2) return [];

  const colIndex = buildColumnIndex(rows[0]);

  // 필수 헤더가 없으면 경고
  for (const [, headerName] of Object.entries(WEEKLY_HEADERS)) {
    if (!colIndex.has(headerName)) {
      console.warn(`[parseWeeklySheet] 헤더를 찾을 수 없음: "${headerName}"`);
    }
  }

  const getCell = (row: string[], headerName: string): string | undefined => {
    const idx = colIndex.get(headerName);
    return idx !== undefined ? row[idx] : undefined;
  };

  // 빈 행(모든 셀이 빈 문자열) 필터링 후 파싱
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row): WeeklyRecord => ({
      week: (getCell(row, WEEKLY_HEADERS.week) ?? "").trim(),
      revenue: safeNumber(getCell(row, WEEKLY_HEADERS.revenue)),
      profit: safeNumber(getCell(row, WEEKLY_HEADERS.profit)),
      usageHours: safeNumber(getCell(row, WEEKLY_HEADERS.usageHours)),
      usageCount: safeNumber(getCell(row, WEEKLY_HEADERS.usageCount)),
      utilizationRate: safeNumber(getCell(row, WEEKLY_HEADERS.utilizationRate)),
      weeklyTarget: safeNumber(getCell(row, WEEKLY_HEADERS.weeklyTarget)),
    }));
}

// --- 통합 데이터 페칭 함수 ---

/**
 * 팀 대시보드 전체 데이터를 가져온다. (DATA-04, UX-02)
 *
 * - Google Sheets 환경변수 미설정 → mockTeamDashboardData 즉시 반환
 * - Google Sheets 설정됨 → 두 시트를 병렬 fetch
 *   - 개별 시트 null 반환 시 해당 mock 배열로 대체 (per-sheet fallback)
 *   - catch: 전체 API 실패 시 mockTeamDashboardData로 폴백 (fetchedAt은 현재 시각)
 *
 * googleapis SDK는 Next.js fetch 캐싱을 사용하지 않으므로
 * 기본적으로 매 요청마다 새로 실행된다. (UX-02 대응)
 */
export async function getTeamDashboardData(): Promise<TeamDashboardData> {
  // 환경변수 미설정 시 mock 데이터 즉시 반환
  if (!isGoogleSheetsConfigured()) {
    return mockTeamDashboardData;
  }

  try {
    // 두 시트를 병렬로 fetch (open-ended range 사용)
    const [dailyRows, weeklyRows] = await Promise.all([
      fetchSheetData(`${DAILY_SHEET}!A:F`),
      fetchSheetData(`${WEEKLY_SHEET}!A:G`),
    ]);

    // 개별 시트 실패 시 해당 mock 배열로 대체
    const daily = dailyRows
      ? parseDailySheet(dailyRows)
      : mockTeamDashboardData.daily;

    const weekly = weeklyRows
      ? parseWeeklySheet(weeklyRows)
      : mockTeamDashboardData.weekly;

    return {
      daily,
      weekly,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Google Sheets 데이터 가져오기 실패, mock 데이터로 전체 폴백:", error);
    // API 실패 시 전체 mock 폴백, fetchedAt은 현재 시각 사용
    return {
      ...mockTeamDashboardData,
      fetchedAt: new Date().toISOString(),
    };
  }
}
