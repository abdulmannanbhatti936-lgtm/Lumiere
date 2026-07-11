import { useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import Reveal from '@/components/motion/Reveal';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({ page, limit: 20 });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change this user's role to "${nextRole}"?`)) return;
    try {
      await updateRole.mutateAsync({ userId, role: nextRole });
      toast.success(`Role updated to ${nextRole}.`);
    } catch (err) {
      toast.error(err instanceof TRPCClientError ? err.message : 'Could not update this user.');
    }
  };

  return (
    <AdminLayout>
      <Reveal className="mb-8">
        <span className="label-caps mb-2 block">Accounts</span>
        <h1 className="font-serif text-4xl">Manage Users</h1>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass-panel p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Joined</th>
                    <th className="text-right py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/60 transition-colors">
                      <td className="py-4 px-4 font-semibold">{user.name ?? '—'}</td>
                      <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-sm text-xs font-semibold capitalize ${
                            user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="py-4 px-4 text-right">
                        {user.id === currentUser?.id ? (
                          <span className="label-caps !text-[9px] !text-muted-foreground">You</span>
                        ) : (
                          <button
                            onClick={() => handleToggleRole(user.id, user.role)}
                            disabled={updateRole.isPending}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                            title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                          >
                            {user.role === 'admin' ? <Shield size={16} /> : <ShieldCheck size={16} />}
                            {user.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No users yet.</p>
          )}
        </div>
      </Reveal>

      <div className="flex items-center justify-center gap-6 mt-10">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="btn-secondary flex items-center gap-2 disabled:opacity-40"
        >
          <ChevronLeft size={18} /> Prev
        </button>
        <span className="label-caps !text-[10px]">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!users || users.length < 20}
          className="btn-secondary flex items-center gap-2 disabled:opacity-40"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </AdminLayout>
  );
}
