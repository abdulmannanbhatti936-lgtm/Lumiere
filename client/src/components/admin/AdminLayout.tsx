import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Hotels', href: '/admin/hotels' },
  { label: 'Destinations', href: '/admin/destinations' },
  { label: 'Bookings', href: '/admin/bookings' },
  { label: 'Reviews', href: '/admin/reviews' },
  { label: 'Users', href: '/admin/users' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container overflow-x-auto">
          <nav className="flex gap-2 py-3">
            {ADMIN_NAV.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="py-12">
        <div className="container">{children}</div>
      </div>
    </div>
  );
}
