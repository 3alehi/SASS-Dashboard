import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  timestamp: string;
  iconClassName?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="relative space-y-6 pl-6">
      <div className="absolute bottom-2 left-[9px] top-2 w-px bg-border" aria-hidden />
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="relative">
            <div
              className={cn(
                'absolute -left-6 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-background bg-muted',
                item.iconClassName,
              )}
            >
              <Icon className="h-2.5 w-2.5" />
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <time className="shrink-0 text-xs text-muted-foreground">
                {format(new Date(item.timestamp), 'MMM d, yyyy · h:mm a')}
              </time>
            </div>
            {item.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
