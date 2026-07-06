import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [, navigate] = useLocation();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Hotels', href: '/hotels' },
    { label: 'Destinations', href: '/destinations' },
    { label: 'My Bookings', href: '/my-bookings', requiresAuth: true },
    { label: 'Dashboard', href: '/dashboard', requiresAuth: true, adminOnly: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass-dark border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold gradient-text">✨ Lumiere</div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            if (item.requiresAuth && !isAuthenticated) return null;
            if (item.adminOnly && user?.role !== 'admin') return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                {user?.name || 'Guest'}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="container py-4 flex flex-col gap-4">
            {navItems.map((item) => {
              if (item.requiresAuth && !isAuthenticated) return null;
              if (item.adminOnly && user?.role !== 'admin') return null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground hover:text-accent transition-colors"
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
                  className="text-foreground hover:text-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-left text-foreground hover:text-accent transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
