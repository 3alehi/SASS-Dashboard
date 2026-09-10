import { zodResolver } from '@hookform/resolvers/zod';
import type { Task } from '@nexora/shared';
import { TASK_PRIORITIES, TASK_STATUSES } from '@nexora/shared';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
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
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { useToast } from '@/hooks/use-toast';
import { taskFormSchema, type TaskFormInput } from '@/schemas/task-form';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  defaultStatus?: TaskFormInput['status'];
}

export function TaskFormDialog({ open, onOpenChange, task, defaultStatus }: TaskFormDialogProps) {
  const isEditing = Boolean(task);
  const { toast } = useToast();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const defaultValues = useMemo<TaskFormInput>(
    () => ({
      title: '',
      description: '',
      status: defaultStatus ?? 'OPEN',
      priority: 'MEDIUM',
      dueDate: '',
    }),
    [defaultStatus],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        task
          ? {
              title: task.title,
              description: task.description ?? '',
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
              assigneeId: task.assigneeId ?? undefined,
              customerId: task.customerId ?? undefined,
              dealId: task.dealId ?? undefined,
            }
          : defaultValues,
      );
    }
  }, [open, task, reset, defaultValues]);

  async function onSubmit(values: TaskFormInput) {
    try {
      if (isEditing && task) {
        await updateMutation.mutateAsync({ taskId: task.id, input: values });
        toast({ title: 'Task updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Task created' });
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
  const priority = watch('priority');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update this task.' : 'Add a new task to track.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" aria-invalid={Boolean(errors.title)} {...register('title')} />
              <FormError message={errors.title?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as TaskFormInput['status'])}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue('priority', value as TaskFormInput['priority'])}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
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
              {isEditing ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
