import type { NotificationPreferenceKey } from '@nexora/shared';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notifications';

const PREFERENCE_ROWS: Array<{
  key: NotificationPreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: 'taskAssigned',
    label: 'Task assigned',
    description: 'When someone assigns a task to you.',
  },
  {
    key: 'taskDue',
    label: 'Task due',
    description: 'When a task assigned to you is approaching its due date.',
  },
  {
    key: 'dealUpdated',
    label: 'Deal updated',
    description: 'When a deal you own moves stage or changes.',
  },
  {
    key: 'leadAssigned',
    label: 'Lead assigned',
    description: 'When a lead is assigned to you.',
  },
  {
    key: 'ticketAssigned',
    label: 'Ticket assigned',
    description: 'When a support ticket is assigned to you.',
  },
  {
    key: 'mention',
    label: 'Mentions',
    description: 'When someone mentions you in a comment.',
  },
];

export function NotificationsSettingsPage() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose which events notify you and how.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !preferences ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {PREFERENCE_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <Label htmlFor={row.key} className="text-sm font-medium">
                    {row.label}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.description}</p>
                </div>
                <Switch
                  id={row.key}
                  checked={preferences[row.key]}
                  onCheckedChange={(checked) => updatePreferences.mutate({ [row.key]: checked })}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
