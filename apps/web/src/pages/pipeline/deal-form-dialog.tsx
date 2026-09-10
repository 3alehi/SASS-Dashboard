import { zodResolver } from '@hookform/resolvers/zod';
import type { Deal, Pipeline } from '@nexora/shared';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { useCustomers } from '@/hooks/use-customers';
import { useCreateDeal, useUpdateDeal } from '@/hooks/use-deals';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useToast } from '@/hooks/use-toast';
import { dealFormSchema, type DealFormInput } from '@/schemas/deal-form';

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
  deal?: Deal;
  defaultStageId?: string;
}

export function DealFormDialog({
  open,
  onOpenChange,
  pipeline,
  deal,
  defaultStageId,
}: DealFormDialogProps) {
  const isEditing = Boolean(deal);
  const { toast } = useToast();
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 300);
  const { data: customerResults } = useCustomers({
    page: 1,
    pageSize: 10,
    search: debouncedCustomerSearch || undefined,
  });

  const defaultValues = useMemo<DealFormInput>(
    () => ({
      title: '',
      pipelineId: pipeline.id,
      stageId: defaultStageId ?? pipeline.stages[0]?.id ?? '',
      value: 0,
      expectedCloseDate: '',
      notes: '',
    }),
    [pipeline, defaultStageId],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormInput>({
    resolver: zodResolver(dealFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        deal
          ? {
              title: deal.title,
              customerId: deal.customerId ?? undefined,
              pipelineId: deal.pipelineId,
              stageId: deal.stageId,
              value: deal.value,
              probability: deal.probability,
              expectedCloseDate: deal.expectedCloseDate ?? '',
              notes: deal.notes ?? '',
            }
          : defaultValues,
      );
    }
  }, [open, deal, reset, defaultValues]);

  async function onSubmit(values: DealFormInput) {
    try {
      if (isEditing && deal) {
        await updateMutation.mutateAsync({ dealId: deal.id, input: values });
        toast({ title: 'Deal updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Deal created' });
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

  const stageId = watch('stageId');
  const customerId = watch('customerId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit deal' : 'New deal'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this deal.' : `Add a new deal to ${pipeline.name}.`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" aria-invalid={Boolean(errors.title)} {...register('title')} />
              <FormError message={errors.title?.message} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={customerId ?? ''}
                onValueChange={(value) => setValue('customerId', value)}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Search customers…" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-1">
                    <Input
                      placeholder="Type to search…"
                      value={customerSearch}
                      onChange={(event) => setCustomerSearch(event.target.value)}
                      onKeyDown={(event) => event.stopPropagation()}
                    />
                  </div>
                  {customerResults?.items.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <Select value={stageId} onValueChange={(value) => setValue('stageId', value)}>
                <SelectTrigger id="stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipeline.stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="value">Value ($)</Label>
              <Input id="value" type="number" min={0} step="0.01" {...register('value')} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="expectedCloseDate">Expected close date</Label>
              <Input id="expectedCloseDate" type="date" {...register('expectedCloseDate')} />
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
              {isEditing ? 'Save changes' : 'Create deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
