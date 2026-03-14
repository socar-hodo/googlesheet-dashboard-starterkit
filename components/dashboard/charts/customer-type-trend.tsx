'use client';

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getChartColors } from './chart-colors';
import type { CustomerTypeRow } from '@/types/dashboard';

interface CustomerTypeTrendProps {
  data: CustomerTypeRow[];
  tab: 'daily' | 'weekly';
}

function formatXLabel(row: CustomerTypeRow, tab: 'daily' | 'weekly'): string {
  if (tab === 'daily' && row.date) {
    const parts = row.date.split('-');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return `${month}/${day}`;
    }
    return row.date;
  }
  if (tab === 'weekly' && row.week) {
    return row.week.replace('주차', '주');
  }
  return '';
}

export function CustomerTypeTrend({ data, tab }: CustomerTypeTrendProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme === 'dark');

  const totalCount = data.reduce(
    (sum, row) => sum + row.roundTripCount + row.callCount + row.oneWayCount,
    0,
  );

  if (data.length === 0 || totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>유형별 이용건수 추이</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((row) => ({
    label: formatXLabel(row, tab),
    왕복: row.roundTripCount,
    부름: row.callCount,
    편도: row.oneWayCount,
  }));

  const CustomTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((sum: number, p: { value?: number }) => sum + (p.value ?? 0), 0);

    return (
      <div
        style={{
          backgroundColor: colors.tooltip.bg,
          border: `1px solid ${colors.tooltip.border}`,
          borderRadius: '16px',
          padding: '10px 12px',
          fontSize: '12px',
        }}
      >
        <p style={{ marginBottom: 6 }}>{label}</p>
        {payload.map((p: { dataKey?: string | number; name?: string; value?: number; fill?: string }) => (
          <p key={String(p.dataKey)} style={{ color: p.fill }}>
            {p.name}: {p.value}건
          </p>
        ))}
        <p style={{ borderTop: `1px solid ${colors.tooltip.border}`, marginTop: 6, paddingTop: 6 }}>
          합계: {total}건
        </p>
      </div>
    );
  };

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">Customer Trend</p>
        <CardTitle className="text-xl text-white">유형별 이용건수 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-white/6 bg-black/10 p-3">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <BarChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: colors.axis }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v}건`}
                width={50}
                tick={{ fontSize: 11, fill: colors.axis }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={CustomTooltip} />
              <Legend wrapperStyle={{ color: colors.axis, fontSize: '12px' }} />
              <Bar dataKey="왕복" stackId="a" fill="#66B0FF" radius={[0, 0, 0, 0]} />
              <Bar dataKey="부름" stackId="a" fill="#0078FF" radius={[0, 0, 0, 0]} />
              <Bar dataKey="편도" stackId="a" fill="#0041E6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
