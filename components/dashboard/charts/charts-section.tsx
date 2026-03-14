'use client';

import type { TeamDashboardData, DailyRecord, WeeklyRecord } from '@/types/dashboard';
import { RevenueTrendChart } from './revenue-trend-chart';
import { ProfitTrendChart } from './profit-trend-chart';
import { UtilizationTrendChart } from './utilization-trend-chart';
import { UsageTrendChart } from './usage-trend-chart';
import { CustomerTypeSection } from './customer-type-section';

interface ChartsSectionProps {
  data: TeamDashboardData;
  tab: 'daily' | 'weekly';
}

function normalizeDate(date: string): string {
  if (date.includes('-')) return date;
  const parts = date.split('.').map((s) => s.trim()).filter((s) => s !== '');
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return date;
}

export function ChartsSection({ data, tab }: ChartsSectionProps) {
  const records: DailyRecord[] | WeeklyRecord[] =
    tab === 'daily'
      ? [...data.daily]
          .map((r) => ({ ...r, date: normalizeDate(r.date) }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30)
      : data.weekly;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <RevenueTrendChart records={records} tab={tab} />
      <ProfitTrendChart records={records} tab={tab} />
      <UtilizationTrendChart records={records} tab={tab} />
      <UsageTrendChart records={records} tab={tab} />
      <CustomerTypeSection
        daily={data.customerTypeDaily}
        weekly={data.customerTypeWeekly}
        tab={tab}
      />
    </div>
  );
}
