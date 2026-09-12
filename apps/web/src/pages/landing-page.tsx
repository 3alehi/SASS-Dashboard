import { LandingCta } from '@/pages/landing/landing-cta';
import { LandingFeatures } from '@/pages/landing/landing-features';
import { LandingFooter } from '@/pages/landing/landing-footer';
import { LandingHero } from '@/pages/landing/landing-hero';
import { LandingNav } from '@/pages/landing/landing-nav';
import { LandingPricing } from '@/pages/landing/landing-pricing';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
