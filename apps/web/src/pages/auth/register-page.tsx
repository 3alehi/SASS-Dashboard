import { Link } from 'react-router-dom';

import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Start your free NEXORA workspace"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Amir Salehi" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full">
          Create account
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to NEXORA&apos;s Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
