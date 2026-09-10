import { zodResolver } from '@hookform/resolvers/zod';
import type { Lead } from '@nexora/shared';
import { LEAD_SOURCES, LEAD_STATUSES } from '@nexora/shared';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads';
import { useToast } from '@/hooks/use-toast';
import { leadFormSchema, type LeadFormInput } from '@/schemas/lead-form';

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
}

const DEFAULT_VALUES: LeadFormInput = {
  fullName: '',
  company: '',
  email: '',
  phone: '',
  status: 'NEW',
  source: '',
  notes: '',
};

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const isEditing = Boolean(lead);
  const { toast } = useToast();
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        lead
          ? {
              fullName: lead.fullName,
              company: lead.company ?? '',
              email: lead.email ?? '',
              phone: lead.phone ?? '',
              status: lead.status,
              source: lead.source ?? '',
              value: lead.value ?? undefined,
              notes: lead.notes ?? '',
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, lead, reset]);

  async function onSubmit(values: LeadFormInput) {
    try {
      if (isEditing && lead) {
        await updateMutation.mutateAsync({ leadId: lead.id, input: values });
        toast({ title: 'Lead updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Lead created' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const status = watch('status');
  const source = watch('source');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit lead' : 'New lead'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this lead’s information.' : 'Add a new lead to your funnel.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                aria-invalid={Boolean(errors.fullName)}
                {...register('fullName')}
              />
              <FormError message={errors.fullName?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...register('company')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as LeadFormInput['status'])}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              <FormError message={errors.email?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={(value) => setValue('source', value)}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">Estimated value ($)</Label>
              <Input id="value" type="number" min={0} step="0.01" {...register('value')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...register('notes')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEditing ? 'Save changes' : 'Create lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
