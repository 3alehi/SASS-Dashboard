import type { TicketMessage } from '@nexora/shared';

import { supabaseAdmin } from '@/lib/supabase-admin.js';

interface TicketMessageRow {
  id: string;
  organization_id: string;
  ticket_id: string;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

function toMessage(row: TicketMessageRow): TicketMessage {
  const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    organizationId: row.organization_id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorName: author?.full_name ?? null,
    body: row.body,
    isInternal: row.is_internal,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS = '*, profiles!ticket_messages_author_id_fkey(full_name)';

/**
 * Every message on a ticket, in chronological order. Internal notes
 * (is_internal=true) are included here — the caller must already have
 * tickets.read (support-staff-only), so internal-note visibility is
 * equivalent to ticket visibility. If a customer-facing portal is ever
 * added, that surface must call a separate, filtered query rather than
 * relaxing this one.
 */
export async function listTicketMessages(
  organizationId: string,
  ticketId: string,
): Promise<TicketMessage[]> {
  const { data, error } = await supabaseAdmin
    .from('ticket_messages')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return (data as unknown as TicketMessageRow[]).map(toMessage);
}

export async function createTicketMessage(
  organizationId: string,
  ticketId: string,
  authorId: string,
  body: string,
  isInternal: boolean,
): Promise<TicketMessage> {
  const { data, error } = await supabaseAdmin
    .from('ticket_messages')
    .insert({
      organization_id: organizationId,
      ticket_id: ticketId,
      author_id: authorId,
      body,
      is_internal: isInternal,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create ticket message: ${error?.message}`);
  }

  return toMessage(data as unknown as TicketMessageRow);
}
