// 메인 대시보드 페이지 (Server Component)
// 서버에서 데이터를 가져와 각 컴포넌트에 전달합니다
import { getDashboardData } from "@/lib/data";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";

export default async function DashboardPage() {
  // 서버에서 데이터 페칭 (Google Sheets 또는 mock 데이터)
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* KPI 요약 카드 4개 */}
      <KpiCards data={data.kpi} />

      {/* 차트 영역: 라인 차트 (4/7) + 파이 차트 (3/7) */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueChart data={data.monthlyRevenue} />
        </div>
        <div className="lg:col-span-3">
          <CategoryChart data={data.categoryDistribution} />
        </div>
      </div>

      {/* 최근 주문 테이블 */}
      <RecentOrdersTable data={data.recentOrders} />
    </div>
  );
}
