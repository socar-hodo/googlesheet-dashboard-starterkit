'use client';

import { Button } from '@/components/ui/button';
import type { PeriodKey } from '@/lib/period-utils';
import { PERIOD_LABELS } from '@/lib/period-utils';

interface PeriodFilterProps {
  periods: PeriodKey[];
  active: PeriodKey;
  onChange: (p: PeriodKey) => void;
}

export function PeriodFilter({ periods, active, onChange }: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((p) => (
        <Button
          key={p}
          variant={active === p ? 'default' : 'outline'}
          size="sm"
          className={active === p ? 'shadow-[0_14px_24px_rgba(0,120,255,0.24)]' : ''}
          onClick={() => onChange(p)}
        >
          {PERIOD_LABELS[p]}
        </Button>
      ))}
    </div>
  );
}
