import { ArrowRightLeft, CheckCircle2, Mail, Phone, Tag, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useLead } from '@/hooks/use-leads';
import { LeadConvertDialog } from '@/pages/leads/lead-convert-dialog';
import { LeadFormDialog } from '@/pages/leads/lead-form-dialog';
import { LeadStatusBadge } from '@/pages/leads/lead-status-badge';

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

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading, isError, refetch } = useLead(id);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !lead) {
    return <ErrorState title="Couldn't load this lead" onRetry={() => refetch()} />;
  }

  const isConverted = Boolean(lead.convertedCustomerId);

  return (
    <div>
      <Breadcrumb
        items={[{ label: 'Leads', href: '/app/leads' }, { label: lead.fullName }]}
        className="mb-3"
      />
      <PageHeader
        title={lead.fullName}
        description={lead.company ?? undefined}
        actions={
          <>
            <LeadStatusBadge status={lead.status} />
            <Can permission="leads.update">
              <Button variant="outline" onClick={() => setEditOpen(true)} disabled={isConverted}>
                Edit
              </Button>
            </Can>
            {!isConverted && (
              <Can anyOf={['leads.update', 'customers.create']}>
                <Button onClick={() => setConvertOpen(true)}>
                  <ArrowRightLeft />
                  Convert to customer
                </Button>
              </Can>
            )}
          </>
        }
      />

      {isConverted && (
        <Alert variant="success" className="mb-6">
          <CheckCircle2 />
          <AlertDescription>
            This lead was converted to a customer.{' '}
            <Link
              to={`/app/customers/${lead.convertedCustomerId}`}
              className="font-medium underline"
            >
              View customer
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lead.email && <InfoRow icon={Mail} label="Email" value={lead.email} />}
            {lead.phone && <InfoRow icon={Phone} label="Phone" value={lead.phone} />}
            {lead.source && <InfoRow icon={Tag} label="Source" value={lead.source} />}
            {lead.ownerId && <InfoRow icon={User} label="Owner" value={lead.ownerId} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.value !== null && (
              <div>
                <p className="text-xs text-muted-foreground">Estimated value</p>
                <p className="text-lg font-semibold">
                  {lead.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {lead.notes && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lead.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
      <LeadConvertDialog open={convertOpen} onOpenChange={setConvertOpen} lead={lead} />
    </div>
  );
}
