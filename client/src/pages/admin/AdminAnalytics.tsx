import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/admin/AdminLayout';
import Reveal from '@/components/motion/Reveal';
import { Skeleton } from '@/components/ui/skeleton';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E7E1D3',
  borderRadius: '10px',
  color: '#1E2233',
};

export default function AdminAnalytics() {
  const { data: trend, isLoading: trendLoading } = trpc.admin.monthlyTrend.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: topDestination, isLoading: topLoading } = trpc.admin.topDestination.useQuery();

  return (
    <AdminLayout>
      <Reveal className="mb-10">
        <span className="label-field mb-2 block">Insights</span>
        <h1 className="font-serif text-4xl">Analytics</h1>
      </Reveal>

      <Reveal delay={0.05} className="mb-8">
        <div className="glass-panel p-7">
          <h3 className="font-serif text-2xl mb-6">Revenue &amp; bookings (last 6 months)</h3>
          {trendLoading ? (
            <Skeleton className="h-[340px] w-full" />
          ) : trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={trend} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFEAE0" vertical={false} />
                <XAxis dataKey="month" stroke="#7A7568" fontSize={12} tickLine={false} axisLine={{ stroke: '#E7E1D3' }} />
                <YAxis stroke="#7A7568" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(43,58,103,0.05)' }} />
                <Bar dataKey="revenue" fill="#2B3A67" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="revenue" position="top" formatter={(v: number) => `$${v}`} fill="#1E2233" fontSize={11} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-24">No bookings in the last 6 months yet.</p>
          )}
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <Reveal delay={0.1}>
          <div className="glass-panel p-7">
            <h3 className="label-field mb-4">Occupancy rate</h3>
            {statsLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <>
                <p className="font-serif text-4xl text-primary mb-2">{stats?.occupancyRate ?? 0}%</p>
                <p className="text-sm text-muted-foreground">Booked room-nights this month across all listings</p>
              </>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="glass-panel p-7">
            <h3 className="label-field mb-4">Top destination</h3>
            {topLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : topDestination?.name ? (
              <>
                <p className="font-serif text-2xl mb-2">{topDestination.name}</p>
                <p className="text-sm text-muted-foreground">{topDestination.percentage}% of all bookings</p>
              </>
            ) : (
              <p className="text-muted-foreground">No bookings yet.</p>
            )}
          </div>
        </Reveal>
      </div>
    </AdminLayout>
  );
}
