"use client";

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyRecord, WeeklyRecord } from "@/types/dashboard";
import { getChartColors } from "./chart-colors";

interface UsageTrendChartProps {
  records: DailyRecord[] | WeeklyRecord[];
  tab: "daily" | "weekly";
}

function formatDailyLabel(date: string): string {
  const parts = date.split("-");
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
}

function formatWeeklyLabel(week: string): string {
  return week.replace("주차", "주");
}

export function UsageTrendChart({ records, tab }: UsageTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme === "dark");

  const chartData = records.map((r) => ({
    label:
      tab === "daily"
        ? formatDailyLabel((r as DailyRecord).date)
        : formatWeeklyLabel((r as WeeklyRecord).week),
    usageCount: r.usageCount,
    usageHours: r.usageHours,
  }));

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">Usage</p>
        <CardTitle className="text-xl text-white">이용건수 / 이용시간</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-white/6 bg-black/10 p-3">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 28, left: 8, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fill: colors.axis, fontSize: 11 }}
                tickFormatter={(v) => `${v}건`}
                width={44}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: colors.axis, fontSize: 11 }}
                tickFormatter={(v) => `${v}h`}
                width={40}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === "이용건수" ? `${value}건` : `${value}h`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: colors.tooltip.bg,
                  border: `1px solid ${colors.tooltip.border}`,
                  borderRadius: "16px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ color: colors.axis, fontSize: "12px" }} />
              <Bar
                yAxisId="left"
                dataKey="usageCount"
                fill="#0078FF"
                name="이용건수"
                radius={[8, 8, 0, 0]}
                barSize={16}
              />
              <Bar
                yAxisId="right"
                dataKey="usageHours"
                fill="#66B0FF"
                name="이용시간"
                radius={[8, 8, 0, 0]}
                barSize={16}
                fillOpacity={0.9}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
