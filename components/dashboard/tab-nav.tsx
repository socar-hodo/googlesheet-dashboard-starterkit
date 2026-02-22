'use client';

// 탭 전환 Client Component — URL searchParams로 탭 상태 관리
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabNavProps {
  activeTab: 'daily' | 'weekly';
}

export function TabNav({ activeTab }: TabNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    // scroll: false — 탭 전환 시 스크롤 위치 유지
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="daily">일별</TabsTrigger>
        <TabsTrigger value="weekly">주차별</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
