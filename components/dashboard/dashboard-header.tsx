'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Download } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PeriodFilter } from './period-filter';
import {
  type PeriodKey,
  DAILY_PERIODS,
  WEEKLY_PERIODS,
  DEFAULT_DAILY_PERIOD,
  DEFAULT_WEEKLY_PERIOD,
} from '@/lib/period-utils';

interface DashboardHeaderProps {
  tab: 'daily' | 'weekly' | 'forecast';
  period: PeriodKey;
  onPeriodChange: (p: PeriodKey) => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
}

export function DashboardHeader({ tab, period, onPeriodChange, onExportCsv, onExportXlsx }: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    params.set('period', value === 'weekly' ? DEFAULT_WEEKLY_PERIOD : DEFAULT_DAILY_PERIOD);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <section className="grid gap-5 rounded-[32px] border border-white/8 bg-[linear-gradient(135deg,rgba(0,120,255,0.18),rgba(5,10,90,0.12)_40%,rgba(255,255,255,0.03))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-7">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A3D1FF]">Mobility Overview</p>
        <h2 className="mt-2 max-w-[12ch] text-3xl font-semibold leading-[0.95] tracking-[-0.05em] text-white md:text-5xl">
          원하는 이동을 더 빠르게 읽어냅니다.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#CBD1DC] md:text-[15px]">
          기존 데이터 구조는 유지하고, 대시보드의 시각 언어만 SOCAR 브랜드에 맞춰 정리했습니다. 블루 포인트와 차분한 다크 패널로 핵심 지표를 더 분명하게 보여줍니다.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="daily">일별</TabsTrigger>
            <TabsTrigger value="weekly">주간</TabsTrigger>
            <TabsTrigger value="forecast">예측</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <PeriodFilter
            periods={tab === 'weekly' ? WEEKLY_PERIODS : DAILY_PERIODS}
            active={period}
            onChange={onPeriodChange}
          />
          {tab !== 'forecast' && (
            <>
              <Button variant="outline" size="sm" onClick={onExportCsv}>
                <Download className="mr-1 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={onExportXlsx}>
                <Download className="mr-1 h-4 w-4" />
                Excel
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
