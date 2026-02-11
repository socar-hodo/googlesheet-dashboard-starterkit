// KPI 요약 카드 4개: 총매출, 주문수, 평균단가, 성장률
// Server Component로 동작 (인터랙션 없음)
import { TrendingUp, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiData } from "@/types/dashboard";

interface KpiCardsProps {
  data: KpiData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const cards = [
    {
      title: "총 매출",
      value: `₩${(data.totalRevenue / 10000).toLocaleString()}만`,
      icon: DollarSign,
      description: "전체 기간 누적",
    },
    {
      title: "주문 수",
      value: data.orderCount.toLocaleString(),
      icon: ShoppingCart,
      description: "전체 주문 건수",
    },
    {
      title: "평균 주문 금액",
      value: `₩${data.averageOrderValue.toLocaleString()}`,
      icon: BarChart3,
      description: "주문당 평균",
    },
    {
      title: "성장률",
      value: `${data.growthRate > 0 ? "+" : ""}${data.growthRate}%`,
      icon: TrendingUp,
      description: "전월 대비",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
