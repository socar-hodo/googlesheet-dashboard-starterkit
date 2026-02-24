// DataTableSkeleton — 테이블 로딩 중 스켈레톤 플레이스홀더
import { Skeleton } from '@/components/ui/skeleton';

/** DataTable Suspense fallback용 스켈레톤 컴포넌트 */
export function DataTableSkeleton() {
  return (
    <div className="w-full">
      {/* 헤더 스켈레톤 */}
      <Skeleton className="h-8 w-full rounded mb-2" />
      {/* 데이터 행 스켈레톤 — 8행 */}
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-6 w-full rounded mb-1" />
      ))}
    </div>
  );
}
