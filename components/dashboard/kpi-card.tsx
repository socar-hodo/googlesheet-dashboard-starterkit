'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getAchievementColorClass, getProgressColorClass } from '@/lib/kpi-utils';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
  title: string;
  value: string;
  target?: string;
  achievementRate?: number;
  deltaText?: string;
  deltaColorClass?: string;
  icon: React.ReactNode;
  sparklineData?: number[];
}

export function KpiCard({
  title,
  value,
  target,
  achievementRate,
  deltaText,
  deltaColorClass,
  icon,
  sparklineData,
}: KpiCardProps) {
  return (
    <Card className="gap-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">{title}</CardTitle>
        <div className="rounded-2xl bg-[rgba(0,120,255,0.15)] p-2 text-[#A3D1FF]">{icon}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-semibold tracking-[-0.04em] text-white">{value}</div>
        {achievementRate !== undefined && (
          <>
            <div className={cn('text-xs font-medium', getAchievementColorClass(achievementRate))}>
              달성률 {achievementRate}%
            </div>
            <Progress
              value={Math.min(achievementRate, 100)}
              className={cn('h-2', getProgressColorClass(achievementRate))}
            />
          </>
        )}
        {target && (
          <p className="text-xs text-muted-foreground">목표: {target}</p>
        )}
        {deltaText && (
          <p className={cn('text-xs font-medium', deltaColorClass)}>{deltaText}</p>
        )}
        {sparklineData && sparklineData.length >= 2 && (
          <div className="rounded-[20px] border border-white/6 bg-black/10 px-2 pt-2">
            <ResponsiveContainer width="100%" height={40} minWidth={0}>
              <AreaChart
                data={sparklineData.map((v, i) => ({ v, i }))}
                margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
              >
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#66B0FF"
                  strokeWidth={1.8}
                  fill="#0078FF"
                  fillOpacity={0.18}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
