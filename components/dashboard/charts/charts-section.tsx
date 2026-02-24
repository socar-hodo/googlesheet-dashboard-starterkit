// components/dashboard/charts/charts-section.tsx
// Server Component — "use client" 없음

import type { TeamDashboardData } from '@/types/dashboard';
import { ChartsSkeleton } from './charts-skeleton';

interface ChartsSectionProps {
  data: TeamDashboardData;
  tab: 'daily' | 'weekly';
}

// TODO(03-02, 03-03): 개별 차트 컴포넌트 완성 후 교체 예정
export function ChartsSection({ data: _data, tab: _tab }: ChartsSectionProps) {
  // 03-02/03-03 완성 전 임시 placeholder
  return <ChartsSkeleton />;
}
