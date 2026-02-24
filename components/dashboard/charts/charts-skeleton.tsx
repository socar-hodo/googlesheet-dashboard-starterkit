// components/dashboard/charts/charts-skeleton.tsx
// 차트 영역 Suspense fallback — 4개 카드 높이 280px 스켈레턴

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** 차트 4개에 대응하는 Suspense 폴백 스켈레턴 컴포넌트 */
export function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            {/* 차트 제목 스켈레턴 */}
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            {/* 차트 본문 스켈레턴 */}
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
