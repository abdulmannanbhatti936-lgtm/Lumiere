import { useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'completed'] as const;

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-400/20 text-yellow-400',
  confirmed: 'bg-green-400/20 text-green-400',
  cancelled: 'bg-muted text-muted-foreground',
  completed: 'bg-blue-400/20 text-blue-400',
};

export default function AdminBookings() {
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();
  const { data: bookings, isLoading } = trpc.bookings.adminList.useQuery({ page, limit: 20 });

  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => utils.bookings.adminList.invalidate(),
  });

  const handleStatusChange = async (id: number, status: (typeof STATUS_OPTIONS)[number]) => {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (err) {
      alert(err instanceof TRPCClientError ? err.message : 'Could not update booking status.');
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-4xl font-bold mb-8">Manage Bookings</h1>

      <div className="card-luxury">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Hotel / Room</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Guest</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Dates</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-semibold">{booking.hotel.name}</p>
                      <p className="text-xs text-muted-foreground">{booking.room.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p>{booking.guestName}</p>
                      <p className="text-xs text-muted-foreground">{booking.guestEmail}</p>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {booking.checkIn} → {booking.checkOut}
                    </td>
                    <td className="py-4 px-4 font-semibold">{formatCurrency(Number(booking.totalPrice))}</td>
                    <td className="py-4 px-4">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value as (typeof STATUS_OPTIONS)[number])}
                        disabled={updateStatus.isPending}
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border-0 cursor-pointer ${STATUS_BADGE[booking.status] ?? ''}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No bookings yet.</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <ChevronLeft size={18} /> Prev
        </button>
        <span className="text-muted-foreground text-sm">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!bookings || bookings.length < 20}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </AdminLayout>
  );
}
