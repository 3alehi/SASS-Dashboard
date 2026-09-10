import { zodResolver } from '@hookform/resolvers/zod';
import type { Customer } from '@nexora/shared';
import { CUSTOMER_STATUSES } from '@nexora/shared';
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
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { useToast } from '@/hooks/use-toast';
import { customerFormSchema, type CustomerFormInput } from '@/schemas/customer-form';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}

const DEFAULT_VALUES: CustomerFormInput = {
  name: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  status: 'ACTIVE',
  source: '',
  industry: '',
  value: 0,
  notes: '',
};

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const isEditing = Boolean(customer);
  const { toast } = useToast();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        customer
          ? {
              name: customer.name,
              company: customer.company ?? '',
              email: customer.email ?? '',
              phone: customer.phone ?? '',
              website: customer.website ?? '',
              status: customer.status,
              source: customer.source ?? '',
              industry: customer.industry ?? '',
              value: customer.value,
              notes: customer.notes ?? '',
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, customer, reset]);

  async function onSubmit(values: CustomerFormInput) {
    try {
      if (isEditing && customer) {
        await updateMutation.mutateAsync({ customerId: customer.id, input: values });
        toast({ title: 'Customer updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Customer created' });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit customer' : 'New customer'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this customer’s information.'
              : 'Add a new customer to your organization.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
              <FormError message={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...register('company')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as CustomerFormInput['status'])}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_STATUSES.map((option) => (
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
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register('website')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" {...register('industry')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Input id="source" {...register('source')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">Value ($)</Label>
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
              {isEditing ? 'Save changes' : 'Create customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
