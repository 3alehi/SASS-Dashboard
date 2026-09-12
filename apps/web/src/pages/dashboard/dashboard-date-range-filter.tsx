import type { DashboardQuery, DateRangePreset } from '@nexora/shared';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PRESET_LABELS: Record<DateRangePreset, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  this_year: 'This year',
  custom: 'Custom range',
};

const PRESET_ORDER: DateRangePreset[] = ['7d', '30d', '90d', 'this_year', 'custom'];

interface DashboardDateRangeFilterProps {
  value: DashboardQuery;
  onChange: (next: DashboardQuery) => void;
}

export function DashboardDateRangeFilter({ value, onChange }: DashboardDateRangeFilterProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Select
        value={value.preset}
        onValueChange={(preset) => onChange({ ...value, preset: preset as DateRangePreset })}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESET_ORDER.map((preset) => (
            <SelectItem key={preset} value={preset}>
              {PRESET_LABELS[preset]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-40"
            value={value.from ?? ''}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            className="w-40"
            value={value.to ?? ''}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={value.compare}
          onChange={(event) => onChange({ ...value, compare: event.target.checked })}
        />
        Compare to previous period
      </label>
    </div>
  );
}
