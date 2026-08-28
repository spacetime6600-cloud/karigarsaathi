import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { ROUTES } from '@/routes';
import { Loader2, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface AuthGuardProps {
  requiredRole?: 'artisan' | 'coordinator';
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ requiredRole, children }) => {
  const { isAuthenticated, isLoading, user, switchRole } = useAuth();
  const location = useLocation();

  // 1. Loading state: wait for auth verification before making routing decisions
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-primary animate-in fade-in"
      >
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Verifying security credentials...
        </span>
      </div>
    );
  }

  // 2. Unauthenticated state: redirect to login preserving return URL
  if (!isAuthenticated) {
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    const loginTarget = `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(returnUrl)}`;
    return <Navigate to={loginTarget} replace state={{ from: location }} />;
  }

  // 3. Role enforcement: check if the user's active role matches the required role
  const userRole = user?.role || 'artisan';
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 animate-in fade-in">
        <Card className="p-6 md:p-8 text-center flex flex-col items-center gap-4 bg-white border border-surface-variant rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl font-bold text-primary">
              Role Access Restricted
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This area is restricted to authorized <strong className="capitalize text-primary">{requiredRole}</strong> accounts. Your current profile is active as <strong className="capitalize text-primary">{userRole}</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full pt-2">
            <Button
              onClick={() => {
                switchRole(requiredRole);
              }}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="w-full text-xs font-bold"
            >
              Switch to {requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} Mode
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                window.location.href = userRole === 'coordinator' ? ROUTES.COORDINATOR_DASHBOARD : ROUTES.ARTISAN_DASHBOARD;
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full text-xs"
            >
              Return to My Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 4. Authorized: render child routes or child components
  return children ? <>{children}</> : <Outlet />;
};
