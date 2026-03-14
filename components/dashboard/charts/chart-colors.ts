export interface ChartColorMode {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  profitPositive: string;
  profitNegative: string;
  utilizationLine: string;
  referenceOrange: string;
  axis: string;
  grid: string;
  tooltip: { bg: string; border: string };
}

export const CHART_COLORS = {
  light: {
    chart1: '#0078FF',
    chart2: '#66B0FF',
    chart3: '#0041E6',
    chart4: '#A3D1FF',
    chart5: '#3393FF',
    profitPositive: '#66B0FF',
    profitNegative: '#99A1B1',
    utilizationLine: '#66B0FF',
    referenceOrange: '#A3D1FF',
    axis: '#697387',
    grid: 'rgba(53,65,83,0.18)',
    tooltip: { bg: '#F2F3F8', border: '#CBD1DC' },
  } satisfies ChartColorMode,
  dark: {
    chart1: '#0078FF',
    chart2: '#66B0FF',
    chart3: '#0041E6',
    chart4: '#A3D1FF',
    chart5: '#3393FF',
    profitPositive: '#66B0FF',
    profitNegative: '#99A1B1',
    utilizationLine: '#66B0FF',
    referenceOrange: '#A3D1FF',
    axis: '#99A1B1',
    grid: 'rgba(255,255,255,0.08)',
    tooltip: { bg: '#111826', border: 'rgba(255,255,255,0.08)' },
  } satisfies ChartColorMode,
} as const;

export function getChartColors(isDark: boolean): ChartColorMode {
  return isDark ? CHART_COLORS.dark : CHART_COLORS.light;
}
