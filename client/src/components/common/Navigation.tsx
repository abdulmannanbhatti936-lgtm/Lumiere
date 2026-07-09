import { useEffect, useState } from 'react';
import { Menu, X, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '@/components/motion/Magnetic';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Hotels', href: '/hotels' },
    { label: 'Destinations', href: '/destinations' },
    { label: 'My Bookings', href: '/my-bookings', requiresAuth: true },
    { label: 'Management', href: '/dashboard', requiresAuth: true, adminOnly: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-panel border-x-0 border-t-0 rounded-none' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Sparkles className="text-accent" size={20} />
          <span className="font-serif text-2xl tracking-tight text-foreground">
            LUMI<span className="text-accent">È</span>RE
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-9">
          {navItems.map((item) => {
            if (item.requiresAuth && !isAuthenticated) return null;
            if (item.adminOnly && user?.role !== 'admin') return null;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`label-caps !text-[11px] pb-1 border-b transition-colors ${
                  isActive
                    ? 'text-accent border-accent'
                    : 'text-muted-foreground border-transparent hover:text-accent'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                {user?.name || 'Guest'}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-muted/40 rounded-md transition-colors"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Magnetic>
              <Link
                href="/login"
                className="label-caps !text-[11px] !text-primary border border-primary px-7 py-2.5 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                Sign In
              </Link>
            </Magnetic>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-foreground">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden glass-panel border-x-0 rounded-none"
          >
            <div className="container py-6 flex flex-col gap-5">
              {navItems.map((item) => {
                if (item.requiresAuth && !isAuthenticated) return null;
                if (item.adminOnly && user?.role !== 'admin') return null;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="label-caps !text-foreground hover:!text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="label-caps !text-foreground hover:!text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="label-caps text-left !text-destructive"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="label-caps !text-primary border border-primary px-6 py-3 rounded-sm text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
