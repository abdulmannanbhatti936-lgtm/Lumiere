import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, CalendarCheck, Building2, MapPinned, Compass, Users, BarChart3, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings', href: '/admin/bookings', icon: CalendarCheck },
  { label: 'Listings', href: '/admin/hotels', icon: Building2 },
  { label: 'Destinations', href: '/admin/destinations', icon: MapPinned },
  { label: 'Tours', href: '/admin/tours', icon: Compass },
  { label: 'Guests', href: '/admin/users', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-card border-r border-border self-stretch sticky top-[110px] h-[calc(100vh-110px)] px-4 py-6">
        <nav className="flex flex-col gap-1">
          {ADMIN_NAV.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile nav */}
        <div className="lg:hidden bg-card border-b border-border overflow-x-auto">
          <nav className="flex gap-1 px-4 py-3">
            {ADMIN_NAV.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground bg-muted',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="py-9 px-6 md:px-11 max-w-[1240px]">{children}</div>
      </div>
    </div>
  );
}
