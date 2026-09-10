import type { Lead } from '@nexora/shared';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConvertLead } from '@/hooks/use-leads';
import { useToast } from '@/hooks/use-toast';

interface LeadConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function LeadConvertDialog({ open, onOpenChange, lead }: LeadConvertDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const convertMutation = useConvertLead();

  async function handleConvert() {
    try {
      const result = await convertMutation.mutateAsync({
        leadId: lead.id,
        input: { createDeal: false },
      });
      toast({ title: 'Lead converted', description: `${lead.fullName} is now a customer.` });
      onOpenChange(false);
      navigate(`/app/customers/${result.customerId}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not convert lead',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert lead to customer</DialogTitle>
          <DialogDescription>
            This creates a customer and primary contact from {lead.fullName}&apos;s information, and
            marks the lead as won. The original lead record is preserved for history.
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Creating a deal at the same time will be available once the Pipeline module ships.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={convertMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={convertMutation.isPending}>
            {convertMutation.isPending && <Loader2 className="animate-spin" />}
            Convert to customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
