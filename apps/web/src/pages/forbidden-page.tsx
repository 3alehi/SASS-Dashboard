import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <ShieldAlert className="h-10 w-10 text-destructive" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view this page. Contact your organization admin if you
          think this is a mistake.
        </p>
      </div>
      <Button asChild>
        <Link to="/app/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
