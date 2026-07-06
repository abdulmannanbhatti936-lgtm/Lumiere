import { Loader2 } from 'lucide-react';
import { Redirect, Route } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<Record<string, string>>;
  adminOnly?: boolean;
}

export function ProtectedRoute({ path, component: Component, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="min-h-[60vh] flex items-center justify-center">
              <Loader2 size={40} className="animate-spin text-accent" />
            </div>
          );
        }

        if (!isAuthenticated) {
          return <Redirect to="/login" />;
        }

        if (adminOnly && user?.role !== 'admin') {
          return <Redirect to="/" />;
        }

        return <Component {...params} />;
      }}
    </Route>
  );
}
