import {
  BellRing,
  KanbanSquare,
  LifeBuoy,
  ListChecks,
  ScrollText,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Users,
    title: 'Customer & contact management',
    description: 'Keep every account, contact, and interaction organized in one searchable place.',
  },
  {
    icon: KanbanSquare,
    title: 'Sales pipeline & deals',
    description: 'Visualize deals on a drag-and-drop Kanban board and track them to close.',
  },
  {
    icon: ListChecks,
    title: 'Lead pipeline & conversion',
    description: 'Capture, qualify, and convert leads with a pipeline built for follow-through.',
  },
  {
    icon: LifeBuoy,
    title: 'Support tickets',
    description: 'Resolve customer issues faster with a dedicated ticketing workflow.',
  },
  {
    icon: BellRing,
    title: 'Real-time notifications',
    description: 'Stay on top of what matters with instant updates across your team.',
  },
  {
    icon: Search,
    title: 'Global search',
    description: 'Find any customer, deal, lead, or ticket in seconds from anywhere in the app.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access control',
    description: 'Grant the right level of access to every teammate with granular permissions.',
  },
  {
    icon: ScrollText,
    title: 'Audit logs',
    description: 'Track every change across your organization with a complete, searchable trail.',
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-border px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your team needs to grow
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            NEXORA replaces a pile of disconnected tools with one workspace built for sales,
            support, and everyone in between.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-sm">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
