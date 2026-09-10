import { zodResolver } from '@hookform/resolvers/zod';
import { createTicketMessageSchema, type CreateTicketMessageInput } from '@nexora/shared';
import { format } from 'date-fns';
import { Loader2, Lock, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTicketMessage, useTicketMessages } from '@/hooks/use-tickets';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function TicketConversation({ ticketId }: { ticketId: string }) {
  const { data: messages, isLoading } = useTicketMessages(ticketId);
  const createMessage = useCreateTicketMessage();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketMessageInput>({
    resolver: zodResolver(createTicketMessageSchema),
    defaultValues: { body: '', isInternal: false },
  });

  const isInternal = watch('isInternal');

  async function onSubmit(values: CreateTicketMessageInput) {
    try {
      await createMessage.mutateAsync({ ticketId, input: values });
      reset({ body: '', isInternal: false });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not send message',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {(messages ?? []).map((message) => (
          <Card
            key={message.id}
            className={cn(message.isInternal && 'border-warning/40 bg-warning/5')}
          >
            <CardContent className="space-y-1.5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {message.authorName ?? 'Unknown'}
                </span>
                <div className="flex items-center gap-2">
                  {message.isInternal && (
                    <span className="flex items-center gap-1 text-xs font-medium text-warning">
                      <Lock className="h-3 w-3" />
                      Internal note
                    </span>
                  )}
                  <time className="text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), 'MMM d, yyyy · h:mm a')}
                  </time>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{message.body}</p>
            </CardContent>
          </Card>
        ))}
        {(messages ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-2 rounded-lg border border-border p-3"
      >
        <Textarea
          rows={3}
          placeholder={
            isInternal
              ? 'Add an internal note (not visible to the customer)…'
              : 'Reply to this ticket…'
          }
          aria-invalid={Boolean(errors.body)}
          {...register('body')}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch
              checked={isInternal}
              onCheckedChange={(checked) => setValue('isInternal', checked)}
            />
            Internal note
          </label>
          <Button type="submit" size="sm" disabled={createMessage.isPending}>
            {createMessage.isPending ? <Loader2 className="animate-spin" /> : <Send />}
            {isInternal ? 'Add note' : 'Send reply'}
          </Button>
        </div>
      </form>
    </div>
  );
}
