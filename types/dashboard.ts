// 대시보드 데이터 타입 정의

/** KPI 카드 데이터 */
export interface KpiData {
  totalRevenue: number;       // 총 매출 (원)
  orderCount: number;         // 주문 수
  averageOrderValue: number;  // 평균 주문 금액 (원)
  growthRate: number;         // 성장률 (%)
}

/** 월별 매출 데이터 (라인 차트용) */
export interface MonthlyRevenue {
  month: string;     // "1월", "2월" 등
  revenue: number;   // 매출 금액 (원)
}

/** 카테고리 분포 데이터 (파이 차트용) */
export interface CategoryDistribution {
  name: string;   // 카테고리 이름
  value: number;  // 비율 (%)
  fill: string;   // 차트 색상 (CSS 변수 참조)
}

/** 최근 주문 데이터 (테이블용) */
export interface RecentOrder {
  id: string;           // 주문 번호
  customerName: string; // 고객명
  product: string;      // 상품명
  amount: number;       // 금액 (원)
  status: "완료" | "처리중" | "취소"; // 주문 상태
  date: string;         // 주문 날짜 (YYYY-MM-DD)
}

/** 대시보드 전체 데이터 */
export interface DashboardData {
  kpi: KpiData;
  monthlyRevenue: MonthlyRevenue[];
  categoryDistribution: CategoryDistribution[];
  recentOrders: RecentOrder[];
}
