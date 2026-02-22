// 경남울산사업팀 매출 대시보드 — 팀 전용 타입 정의

/** Daily 시트 한 행 — 일자별 기록 */
export interface DailyRecord {
  date: string;             // 일자 (시트 원본 형식 그대로, 예: "2026-02-21")
  revenue: number;          // 매출 (원)
  profit: number;           // 손익 (원, 음수 가능)
  usageHours: number;       // 이용시간 (시간)
  usageCount: number;       // 이용건수
  utilizationRate: number;  // 가동률 (%, 0-100 범위)
  // monthlyTarget 없음 — Daily 시트에는 목표 컬럼이 존재하지 않음 (CONTEXT.md 결정)
}

/** Weekly 시트 한 행 — 주차별 기록 */
export interface WeeklyRecord {
  week: string;             // 주차 (시트 원본 형식 그대로, 예: "1주차", "2월 3주차")
  revenue: number;          // 매출 (원)
  profit: number;           // 손익 (원, 음수 가능)
  usageHours: number;       // 이용시간 (시간)
  usageCount: number;       // 이용건수
  utilizationRate: number;  // 가동률 (%, 0-100 범위)
  weeklyTarget: number;     // 주차 목표 (원) — Weekly 전용 필드
}

/** 대시보드 전체 데이터 컨테이너 */
export interface TeamDashboardData {
  daily: DailyRecord[];
  weekly: WeeklyRecord[];
  fetchedAt: string;        // ISO 8601 타임스탬프 (예: "2026-02-22T09:00:00.000Z")
}
