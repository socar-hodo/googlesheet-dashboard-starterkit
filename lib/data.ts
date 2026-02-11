// 데이터 페칭 통합 레이어
// Google Sheets가 설정되면 실제 데이터, 아니면 mock 데이터를 반환합니다
import type {
  DashboardData,
  KpiData,
  MonthlyRevenue,
  CategoryDistribution,
  RecentOrder,
} from "@/types/dashboard";
import { fetchSheetData, isGoogleSheetsConfigured } from "./sheets";
import { mockDashboardData } from "./mock-data";

// --- Google Sheets 데이터 파서 ---

/** KPI 시트 데이터를 파싱 (A열: 지표명, B열: 값) */
function parseKpiFromSheet(rows: string[][]): KpiData {
  // 첫 행은 헤더, 나머지 행에서 값 추출
  const dataRows = rows.slice(1);
  const getValue = (index: number) => Number(dataRows[index]?.[1] ?? 0);

  return {
    totalRevenue: getValue(0),
    orderCount: getValue(1),
    averageOrderValue: getValue(2),
    growthRate: getValue(3),
  };
}

/** 월별 매출 시트 데이터를 파싱 (A열: 월, B열: 매출) */
function parseMonthlyRevenueFromSheet(rows: string[][]): MonthlyRevenue[] {
  return rows.slice(1).map((row) => ({
    month: row[0] ?? "",
    revenue: Number(row[1] ?? 0),
  }));
}

/** 카테고리 시트 데이터를 파싱 (A열: 카테고리명, B열: 비율, C열: 색상코드) */
function parseCategoryFromSheet(rows: string[][]): CategoryDistribution[] {
  return rows.slice(1).map((row) => ({
    name: row[0] ?? "",
    value: Number(row[1] ?? 0),
    fill: row[2] ?? "var(--chart-1)",
  }));
}

/** 주문 시트 데이터를 파싱 (A~F열: 주문번호, 고객명, 상품, 금액, 상태, 날짜) */
function parseOrdersFromSheet(rows: string[][]): RecentOrder[] {
  return rows.slice(1).map((row) => ({
    id: row[0] ?? "",
    customerName: row[1] ?? "",
    product: row[2] ?? "",
    amount: Number(row[3] ?? 0),
    status: (row[4] as RecentOrder["status"]) ?? "처리중",
    date: row[5] ?? "",
  }));
}

// --- 통합 데이터 페칭 함수 ---

/**
 * 대시보드 전체 데이터를 가져옵니다.
 * Google Sheets 환경변수가 설정되면 실제 시트에서 데이터를 가져오고,
 * 설정되지 않았으면 mock 데이터를 반환합니다.
 *
 * 각 데이터 영역은 독립적으로 폴백 처리되어,
 * 하나의 시트가 실패해도 나머지는 정상 표시됩니다.
 */
export async function getDashboardData(): Promise<DashboardData> {
  // 환경변수 미설정 시 mock 데이터 즉시 반환
  if (!isGoogleSheetsConfigured()) {
    return mockDashboardData;
  }

  try {
    // 각 시트에서 데이터를 병렬로 가져오기 (성능 최적화)
    const [kpiRows, revenueRows, categoryRows, orderRows] = await Promise.all([
      fetchSheetData("KPI!A1:B5"),
      fetchSheetData("매출!A1:B13"),
      fetchSheetData("카테고리!A1:C6"),
      fetchSheetData("주문!A1:F11"),
    ]);

    return {
      kpi: kpiRows
        ? parseKpiFromSheet(kpiRows)
        : mockDashboardData.kpi,
      monthlyRevenue: revenueRows
        ? parseMonthlyRevenueFromSheet(revenueRows)
        : mockDashboardData.monthlyRevenue,
      categoryDistribution: categoryRows
        ? parseCategoryFromSheet(categoryRows)
        : mockDashboardData.categoryDistribution,
      recentOrders: orderRows
        ? parseOrdersFromSheet(orderRows)
        : mockDashboardData.recentOrders,
    };
  } catch (error) {
    console.error("Google Sheets 데이터 가져오기 실패, mock 데이터로 대체:", error);
    return mockDashboardData;
  }
}
