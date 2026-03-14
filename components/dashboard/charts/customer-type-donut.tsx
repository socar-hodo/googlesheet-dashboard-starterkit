'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getChartColors } from './chart-colors';
import type { CustomerTypeRow } from '@/types/dashboard';

interface CustomerTypeDonutProps {
  data: CustomerTypeRow[];
}

export function CustomerTypeDonut({ data }: CustomerTypeDonutProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme === 'dark');

  const totals = data.reduce(
    (acc, row) => ({
      roundTrip: acc.roundTrip + row.roundTripCount,
      call: acc.call + row.callCount,
      oneWay: acc.oneWay + row.oneWayCount,
    }),
    { roundTrip: 0, call: 0, oneWay: 0 },
  );

  const total = totals.roundTrip + totals.call + totals.oneWay;
  const pieData = [
    { name: '왕복', value: totals.roundTrip, color: '#66B0FF' },
    { name: '부름', value: totals.call, color: '#0078FF' },
    { name: '편도', value: totals.oneWay, color: '#0041E6' },
  ];

  if (data.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>고객 유형 분포</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">Customer Mix</p>
        <CardTitle className="text-xl text-white">고객 유형 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-white/6 bg-black/10 p-3">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <PieChart>
              <text
                x="50%"
                y="47%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#F2F3F8"
                fontSize="24px"
                fontWeight="700"
              >
                {total}건
              </text>
              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={colors.axis}
                fontSize="12px"
              >
                총 이용 수
              </text>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={3}
                stroke="rgba(13,20,32,0.75)"
                strokeWidth={3}
                label={false}
                labelLine={false}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ color: colors.axis, fontSize: '12px' }} />
              <Tooltip
                formatter={(value, name) => {
                  const numValue = Number(value);
                  const pct = total > 0 ? Math.round((numValue / total) * 100) : 0;
                  return [`${numValue}건 (${pct}%)`, name];
                }}
                contentStyle={{
                  backgroundColor: colors.tooltip.bg,
                  border: `1px solid ${colors.tooltip.border}`,
                  borderRadius: '16px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
