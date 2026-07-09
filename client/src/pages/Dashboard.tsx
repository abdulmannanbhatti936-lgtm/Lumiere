import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarCheck, DollarSign, Percent, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/admin/AdminLayout';
import Reveal from '@/components/motion/Reveal';
import AnimatedCounter from '@/components/motion/AnimatedCounter';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning-bg text-warning-text',
  confirmed: 'bg-success-bg text-success-text',
  cancelled: 'bg-muted text-muted-foreground',
  completed: 'bg-primary/10 text-primary',
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E7E1D3',
  borderRadius: '10px',
  color: '#1E2233',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: trend, isLoading: trendLoading } = trpc.admin.monthlyTrend.useQuery();
  const { data: recentBookings, isLoading: bookingsLoading } = trpc.bookings.adminList.useQuery({ page: 1, limit: 8 });

  const kpis = [
    { label: 'Total bookings', value: stats?.totalBookings ?? 0, icon: CalendarCheck, isCurrency: false },
    { label: 'Revenue YTD', value: stats?.revenueYtd ?? 0, icon: DollarSign, isCurrency: true },
    { label: 'Occupancy %', value: stats?.occupancyRate ?? 0, icon: Percent, isCurrency: false, decimals: 1 },
    { label: 'Avg. rating', value: stats?.avgRating ?? 0, icon: Star, isCurrency: false, decimals: 1 },
  ];

  return (
    <AdminLayout>
      <Reveal className="mb-10">
        <span className="label-field mb-2 block">Overview</span>
        <h1 className="font-serif text-4xl mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'Admin'}</p>
      </Reveal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter mb-10">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Reveal key={kpi.label} delay={i * 0.06}>
              <div className="glass-panel p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="label-field">{kpi.label}</h3>
                  <Icon size={18} className="text-primary" />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <div className="font-serif text-3xl">
                    <AnimatedCounter
                      value={kpi.value}
                      prefix={kpi.isCurrency ? '$' : ''}
                      suffix={kpi.label === 'Occupancy %' ? '%' : ''}
                      decimals={kpi.decimals ?? (kpi.isCurrency ? 2 : 0)}
                    />
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Revenue chart */}
      <Reveal delay={0.1} className="mb-10">
        <div className="glass-panel p-7">
          <h3 className="font-serif text-2xl mb-6">Bookings &amp; revenue (last 6 months)</h3>
          {trendLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFEAE0" vertical={false} />
                <XAxis dataKey="month" stroke="#7A7568" fontSize={12} tickLine={false} axisLine={{ stroke: '#E7E1D3' }} />
                <YAxis stroke="#7A7568" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(43,58,103,0.05)' }} />
                <Bar dataKey="bookings" fill="#2B3A67" radius={[6, 6, 0, 0]} />
                <Bar dataKey="revenue" fill="#E8724C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-24">No bookings in the last 6 months yet.</p>
          )}
        </div>
      </Reveal>

      {/* Recent Bookings Table */}
      <Reveal delay={0.15}>
        <div className="glass-panel p-7">
          <h3 className="font-serif text-2xl mb-6">Recent bookings</h3>

          {bookingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentBookings && recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 label-field">Guest</th>
                    <th className="text-left py-3 px-4 label-field">Hotel</th>
                    <th className="text-left py-3 px-4 label-field">Dates</th>
                    <th className="text-left py-3 px-4 label-field">Status</th>
                    <th className="text-right py-3 px-4 label-field">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border hover:bg-muted/60 transition-colors">
                      <td className="py-4 px-4">{booking.guestName}</td>
                      <td className="py-4 px-4 font-semibold">{booking.hotel.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {booking.checkIn} → {booking.checkOut}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[booking.status] ?? ''}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">${booking.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No bookings yet.</p>
          )}
        </div>
      </Reveal>
    </AdminLayout>
  );
}
