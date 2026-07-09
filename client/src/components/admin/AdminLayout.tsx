import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
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
      <div className="glass-panel border-x-0 border-t-0 rounded-none">
        <div className="container overflow-x-auto">
          <nav className="flex gap-8">
            {ADMIN_NAV.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative py-5 label-caps !text-xs whitespace-nowrap transition-colors',
                    isActive ? '!text-accent' : '!text-muted-foreground hover:!text-foreground',
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="admin-nav-underline"
                      className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent"
                    />
                  )}
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
