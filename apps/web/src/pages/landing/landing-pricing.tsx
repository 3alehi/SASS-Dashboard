import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PricingTier {
  plan: 'FREE' | 'PRO' | 'BUSINESS';
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const TIERS: PricingTier[] = [
  {
    plan: 'FREE',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'For individuals and small teams just getting started.',
    features: [
      'Up to 3 team members',
      '250 customer records',
      'Lead & deal pipelines',
      'Basic task management',
      'Community support',
    ],
  },
  {
    plan: 'PRO',
    name: 'Pro',
    price: '$29',
    cadence: 'per user / month',
    description: 'For growing teams that need more power and visibility.',
    features: [
      'Unlimited team members',
      'Unlimited customer records',
      'Support ticketing system',
      'Real-time notifications',
      'Analytics dashboard',
      'Audit logs',
      'Priority email support',
    ],
    popular: true,
  },
  {
    plan: 'BUSINESS',
    name: 'Business',
    price: '$79',
    cadence: 'per user / month',
    description: 'For organizations that need control and scale.',
    features: [
      'Everything in Pro',
      'Role-based access control',
      'Advanced audit trail',
      'Custom roles & permissions',
      'Dedicated onboarding',
      '24/7 priority support',
    ],
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="border-t border-border px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start for free. Upgrade as your team and pipeline grow.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <Card
              key={tier.plan}
              className={cn('relative flex flex-col', tier.popular && 'border-primary shadow-md')}
            >
              {tier.popular ? (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
              ) : null}
              <CardHeader>
                <p className="text-sm font-medium text-muted-foreground">{tier.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">/ {tier.cadence}</span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={tier.popular ? 'default' : 'outline'} asChild>
                  <Link to="/register">
                    {tier.plan === 'FREE' ? 'Start free' : `Choose ${tier.name}`}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
