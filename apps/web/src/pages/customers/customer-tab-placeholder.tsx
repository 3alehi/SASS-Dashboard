import type { LucideIcon } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

export function CustomerTabPlaceholder({
  icon,
  title,
  phaseLabel,
}: {
  icon: LucideIcon;
  title: string;
  phaseLabel: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={`${title} coming in ${phaseLabel}`}
      description={`This tab is scaffolded and ready — full functionality lands in ${phaseLabel}.`}
    />
  );
}
