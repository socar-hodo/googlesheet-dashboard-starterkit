"use client";

import {
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyRecord, WeeklyRecord } from "@/types/dashboard";
import { getChartColors } from "./chart-colors";

interface UtilizationTrendChartProps {
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

export function UtilizationTrendChart({ records, tab }: UtilizationTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme === "dark");

  const chartData = records.map((r) => ({
    label:
      tab === "daily"
        ? formatDailyLabel((r as DailyRecord).date)
        : formatWeeklyLabel((r as WeeklyRecord).week),
    utilizationRate: r.utilizationRate,
  }));

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">Utilization</p>
        <CardTitle className="text-xl text-white">가동률 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-white/6 bg-black/10 p-3">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 8, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: colors.axis, fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
                width={42}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "가동률"]}
                contentStyle={{
                  backgroundColor: colors.tooltip.bg,
                  border: `1px solid ${colors.tooltip.border}`,
                  borderRadius: "16px",
                  fontSize: "12px",
                }}
              />
              <ReferenceLine
                y={80}
                stroke="#EBF5FF"
                strokeDasharray="4 4"
                label={{
                  value: "기준 80%",
                  position: "insideTopRight",
                  fill: "#EBF5FF",
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="utilizationRate"
                stroke="#66B0FF"
                strokeWidth={3}
                dot={{ r: 3, fill: "#66B0FF", stroke: "#0078FF", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#EBF5FF", stroke: "#0078FF", strokeWidth: 2 }}
                name="가동률"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
