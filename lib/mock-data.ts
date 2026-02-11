// 목(mock) 데이터: 환경변수 미설정 시 기본으로 사용
import type { DashboardData } from "@/types/dashboard";

export const mockDashboardData: DashboardData = {
  // KPI 요약 데이터
  kpi: {
    totalRevenue: 124500000,     // 1억 2,450만원
    orderCount: 1847,
    averageOrderValue: 67400,
    growthRate: 12.5,
  },

  // 월별 매출 추이 (12개월)
  monthlyRevenue: [
    { month: "1월", revenue: 8500000 },
    { month: "2월", revenue: 9200000 },
    { month: "3월", revenue: 10100000 },
    { month: "4월", revenue: 9800000 },
    { month: "5월", revenue: 11200000 },
    { month: "6월", revenue: 10500000 },
    { month: "7월", revenue: 11800000 },
    { month: "8월", revenue: 10300000 },
    { month: "9월", revenue: 9900000 },
    { month: "10월", revenue: 10800000 },
    { month: "11월", revenue: 11600000 },
    { month: "12월", revenue: 12800000 },
  ],

  // 카테고리별 분포 (5개 카테고리)
  categoryDistribution: [
    { name: "전자제품", value: 35, fill: "var(--chart-1)" },
    { name: "의류", value: 25, fill: "var(--chart-2)" },
    { name: "식품", value: 20, fill: "var(--chart-3)" },
    { name: "도서", value: 12, fill: "var(--chart-4)" },
    { name: "기타", value: 8, fill: "var(--chart-5)" },
  ],

  // 최근 주문 목록 (10건)
  recentOrders: [
    {
      id: "ORD-001",
      customerName: "김철수",
      product: "무선 이어폰 Pro",
      amount: 189000,
      status: "완료",
      date: "2025-01-15",
    },
    {
      id: "ORD-002",
      customerName: "이영희",
      product: "캐시미어 코트",
      amount: 350000,
      status: "완료",
      date: "2025-01-14",
    },
    {
      id: "ORD-003",
      customerName: "박민수",
      product: "유기농 견과류 세트",
      amount: 45000,
      status: "처리중",
      date: "2025-01-14",
    },
    {
      id: "ORD-004",
      customerName: "정수진",
      product: "프로그래밍 입문서",
      amount: 32000,
      status: "완료",
      date: "2025-01-13",
    },
    {
      id: "ORD-005",
      customerName: "최동훈",
      product: "블루투스 스피커",
      amount: 89000,
      status: "취소",
      date: "2025-01-13",
    },
    {
      id: "ORD-006",
      customerName: "한지은",
      product: "요가 매트 세트",
      amount: 56000,
      status: "완료",
      date: "2025-01-12",
    },
    {
      id: "ORD-007",
      customerName: "강호진",
      product: "스마트 워치",
      amount: 299000,
      status: "처리중",
      date: "2025-01-12",
    },
    {
      id: "ORD-008",
      customerName: "윤서아",
      product: "실크 스카프",
      amount: 128000,
      status: "완료",
      date: "2025-01-11",
    },
    {
      id: "ORD-009",
      customerName: "임재현",
      product: "프리미엄 커피 원두",
      amount: 38000,
      status: "완료",
      date: "2025-01-11",
    },
    {
      id: "ORD-010",
      customerName: "송미래",
      product: "노이즈 캔슬링 헤드폰",
      amount: 420000,
      status: "처리중",
      date: "2025-01-10",
    },
  ],
};
