'use client';

import type { TeamDashboardData, DailyRecord, WeeklyRecord } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface DataTableProps {
  data: TeamDashboardData;
  tab: 'daily' | 'weekly';
}

function formatCurrency(value: number): string {
  return `₩${Math.round(value / 10000).toLocaleString()}만`;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${h}h ${m}m`;
}

function formatRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

function formatCount(count: number): string {
  return `${count.toLocaleString()}건`;
}

function calcGpm(profit: number, revenue: number): number {
  return revenue > 0 ? (profit / revenue) * 100 : 0;
}

function formatGpm(gpm: number): string {
  return `${gpm.toFixed(1)}%`;
}

function formatGpmTrend(current: number, prev: number | null): string {
  if (prev === null) return '-';
  const delta = current - prev;
  if (Math.abs(delta) < 0.05) return '-';
  return `${delta > 0 ? '+' : '-'}${Math.abs(delta).toFixed(1)}%p`;
}

function gpmTrendClass(current: number, prev: number | null): string {
  if (prev === null) return '';
  const delta = current - prev;
  if (Math.abs(delta) < 0.05) return 'text-[#99A1B1]';
  return delta > 0 ? 'text-[#66B0FF]' : 'text-[#99A1B1]';
}

function TableShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">Data View</p>
        <CardTitle className="text-2xl text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function DailyTable({ records }: { records: DailyRecord[] }) {
  const gpms = records.map((r) => calcGpm(r.profit, r.revenue));
  const sumRevenue = records.reduce((acc, r) => acc + r.revenue, 0);
  const sumProfit = records.reduce((acc, r) => acc + r.profit, 0);
  const sumUsageHours = records.reduce((acc, r) => acc + r.usageHours, 0);
  const sumUsageCount = records.reduce((acc, r) => acc + r.usageCount, 0);
  const len = records.length;
  const avgRevenue = len > 0 ? sumRevenue / len : 0;
  const avgUsageHours = len > 0 ? sumUsageHours / len : 0;
  const avgUsageCount = len > 0 ? sumUsageCount / len : 0;
  const avgUtilization = len > 0 ? records.reduce((acc, r) => acc + r.utilizationRate, 0) / len : 0;
  const totalGpm = calcGpm(sumProfit, sumRevenue);
  const avgGpm = len > 0 ? gpms.reduce((a, b) => a + b, 0) / len : 0;

  return (
    <TableShell title="일별 상세 지표">
      <div className="max-h-[70vh] overflow-auto rounded-[24px] border border-white/6 bg-black/10">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-[#111826]">
            <TableRow>
              <TableHead className="text-left">날짜</TableHead>
              <TableHead className="text-right">매출</TableHead>
              <TableHead className="text-right">GPM</TableHead>
              <TableHead className="text-right">GPM 추이</TableHead>
              <TableHead className="text-right">이용시간</TableHead>
              <TableHead className="text-right">이용건수</TableHead>
              <TableHead className="text-right">가동률</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => (
              <TableRow key={record.date} className={index % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                <TableCell className="text-left text-[#CBD1DC]">{record.date}</TableCell>
                <TableCell className="text-right">{formatCurrency(record.revenue)}</TableCell>
                <TableCell className="text-right">{formatGpm(gpms[index])}</TableCell>
                <TableCell className={`text-right ${gpmTrendClass(gpms[index], index > 0 ? gpms[index - 1] : null)}`}>
                  {formatGpmTrend(gpms[index], index > 0 ? gpms[index - 1] : null)}
                </TableCell>
                <TableCell className="text-right">{formatHours(record.usageHours)}</TableCell>
                <TableCell className="text-right">{formatCount(record.usageCount)}</TableCell>
                <TableCell className="text-right">{formatRate(record.utilizationRate)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-white/[0.05] font-semibold">
              <TableCell className="text-left">합계</TableCell>
              <TableCell className="text-right">{formatCurrency(sumRevenue)}</TableCell>
              <TableCell className="text-right">{formatGpm(totalGpm)}</TableCell>
              <TableCell className="text-right">-</TableCell>
              <TableCell className="text-right">{formatHours(sumUsageHours)}</TableCell>
              <TableCell className="text-right">{formatCount(sumUsageCount)}</TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
            <TableRow className="bg-white/[0.05] font-semibold">
              <TableCell className="text-left">평균</TableCell>
              <TableCell className="text-right">{formatCurrency(Math.round(avgRevenue))}</TableCell>
              <TableCell className="text-right">{formatGpm(avgGpm)}</TableCell>
              <TableCell className="text-right">-</TableCell>
              <TableCell className="text-right">{formatHours(avgUsageHours)}</TableCell>
              <TableCell className="text-right">{formatCount(Math.round(avgUsageCount))}</TableCell>
              <TableCell className="text-right">{formatRate(avgUtilization)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </TableShell>
  );
}

function WeeklyTable({ records }: { records: WeeklyRecord[] }) {
  const gpms = records.map((r) => calcGpm(r.profit, r.revenue));
  const sumRevenue = records.reduce((acc, r) => acc + r.revenue, 0);
  const sumProfit = records.reduce((acc, r) => acc + r.profit, 0);
  const sumUsageHours = records.reduce((acc, r) => acc + r.usageHours, 0);
  const sumUsageCount = records.reduce((acc, r) => acc + r.usageCount, 0);
  const sumTarget = records.reduce((acc, r) => acc + r.weeklyTarget, 0);
  const len = records.length;
  const avgRevenue = len > 0 ? sumRevenue / len : 0;
  const avgUsageHours = len > 0 ? sumUsageHours / len : 0;
  const avgUsageCount = len > 0 ? sumUsageCount / len : 0;
  const avgUtilization = len > 0 ? records.reduce((acc, r) => acc + r.utilizationRate, 0) / len : 0;
  const avgTarget = len > 0 ? sumTarget / len : 0;
  const totalGpm = calcGpm(sumProfit, sumRevenue);
  const avgGpm = len > 0 ? gpms.reduce((a, b) => a + b, 0) / len : 0;

  return (
    <TableShell title="주간 상세 지표">
      <div className="max-h-[70vh] overflow-auto rounded-[24px] border border-white/6 bg-black/10">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-[#111826]">
            <TableRow>
              <TableHead className="text-left">주차</TableHead>
              <TableHead className="text-right">매출</TableHead>
              <TableHead className="text-right">GPM</TableHead>
              <TableHead className="text-right">GPM 추이</TableHead>
              <TableHead className="text-right">이용시간</TableHead>
              <TableHead className="text-right">이용건수</TableHead>
              <TableHead className="text-right">가동률</TableHead>
              <TableHead className="text-right">목표</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => (
              <TableRow key={record.week} className={index % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                <TableCell className="text-left text-[#CBD1DC]">{record.week}</TableCell>
                <TableCell className="text-right">{formatCurrency(record.revenue)}</TableCell>
                <TableCell className="text-right">{formatGpm(gpms[index])}</TableCell>
                <TableCell className={`text-right ${gpmTrendClass(gpms[index], index > 0 ? gpms[index - 1] : null)}`}>
                  {formatGpmTrend(gpms[index], index > 0 ? gpms[index - 1] : null)}
                </TableCell>
                <TableCell className="text-right">{formatHours(record.usageHours)}</TableCell>
                <TableCell className="text-right">{formatCount(record.usageCount)}</TableCell>
                <TableCell className="text-right">{formatRate(record.utilizationRate)}</TableCell>
                <TableCell className="text-right">{formatCurrency(record.weeklyTarget)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-white/[0.05] font-semibold">
              <TableCell className="text-left">합계</TableCell>
              <TableCell className="text-right">{formatCurrency(sumRevenue)}</TableCell>
              <TableCell className="text-right">{formatGpm(totalGpm)}</TableCell>
              <TableCell className="text-right">-</TableCell>
              <TableCell className="text-right">{formatHours(sumUsageHours)}</TableCell>
              <TableCell className="text-right">{formatCount(sumUsageCount)}</TableCell>
              <TableCell className="text-right">-</TableCell>
              <TableCell className="text-right">{formatCurrency(sumTarget)}</TableCell>
            </TableRow>
            <TableRow className="bg-white/[0.05] font-semibold">
              <TableCell className="text-left">평균</TableCell>
              <TableCell className="text-right">{formatCurrency(Math.round(avgRevenue))}</TableCell>
              <TableCell className="text-right">{formatGpm(avgGpm)}</TableCell>
              <TableCell className="text-right">-</TableCell>
              <TableCell className="text-right">{formatHours(avgUsageHours)}</TableCell>
              <TableCell className="text-right">{formatCount(Math.round(avgUsageCount))}</TableCell>
              <TableCell className="text-right">{formatRate(avgUtilization)}</TableCell>
              <TableCell className="text-right">{formatCurrency(Math.round(avgTarget))}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </TableShell>
  );
}

export function DataTable({ data, tab }: DataTableProps) {
  if (tab === 'daily') {
    if (data.daily.length === 0) {
      return <p className="py-4 text-muted-foreground">일별 데이터가 없습니다.</p>;
    }
    return <DailyTable records={data.daily} />;
  }

  if (data.weekly.length === 0) {
    return <p className="py-4 text-muted-foreground">주간 데이터가 없습니다.</p>;
  }
  return <WeeklyTable records={data.weekly} />;
}
