import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateOrganizationSchema,
  updateOrganizationSettingsSchema,
  type UpdateOrganizationInput,
  type UpdateOrganizationSettingsInput,
} from '@nexora/shared';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useOrganization,
  useOrganizationSettings,
  useUpdateOrganization,
  useUpdateOrganizationSettings,
} from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
] as const;

const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function OrganizationProfileForm() {
  const { data: organization, isLoading } = useOrganization();
  const updateMutation = useUpdateOrganization();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOrganizationInput>({ resolver: zodResolver(updateOrganizationSchema) });

  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name,
        industry: organization.industry ?? '',
        size: organization.size ?? '',
        website: organization.website ?? '',
        billingEmail: organization.billingEmail ?? '',
      });
    }
  }, [organization, reset]);

  async function onSubmit(values: UpdateOrganizationInput) {
    try {
      await updateMutation.mutateAsync(values);
      toast({ title: 'Organization updated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not update organization',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  if (isLoading || !organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Company details and workspace configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Company details and workspace configuration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Organization name</Label>
              <Input id="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
              <FormError message={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Workspace URL</Label>
              <Input id="slug" value={organization.slug} disabled />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g. Software"
                aria-invalid={Boolean(errors.industry)}
                {...register('industry')}
              />
              <FormError message={errors.industry?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="size">Company size</Label>
              <Input
                id="size"
                placeholder="e.g. 11-50 employees"
                aria-invalid={Boolean(errors.size)}
                {...register('size')}
              />
              <FormError message={errors.size?.message} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                aria-invalid={Boolean(errors.website)}
                {...register('website')}
              />
              <FormError message={errors.website?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="billingEmail">Billing email</Label>
              <Input
                id="billingEmail"
                type="email"
                placeholder="billing@example.com"
                aria-invalid={Boolean(errors.billingEmail)}
                {...register('billingEmail')}
              />
              <FormError message={errors.billingEmail?.message} />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function OrganizationPreferencesForm() {
  const { data: settings, isLoading } = useOrganizationSettings();
  const updateMutation = useUpdateOrganizationSettings();
  const { toast } = useToast();

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<UpdateOrganizationSettingsInput>({
    resolver: zodResolver(updateOrganizationSettingsSchema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        defaultCurrency: settings.defaultCurrency,
        fiscalYearStart: settings.fiscalYearStart,
        dateFormat: settings.dateFormat,
      });
    }
  }, [settings, reset]);

  async function onSubmit(values: UpdateOrganizationSettingsInput) {
    try {
      await updateMutation.mutateAsync(values);
      toast({ title: 'Preferences updated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not update preferences',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  if (isLoading || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Currency, fiscal year, and date formatting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentDateFormat = watch('dateFormat') ?? settings.dateFormat;
  const currentFiscalMonth = watch('fiscalYearStart') ?? settings.fiscalYearStart;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Currency, fiscal year, and date formatting.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="defaultCurrency">Default currency</Label>
              <Input
                id="defaultCurrency"
                maxLength={3}
                placeholder="USD"
                defaultValue={settings.defaultCurrency}
                onChange={(event) =>
                  setValue('defaultCurrency', event.target.value.toUpperCase(), {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fiscal year start</Label>
              <Select
                value={String(currentFiscalMonth)}
                onValueChange={(value) =>
                  setValue('fiscalYearStart', Number(value), { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date format</Label>
              <Select
                value={currentDateFormat}
                onValueChange={(value) =>
                  setValue('dateFormat', value as UpdateOrganizationSettingsInput['dateFormat'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save preferences
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function OrganizationSettingsPage() {
  return (
    <div className="space-y-6">
      <OrganizationProfileForm />
      <OrganizationPreferencesForm />
    </div>
  );
}
