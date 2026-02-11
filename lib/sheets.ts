// Google Sheets API 연동 유틸리티
// 서비스 계정 인증 방식으로 스프레드시트 데이터를 가져옵니다
import { google } from "googleapis";

/** Google Sheets 환경변수가 모두 설정되었는지 확인 */
export function isGoogleSheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SHEETS_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );
}

/** 서비스 계정 인증 클라이언트 생성 */
function getAuthClient() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // .env 파일에서 \\n을 실제 줄바꿈 문자로 변환
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

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
export async function fetchSheetData(
  range: string
): Promise<string[][] | null> {
  if (!isGoogleSheetsConfigured()) return null;

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range,
  });

  return (response.data.values as string[][]) ?? null;
}
