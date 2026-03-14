"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyRecord, WeeklyRecord } from "@/types/dashboard";
import { getChartColors } from "./chart-colors";

interface RevenueTrendChartProps {
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

export function RevenueTrendChart({ records, tab }: RevenueTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme === "dark");

  const chartData = records.map((r) => ({
    label:
      tab === "daily"
        ? formatDailyLabel((r as DailyRecord).date)
        : formatWeeklyLabel((r as WeeklyRecord).week),
    revenue: r.revenue,
    target: tab === "weekly" ? (r as WeeklyRecord).weeklyTarget : undefined,
  }));

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">Revenue</p>
        <CardTitle className="text-xl text-white">매출 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-white/6 bg-black/10 p-3">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 8, bottom: 2 }}>
              <defs>
                <linearGradient id="revenue-bar" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#66B0FF" />
                  <stop offset="100%" stopColor="#0078FF" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: colors.axis, fontSize: 11 }}
                tickFormatter={(v) => `${Math.round(v / 10000).toLocaleString()}만`}
                width={60}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  `₩${Math.round(Number(value) / 10000).toLocaleString()}만`,
                  name === "revenue" ? "실적" : "목표",
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
                dataKey="revenue"
                fill="url(#revenue-bar)"
                name="revenue"
                radius={[8, 8, 0, 0]}
                barSize={tab === "weekly" ? 26 : 18}
              />
              {tab === "weekly" && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#EBF5FF"
                  strokeWidth={2.5}
                  dot={{ fill: "#EBF5FF", r: 4, stroke: "#0078FF", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  name="target"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
