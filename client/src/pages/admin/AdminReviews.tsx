import { useState } from 'react';
import { Check, Trash2, Star } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import { formatDate } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import Reveal from '@/components/motion/Reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const FILTERS = [
  { label: 'Pending', value: 'pending' as const },
  { label: 'Approved', value: 'approved' as const },
  { label: 'All', value: 'all' as const },
];

export default function AdminReviews() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'all'>('pending');
  const utils = trpc.useUtils();
  const { data: reviews, isLoading } = trpc.reviews.adminList.useQuery({ status });

  const invalidate = () => utils.reviews.adminList.invalidate();
  const approveReview = trpc.reviews.approve.useMutation({ onSuccess: invalidate });
  const removeReview = trpc.reviews.remove.useMutation({ onSuccess: invalidate });

  const handleApprove = async (id: number) => {
    try {
      await approveReview.mutateAsync({ id });
    } catch (err) {
      alert(err instanceof TRPCClientError ? err.message : 'Could not approve this review.');
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await removeReview.mutateAsync({ id });
    } catch (err) {
      alert(err instanceof TRPCClientError ? err.message : 'Could not delete this review.');
    }
  };

  return (
    <AdminLayout>
      <Reveal className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <span className="label-caps mb-2 block">Guest Feedback</span>
          <h1 className="font-serif text-4xl">Moderate Reviews</h1>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={cn(
                'px-4 py-2 rounded-sm label-caps !text-[10px] border transition-colors',
                status === f.value
                  ? 'bg-accent !text-accent-foreground border-accent'
                  : 'bg-white/5 !text-muted-foreground border-white/10 hover:!text-foreground hover:border-white/20',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel p-6">
              <Skeleton className="h-5 w-1/3 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <Reveal key={review.id} delay={Math.min(i * 0.06, 0.3)}>
              <div className="glass-panel p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold">{review.hotel.name}</p>
                      <span
                        className={`px-2 py-0.5 rounded-sm text-xs font-semibold ${
                          review.approved ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'
                        }`}
                      >
                        {review.approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {review.user?.name ?? 'Guest'} ({review.user?.email}) · {formatDate(review.createdAt)}
                    </p>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, starIndex) => (
                        <Star key={starIndex} size={16} className={starIndex < review.rating ? 'fill-accent text-accent' : 'text-muted'} />
                      ))}
                    </div>
                    <p className="text-foreground text-sm">{review.comment}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!review.approved && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={approveReview.isPending}
                        className="p-2 rounded-md hover:bg-white/5 transition-colors text-green-400"
                        title="Approve"
                      >
                        <Check size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(review.id)}
                      disabled={removeReview.isPending}
                      className="p-2 rounded-md hover:bg-white/5 transition-colors text-destructive"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-6">
          <p className="text-muted-foreground text-center py-12">No {status !== 'all' ? status : ''} reviews.</p>
        </div>
      )}
    </AdminLayout>
  );
}
