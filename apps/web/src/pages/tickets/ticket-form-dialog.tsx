import { zodResolver } from '@hookform/resolvers/zod';
import type { Ticket } from '@nexora/shared';
import { TICKET_PRIORITIES } from '@nexora/shared';
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
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useCreateTicket, useUpdateTicket } from '@/hooks/use-tickets';
import { useToast } from '@/hooks/use-toast';
import { ticketFormSchema, type TicketFormInput } from '@/schemas/ticket-form';

interface TicketFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket;
}

const DEFAULT_VALUES: TicketFormInput = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'OPEN',
  category: '',
};

export function TicketFormDialog({ open, onOpenChange, ticket }: TicketFormDialogProps) {
  const isEditing = Boolean(ticket);
  const { toast } = useToast();
  const createMutation = useCreateTicket();
  const updateMutation = useUpdateTicket();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 300);
  const { data: customerResults } = useCustomers({
    page: 1,
    pageSize: 10,
    search: debouncedCustomerSearch || undefined,
  });

  const defaultValues = useMemo<TicketFormInput>(() => DEFAULT_VALUES, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketFormInput>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        ticket
          ? {
              title: ticket.title,
              description: ticket.description ?? '',
              customerId: ticket.customerId ?? undefined,
              priority: ticket.priority,
              status: ticket.status,
              category: ticket.category ?? '',
            }
          : defaultValues,
      );
    }
  }, [open, ticket, reset, defaultValues]);

  async function onSubmit(values: TicketFormInput) {
    try {
      if (isEditing && ticket) {
        await updateMutation.mutateAsync({ ticketId: ticket.id, input: values });
        toast({ title: 'Ticket updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Ticket created' });
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

  const priority = watch('priority');
  const customerId = watch('customerId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit ticket' : 'New ticket'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this support ticket.' : 'Create a new support ticket.'}
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
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setValue('priority', value as TicketFormInput['priority'])
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register('category')} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...register('description')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEditing ? 'Save changes' : 'Create ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
