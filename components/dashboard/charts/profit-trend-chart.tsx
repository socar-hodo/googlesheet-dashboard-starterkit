"use client";

import {
  BarChart,
  Bar,
  Cell,
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

interface ProfitTrendChartProps {
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

export function ProfitTrendChart({ records, tab }: ProfitTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme === "dark");

  const chartData = records.map((r) => ({
    label:
      tab === "daily"
        ? formatDailyLabel((r as DailyRecord).date)
        : formatWeeklyLabel((r as WeeklyRecord).week),
    gpm: r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0,
  }));

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">Margin</p>
        <CardTitle className="text-xl text-white">GPM 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-white/6 bg-black/10 p-3">
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <BarChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: colors.axis, fontSize: 11 }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                width={46}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "GPM"]}
                contentStyle={{
                  backgroundColor: colors.tooltip.bg,
                  border: `1px solid ${colors.tooltip.border}`,
                  borderRadius: "16px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="gpm" name="GPM" radius={[8, 8, 0, 0]} barSize={22}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.gpm >= 0 ? "#66B0FF" : "#697387"}
                    fillOpacity={0.95}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
