'use client';

import type { CustomerTypeRow } from '@/types/dashboard';
import { CustomerTypeDonut } from './customer-type-donut';
import { CustomerTypeTrend } from './customer-type-trend';

interface CustomerTypeSectionProps {
  daily: CustomerTypeRow[];
  weekly: CustomerTypeRow[];
  tab: 'daily' | 'weekly';
}

export function CustomerTypeSection({ daily, weekly, tab }: CustomerTypeSectionProps) {
  const data = tab === 'daily' ? daily : weekly;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_2fr] xl:col-span-2">
      <CustomerTypeDonut data={data} />
      <CustomerTypeTrend data={data} tab={tab} />
    </div>
  );
}
