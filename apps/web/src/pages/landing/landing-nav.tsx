import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#docs', label: 'Docs' },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
            <span className="text-sm font-bold">N</span>
          </div>
          <span className="text-base font-semibold tracking-tight">NEXORA</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
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

      <nav className="flex items-center gap-4 overflow-x-auto border-t border-border px-6 py-2 md:hidden">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
