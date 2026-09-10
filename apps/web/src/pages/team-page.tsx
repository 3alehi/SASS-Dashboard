import { ASSIGNABLE_ROLES, type TeamMember } from '@nexora/shared';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Plus, Search, UserMinus, UserX, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/tables/data-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useDeactivateMember,
  useReactivateMember,
  useRemoveMember,
  useTeamMembers,
  useUpdateMemberRole,
} from '@/hooks/use-team';
import { useToast } from '@/hooks/use-toast';
import { InviteMemberDialog } from '@/pages/team/invite-member-dialog';
import { MemberStatusBadge } from '@/pages/team/member-status-badge';

export function TeamPage() {
  const { toast } = useToast();
  const { data: members, isLoading, isError, refetch } = useTeamMembers();
  const { role: currentUserRole } = usePermissions();

  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  const updateRole = useUpdateMemberRole();
  const deactivateMutation = useDeactivateMember();
  const reactivateMutation = useReactivateMember();
  const removeMutation = useRemoveMember();

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter(
      (member) =>
        member.fullName?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query),
    );
  }, [members, search]);

  async function handleRoleChange(member: TeamMember, role: (typeof ASSIGNABLE_ROLES)[number]) {
    try {
      await updateRole.mutateAsync({ memberId: member.id, input: { role } });
      toast({ title: 'Role updated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not update role',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleDeactivate(member: TeamMember) {
    try {
      await deactivateMutation.mutateAsync(member.id);
      toast({ title: 'Member deactivated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not deactivate member',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleReactivate(member: TeamMember) {
    try {
      await reactivateMutation.mutateAsync(member.id);
      toast({ title: 'Member reactivated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not reactivate member',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync(removeTarget.id);
      toast({ title: 'Member removed' });
      setRemoveTarget(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not remove member',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const columns = useMemo<ColumnDef<TeamMember, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Member',
        cell: ({ row }) => {
          const initials = (row.original.fullName ?? row.original.email ?? '?')
            .split(' ')
            .map((part) => part.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.original.fullName ?? row.original.email ?? 'Pending'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const member = row.original;
          if (member.role === 'OWNER') {
            return <Badge variant="outline">Owner</Badge>;
          }
          return (
            <Can permission="team.manage" fallback={<Badge variant="outline">{member.role}</Badge>}>
              <Select
                value={member.role}
                onValueChange={(value) =>
                  handleRoleChange(member, value as (typeof ASSIGNABLE_ROLES)[number])
                }
              >
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Can>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <MemberStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ row }) =>
          row.original.joinedAt ? format(new Date(row.original.joinedAt), 'MMM d, yyyy') : '—',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const member = row.original;
          if (member.role === 'OWNER') return null;

          return (
            <Can permission="team.manage">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Member actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {member.status === 'DEACTIVATED' ? (
                    <DropdownMenuItem onSelect={() => handleReactivate(member)}>
                      Reactivate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => handleDeactivate(member)}>
                      <UserX className="h-3.5 w-3.5" />
                      Deactivate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setRemoveTarget(member)}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Can>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserRole],
  );

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Team"
          description="Manage members, roles, and invitations for your organization."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage members, roles, and invitations for your organization."
        actions={
          <Can permission="team.manage">
            <Button onClick={() => setInviteOpen(true)}>
              <Plus />
              Invite member
            </Button>
          </Can>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredMembers}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Users}
            title={search ? 'No matching members' : 'No team members yet'}
            description={
              search ? 'Try a different search.' : 'Invite your first teammate to get started.'
            }
          />
        }
      />

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove this member?"
        description={`"${removeTarget?.fullName ?? removeTarget?.email}" will lose access to this organization immediately.`}
        confirmLabel="Remove"
        loading={removeMutation.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}
