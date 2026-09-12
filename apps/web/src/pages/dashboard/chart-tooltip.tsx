import type { TooltipProps } from 'recharts';

interface ChartTooltipRow {
  label: string;
  value: string;
  color: string;
}

interface ChartTooltipContentProps {
  title: string;
  rows: ChartTooltipRow[];
}

/**
 * Shared tooltip shell per the dataviz skill: value leads (strong/high
 * contrast), series name is secondary, each row is keyed with a short
 * stroke of the series color rather than a filled box. React sets text via
 * props, never innerHTML, so series/category names from API data are never
 * interpreted as markup.
 */
export function ChartTooltipContent({ title, rows }: ChartTooltipContentProps) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-panel">
      <p className="mb-1.5 font-medium text-foreground">{title}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
              aria-hidden
            />
            <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
            <span className="text-muted-foreground">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { TooltipProps };
