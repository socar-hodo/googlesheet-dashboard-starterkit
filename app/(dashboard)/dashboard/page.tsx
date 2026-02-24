// 대시보드 메인 페이지 (Server Component)
// searchParams로 탭 상태를 읽어 KPI 카드, 차트, 데이터 테이블을 렌더링합니다
import { Suspense } from 'react';
import { getTeamDashboardData } from '@/lib/data';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { KpiCardsSkeleton } from '@/components/dashboard/kpi-cards-skeleton';
import { TabNav } from '@/components/dashboard/tab-nav';
import { ChartsSection } from '@/components/dashboard/charts/charts-section';
import { ChartsSkeleton } from '@/components/dashboard/charts/charts-skeleton';
import { DataTable } from '@/components/dashboard/data-table';
import { DataTableSkeleton } from '@/components/dashboard/data-table-skeleton';
import { UpdateTimestamp } from '@/components/dashboard/update-timestamp';

// 탭 전환 시 서버에서 최신 데이터를 가져오도록 캐시 비활성화
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ tab?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Next.js 16: searchParams는 Promise — await 필수
  const { tab = 'daily' } = await searchParams;
  const activeTab = tab === 'weekly' ? 'weekly' : 'daily';

  const data = await getTeamDashboardData();

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 — useSearchParams() 사용으로 Suspense 감싸기 필요 */}
      <Suspense fallback={null}>
        <TabNav activeTab={activeTab} />
      </Suspense>

      {/* 마지막 업데이트 타임스탬프 — 대시보드 상단 우측 정렬 (UX-03) */}
      <div className="flex justify-end">
        <UpdateTimestamp fetchedAt={data.fetchedAt} />
      </div>

      {/* key prop으로 탭 전환 시 Suspense 리셋 → 스켈레턴 재표시 (UX-01) */}
      <Suspense key={activeTab} fallback={<KpiCardsSkeleton />}>
        <KpiCards data={data} tab={activeTab} />
      </Suspense>

      {/* CHART-01~05: 차트 섹션 — 탭 전환 시 key 변경으로 스켈레턴 재표시 (RESEARCH.md Pattern 8) */}
      <Suspense key={`charts-${activeTab}`} fallback={<ChartsSkeleton />}>
        <ChartsSection data={data} tab={activeTab} />
      </Suspense>

      {/* 데이터 테이블 — Daily/Weekly 탭별 상세 데이터, 탭 전환 시 스켈레톤 재표시 */}
      <Suspense key={`table-${activeTab}`} fallback={<DataTableSkeleton />}>
        <DataTable data={data} tab={activeTab} />
      </Suspense>
    </div>
  );
}
