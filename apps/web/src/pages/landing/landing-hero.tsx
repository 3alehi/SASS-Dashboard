import { ArrowRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function LandingHero() {
  return (
    <section className="px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mx-auto">
            Now with real-time notifications &amp; audit logs
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Run your entire customer operation from one workspace.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            NEXORA brings customers, leads, deals, and support together — with the analytics and
            access controls a growing team actually needs.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/register">
                Start free
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">
                <PlayCircle />
                See how it works
              </a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required. Free plan available forever.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl" />
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <div className="ml-3 h-5 flex-1 max-w-xs rounded-md bg-background" />
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <div className="space-y-3 sm:col-span-1">
                <div className="h-24 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10" />
                <div className="h-16 rounded-lg bg-muted" />
                <div className="h-16 rounded-lg bg-muted" />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <div className="h-10 rounded-lg bg-muted" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-28 rounded-lg bg-gradient-to-br from-success/25 to-success/5" />
                  <div className="h-28 rounded-lg bg-gradient-to-br from-primary/25 to-primary/5" />
                  <div className="h-28 rounded-lg bg-gradient-to-br from-warning/25 to-warning/5" />
                </div>
                <div className="h-24 rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
