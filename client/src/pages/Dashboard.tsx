import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Users, DollarSign, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/admin/AdminLayout';
import Reveal from '@/components/motion/Reveal';
import AnimatedCounter from '@/components/motion/AnimatedCounter';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  pending: '#facc15',
  confirmed: '#4ade80',
  cancelled: '#71717a',
  completed: '#60a5fa',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-400/10 text-yellow-400',
  confirmed: 'bg-green-400/10 text-green-400',
  cancelled: 'bg-muted text-muted-foreground',
  completed: 'bg-blue-400/10 text-blue-400',
};

// Recharts only accepts literal color strings on its SVG props (no Tailwind classes),
// so chart chrome is kept in sync with the Aurora palette via hex literals here.
const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0f1524',
  border: '1px solid rgba(0, 217, 255, 0.3)',
  borderRadius: '8px',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: trend, isLoading: trendLoading } = trpc.admin.monthlyTrend.useQuery();
  const { data: recentBookings, isLoading: bookingsLoading } = trpc.bookings.adminList.useQuery({ page: 1, limit: 8 });

  const statusData = stats
    ? Object.entries(stats.bookingsByStatus)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({ name: status, value: count, color: STATUS_COLORS[status] ?? '#888' }))
    : [];

  const kpis = [
    { label: 'Total Bookings', value: stats?.totalBookings ?? 0, icon: BookOpen, color: 'text-accent', isCurrency: false },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-400', isCurrency: false },
    { label: 'Total Revenue', value: stats?.totalRevenue ?? 0, icon: DollarSign, color: 'text-green-400', isCurrency: true },
    { label: 'Pending Reviews', value: stats?.pendingReviews ?? 0, icon: Star, color: 'text-purple-400', isCurrency: false },
  ];

  return (
    <AdminLayout>
      <Reveal className="mb-12">
        <span className="label-caps mb-4 block">Management Overview</span>
        <h1 className="font-serif text-4xl md:text-5xl mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'Admin'}</p>
      </Reveal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Reveal key={kpi.label} delay={i * 0.06}>
              <div className="glass-panel tilt-card p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="label-caps !text-[10px] !text-muted-foreground">{kpi.label}</h3>
                  <Icon size={20} className={kpi.color} />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <div className="font-serif text-3xl text-accent">
                    <AnimatedCounter value={kpi.value} prefix={kpi.isCurrency ? '$' : ''} decimals={kpi.isCurrency ? 2 : 0} />
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <Reveal delay={0.1} className="lg:col-span-2">
          <div className="glass-panel p-6 h-full">
            <h3 className="font-serif text-2xl mb-6">Bookings & Revenue Trend (last 6 months)</h3>
            {trendLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22304a" />
                  <XAxis dataKey="month" stroke="#7a8ba3" />
                  <YAxis stroke="#7a8ba3" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="bookings" fill="#00D9FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-24">No bookings in the last 6 months yet.</p>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="glass-panel p-6 h-full">
            <h3 className="font-serif text-2xl mb-6">Bookings by Status</h3>
            {statsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-24">No bookings yet.</p>
            )}
          </div>
        </Reveal>
      </div>

      {/* Recent Bookings Table */}
      <Reveal delay={0.2}>
        <div className="glass-panel p-6">
          <h3 className="font-serif text-2xl mb-6">Recent Bookings</h3>

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
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Hotel</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Guest</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Check-in</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Check-out</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-semibold">{booking.hotel.name}</td>
                      <td className="py-4 px-4">{booking.guestName}</td>
                      <td className="py-4 px-4 text-muted-foreground">{booking.checkIn}</td>
                      <td className="py-4 px-4 text-muted-foreground">{booking.checkOut}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-sm text-xs font-semibold capitalize ${STATUS_BADGE[booking.status] ?? ''}`}
                        >
                          {booking.status}
                        </span>
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
      </Reveal>
    </AdminLayout>
  );
}
