import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <span className="text-sm font-bold">N</span>
            </div>
            <span className="text-base font-semibold tracking-tight">NEXORA</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">
                Start free
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Run your entire customer operation from one workspace.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            NEXORA brings customers, leads, deals, and support together — with the analytics and
            controls a growing team actually needs.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">
                Start free
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">View demo</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Full marketing site — pricing, features, testimonials — lands in Phase 18.
          </p>
        </div>
      </main>
    </div>
  );
}
