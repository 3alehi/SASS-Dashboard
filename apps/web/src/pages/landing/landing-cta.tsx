import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function LandingCta() {
  return (
    <section className="border-t border-border px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground sm:px-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to bring it all together?
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80">
          Join teams who run their customers, deals, and support from a single workspace.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/register">
              Start free
              <ArrowRight />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            asChild
          >
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
