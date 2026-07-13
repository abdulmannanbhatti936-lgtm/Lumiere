import { useRef, useState } from 'react';
import { Menu, X, Sparkles, Home as HomeIcon, Compass, Search, Gem, Info, Mail, Luggage } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Tours', href: '/tours', activeOn: ['/tours', '/tour', '/destinations'], icon: Compass },
  { label: 'Search', href: '/hotels', activeOn: ['/hotels', '/hotel', '/booking'], icon: Search },
  { label: 'Experience', href: '/experience', icon: Gem },
  { label: 'About', href: '/about', icon: Info },
  { label: 'Contact', href: '/contact', icon: Mail },
  { label: 'My Trips', href: '/my-bookings', requiresAuth: true, icon: Luggage },
];

function getInitials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  const isItemActive = (item: (typeof NAV_ITEMS)[number]) => {
    const targets = item.activeOn ?? [item.href];
    return targets.some((href) => (href === '/' ? location === '/' : location.startsWith(href)));
  };

  const handleHoverStart = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    setExpanded(true);
  };
  const handleHoverEnd = () => {
    // A short grace period so a fast pointer pass-over doesn't flicker the nav open/closed.
    collapseTimer.current = setTimeout(() => setExpanded(false), 250);
  };

  return (
    <>
      {/* Desktop "Dynamic Island" — collapses to icon-only pills when the cursor isn't
          over it (so first-time visitors can still see every page), and expands to
          the full labeled link list on hover. */}
      <div className="hidden md:flex fixed top-5 left-0 right-0 z-50 justify-center px-4">
        <motion.nav
          layout
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
          transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
          className="nav-island rounded-full flex items-center gap-1 px-2 py-2"
        >
          <Link href="/" className="flex items-center gap-1.5 pl-3 pr-4 shrink-0">
            <span className="font-serif text-[17px] font-bold text-primary tracking-tight">Lumière</span>
            <motion.span
              animate={{ opacity: expanded ? 0 : 1, scale: expanded ? 0.5 : 1 }}
              transition={{ duration: 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
          </Link>

          <motion.div layout className="w-px h-5 bg-foreground/10 shrink-0" />

          {/* Nav items stay visible as icon-only pills when collapsed, so a first-time
              visitor can still see every page is one click away — labels reveal on hover. */}
          <motion.div layout className="flex items-center gap-1 px-1">
            {NAV_ITEMS.map((item) => {
              if (item.requiresAuth && !isAuthenticated) return null;
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <motion.div key={item.href} layout whileHover={{ y: -3, scale: 1.05 }} transition={{ duration: 0.15 }}>
                  <Link
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                      expanded ? 'px-4' : 'w-9'
                    } ${active ? 'nav-pill-active text-white' : 'text-[#3A3F52] hover:text-primary'}`}
                  >
                    <Icon size={15} className="shrink-0" />
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            })}
            {isAuthenticated && user?.role === 'admin' && (
              <motion.div layout whileHover={{ y: -3, scale: 1.05 }} transition={{ duration: 0.15 }}>
                <Link
                  href="/dashboard"
                  title="Admin"
                  aria-label="Admin"
                  className={`flex items-center justify-center gap-1.5 h-9 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    expanded ? 'px-4' : 'w-9'
                  } ${
                    location.startsWith('/dashboard') || location.startsWith('/admin')
                      ? 'nav-pill-active text-white'
                      : 'text-[#3A3F52] hover:text-primary'
                  }`}
                >
                  <Sparkles size={15} className="shrink-0" />
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        Admin
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            )}
          </motion.div>

          <motion.div layout whileHover={{ y: -2, scale: 1.1 }} transition={{ duration: 0.15 }} className="pl-1 shrink-0">
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
        </motion.nav>
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
