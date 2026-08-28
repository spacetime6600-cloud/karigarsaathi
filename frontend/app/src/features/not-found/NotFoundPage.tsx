import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Home, Compass, ShoppingBag, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const isCoordinator = user?.role === 'coordinator';

  return (
    <div className="min-h-screen bg-[#FFF9EF] flex flex-col items-center justify-center p-6 text-center">
      <Card className="p-8 sm:p-12 max-w-lg w-full flex flex-col items-center gap-6 bg-white border border-[#001D36]/10 shadow-lg rounded-3xl animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
          <Compass className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-bold text-secondary uppercase tracking-widest">
            Error 404
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Page or Craft Record Not Found
          </h1>
          <p className="text-sm text-on-surface-variant max-w-sm">
            The page, product record, or craft link you are looking for does not exist, has been removed, or moved to another URL.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full pt-2">
          <Link to={ROUTES.HOME} className="w-full">
            <Button size="lg" leftIcon={<Home className="w-4 h-4" />} className="w-full font-bold text-xs py-3">
              Return to Homepage
            </Button>
          </Link>

          <Link to={ROUTES.MARKETPLACE} className="w-full">
            <Button variant="secondary" size="lg" leftIcon={<ShoppingBag className="w-4 h-4" />} className="w-full font-bold text-xs py-3">
              Explore Marketplace
            </Button>
          </Link>

          {isAuthenticated && (
            <Link
              to={isCoordinator ? ROUTES.COORDINATOR_DASHBOARD : ROUTES.ARTISAN_DASHBOARD}
              className="text-xs font-bold text-secondary hover:underline flex items-center justify-center gap-1 pt-1"
            >
              <span>{isCoordinator ? 'Go to Coordinator Hub' : 'Return to Artisan Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
};
