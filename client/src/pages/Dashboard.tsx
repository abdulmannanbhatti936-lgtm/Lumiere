import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, BookOpen, Users, DollarSign, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

const STATUS_COLORS: Record<string, string> = {
  pending: '#facc15',
  confirmed: '#4ade80',
  cancelled: '#71717a',
  completed: '#60a5fa',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-400/20 text-yellow-400',
  confirmed: 'bg-green-400/20 text-green-400',
  cancelled: 'bg-muted text-muted-foreground',
  completed: 'bg-blue-400/20 text-blue-400',
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

  return (
    <AdminLayout>
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'Admin'}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Bookings', value: stats?.totalBookings, icon: BookOpen, color: 'text-accent' },
          { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-400' },
          {
            label: 'Total Revenue',
            value: stats ? formatCurrency(stats.totalRevenue) : undefined,
            icon: DollarSign,
            color: 'text-green-400',
          },
          { label: 'Pending Reviews', value: stats?.pendingReviews, icon: Star, color: 'text-purple-400' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="card-luxury">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground">{kpi.label}</h3>
                <Icon size={24} className={kpi.color} />
              </div>
              <p className="text-3xl font-bold">
                {statsLoading ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : kpi.value ?? 0}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 card-luxury">
          <h3 className="text-2xl font-bold mb-6">Bookings & Revenue Trend (last 6 months)</h3>
          {trendLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin text-accent" />
            </div>
          ) : trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="bookings" fill="#ffc107" />
                <Bar dataKey="revenue" fill="#ff9800" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-24">No bookings in the last 6 months yet.</p>
          )}
        </div>

        <div className="card-luxury">
          <h3 className="text-2xl font-bold mb-6">Bookings by Status</h3>
          {statsLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={32} className="animate-spin text-accent" />
            </div>
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-24">No bookings yet.</p>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card-luxury">
        <h3 className="text-2xl font-bold mb-6">Recent Bookings</h3>

        {bookingsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        ) : recentBookings && recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Hotel</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Guest</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Check-in</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Check-out</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">{booking.hotel.name}</td>
                    <td className="py-4 px-4">{booking.guestName}</td>
                    <td className="py-4 px-4 text-muted-foreground">{booking.checkIn}</td>
                    <td className="py-4 px-4 text-muted-foreground">{booking.checkOut}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[booking.status] ?? ''}`}
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
    </AdminLayout>
  );
}
