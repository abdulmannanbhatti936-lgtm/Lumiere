import { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Tours', href: '/tours', activeOn: ['/tours', '/destinations'] },
  { label: 'Search', href: '/hotels', activeOn: ['/hotels', '/hotel', '/booking'] },
  { label: 'Contact', href: '/contact' },
  { label: 'My Trips', href: '/my-bookings', requiresAuth: true },
];

// Kept out of the desktop "island" nav to preserve its compact pill layout —
// reachable via the mobile menu and the footer instead.
const SECONDARY_NAV_ITEMS = [
  { label: 'Experience', href: '/experience' },
  { label: 'About', href: '/about' },
];

function getInitials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  const isItemActive = (item: (typeof NAV_ITEMS)[number]) => {
    const targets = item.activeOn ?? [item.href];
    return targets.some((href) => (href === '/' ? location === '/' : location.startsWith(href)));
  };

  return (
    <>
      {/* Desktop "Dynamic Island" */}
      <div className="hidden md:flex fixed top-5 left-0 right-0 z-50 justify-center px-4">
        <nav className="nav-island rounded-full flex items-center gap-1 px-2 py-2">
          <Link href="/" className="flex items-center gap-1.5 pl-3 pr-4">
            <span className="font-serif text-[17px] font-bold text-primary tracking-tight">Lumière</span>
          </Link>

          <div className="w-px h-5 bg-foreground/10" />

          <div className="flex items-center gap-1 px-1">
            {NAV_ITEMS.map((item) => {
              if (item.requiresAuth && !isAuthenticated) return null;
              const active = isItemActive(item);
              return (
                <motion.div key={item.href} whileHover={{ y: -3, scale: 1.05 }} transition={{ duration: 0.15 }}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      active ? 'nav-pill-active text-white' : 'text-[#3A3F52] hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
            {isAuthenticated && user?.role === 'admin' && (
              <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ duration: 0.15 }}>
                <Link
                  href="/dashboard"
                  className={`block px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    location.startsWith('/dashboard') || location.startsWith('/admin')
                      ? 'nav-pill-active text-white'
                      : 'text-[#3A3F52] hover:text-primary'
                  }`}
                >
                  Admin
                </Link>
              </motion.div>
            )}
          </div>

          <motion.div whileHover={{ y: -2, scale: 1.1 }} transition={{ duration: 0.15 }} className="pl-1">
            {isAuthenticated ? (
              <Link
                href="/my-bookings"
                aria-label="My account"
                className="nav-pill-active w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-xs font-bold"
              >
                {getInitials(user?.name)}
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-primary !px-5 !py-2 !text-sm"
              >
                Sign In
              </Link>
            )}
          </motion.div>
        </nav>
      </div>

      {/* Mobile top bar (compact — full nav lives in the bottom tab bar) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-5 py-4 bg-background/90 backdrop-blur-lg border-b border-border">
          <Link href="/" className="flex items-center gap-1.5">
            <Sparkles className="text-accent" size={16} />
            <span className="font-serif text-lg font-bold text-primary">Lumière</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-foreground" aria-label="Menu">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden bg-background border-b border-border"
            >
              <div className="px-5 py-6 flex flex-col gap-4">
                {NAV_ITEMS.map((item) => {
                  if (item.requiresAuth && !isAuthenticated) return null;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="label-field !text-foreground text-base normal-case font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {isAuthenticated && user?.role === 'admin' && (
                  <Link
                    href="/dashboard"
                    className="text-base font-semibold text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}

                <div className="h-px bg-border my-1" />
                {SECONDARY_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="label-field !text-muted-foreground text-base normal-case font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                {!isAuthenticated && (
                  <Link
                    href="/login"
                    className="btn-primary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
