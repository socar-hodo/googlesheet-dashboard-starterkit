// 경남울산사업팀 매출 대시보드 — 데이터 페칭 및 파싱 레이어
import type { DailyRecord, WeeklyRecord, TeamDashboardData } from "@/types/dashboard";
import { fetchSheetData, isGoogleSheetsConfigured } from "./sheets";
import { mockTeamDashboardData } from "./mock-data";

// 실제 Google Sheets 탭 이름 — 환경변수로 재정의 가능 (PITFALLS.md Pitfall 2 대응)
const DAILY_SHEET = process.env.GOOGLE_DAILY_SHEET_NAME ?? "일별";
const WEEKLY_SHEET = process.env.GOOGLE_WEEKLY_SHEET_NAME ?? "주차별";

// 헤더 이름 상수 — 실제 Google Sheets 컬럼명과 일치해야 한다
// 3행(그룹 헤더)과 4행(세부 헤더) 중 비어있지 않은 쪽을 사용 (buildMergedColumnIndex 참고)
const DAILY_HEADERS = {
  date: "일자",
  revenue: "회계매출",   // 3행 그룹 헤더
  profit: "손익",        // 3행 그룹 헤더
  usageHours: "이용시간", // 3행 그룹 헤더 (총합)
  usageCount: "이용건수", // 3행 그룹 헤더 (총합)
  utilizationRate: "반납가동률", // 4행 세부 헤더
} as const;

// weekly 시트 4행은 영어 식별자를 사용함 (buildMergedColumnIndex에서 row4 우선)
const WEEKLY_HEADERS = {
  week: "주차",           // row3 (row4 비어있음)
  revenue: "revenue",     // row4 영어 식별자 → 총 매출
  profit: "주간 손익",    // row3 col 106 ("손익" col 107은 GPM 비율)
  usageHours: "utime",    // row4 영어 식별자 → 총 이용시간
  usageCount: "nuse",     // row4 영어 식별자 → 총 이용건수
  utilizationRate: "반납가동률", // weekly에 없음 → 0 fallback
  weeklyTarget: "목표매출",   // row3 col 122
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
 * 2단 헤더(3행 + 4행)를 병합하여 컬럼 인덱스 Map을 반환한다.
 * 각 컬럼에서 4행이 비어있으면 3행 값을 사용 (그룹 헤더 → 총합 컬럼으로 취급).
 */
function buildMergedColumnIndex(row3: string[], row4: string[]): Map<string, number> {
  const maxLen = Math.max(row3.length, row4.length);
  const merged = Array.from({ length: maxLen }, (_, i) => {
    const r4 = (row4[i] ?? "").trim();
    const r3 = (row3[i] ?? "").trim();
    return r4 !== "" ? r4 : r3;
  });
  return buildColumnIndex(merged);
}

/**
 * 한국어 숫자 문자열을 파싱하여 숫자로 변환한다. (DATA-03 핵심)
 * - undefined, null, 빈 문자열 → 0 반환
 * - ₩ 기호, % 기호, 콤마(,) 제거 후 Number() 변환
 * - 변환 결과가 NaN이면 console.warn 후 null 반환
 */
export function parseKoreanNumber(value: string | null | undefined): number | null {
  // 빈 값 처리 (undefined, null, 빈 문자열, "-" 대시 표기 모두 0)
  if (value === undefined || value === null || value === "" || value.trim() === "-") {
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
  // rows[0] = 3행(그룹 헤더), rows[1] = 4행(세부 헤더), rows[2]~ = 데이터
  if (rows.length < 3) return [];

  const colIndex = buildMergedColumnIndex(rows[0], rows[1]);

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

  // 일자 컬럼이 비어있는 행 제거 (미입력 trailing 행, 합계 행 등 방지)
  const dateIdx = colIndex.get(DAILY_HEADERS.date) ?? -1;
  return rows
    .slice(2)
    .filter((row) => (row[dateIdx] ?? "").trim() !== "")
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
  // rows[0] = 3행(그룹 헤더), rows[1] = 4행(세부 헤더), rows[2]~ = 데이터
  if (rows.length < 3) return [];

  const colIndex = buildMergedColumnIndex(rows[0], rows[1]);

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

  // 주차 컬럼이 비어있는 행 제거 (미입력 trailing 행 방지)
  const weekIdx = colIndex.get(WEEKLY_HEADERS.week) ?? -1;
  return rows
    .slice(2)
    .filter((row) => (row[weekIdx] ?? "").trim() !== "")
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
    // 두 시트를 병렬로 fetch (3행부터: 2단 헤더 대응, 넓은 범위)
    const [dailyRows, weeklyRows] = await Promise.all([
      fetchSheetData(`${DAILY_SHEET}!A3:DZ`),
      fetchSheetData(`${WEEKLY_SHEET}!A3:DZ`),
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
