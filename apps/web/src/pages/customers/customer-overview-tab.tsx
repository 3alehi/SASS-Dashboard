import type { Customer } from '@nexora/shared';
import { format } from 'date-fns';
import { Building2, Globe, Mail, Phone, Tag, User } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerStatusBadge } from '@/pages/customers/customer-status-badge';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function CustomerOverviewTab({ customer }: { customer: Customer }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {customer.company && (
            <InfoRow icon={Building2} label="Company" value={customer.company} />
          )}
          {customer.email && <InfoRow icon={Mail} label="Email" value={customer.email} />}
          {customer.phone && <InfoRow icon={Phone} label="Phone" value={customer.phone} />}
          {customer.website && <InfoRow icon={Globe} label="Website" value={customer.website} />}
          {customer.industry && <InfoRow icon={Tag} label="Industry" value={customer.industry} />}
          {customer.source && <InfoRow icon={User} label="Source" value={customer.source} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1">
              <CustomerStatusBadge status={customer.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lifetime value</p>
            <p className="text-lg font-semibold">
              {customer.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customer since</p>
            <p className="text-sm">{format(new Date(customer.createdAt), 'MMMM d, yyyy')}</p>
          </div>
          {customer.lastActivityAt && (
            <div>
              <p className="text-xs text-muted-foreground">Last activity</p>
              <p className="text-sm">{format(new Date(customer.lastActivityAt), 'MMMM d, yyyy')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {customer.notes && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{customer.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
