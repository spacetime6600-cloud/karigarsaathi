import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { ROUTES, getSafeReturnUrl, isPathRoleCompatible } from '@/routes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Palette,
  ShieldCheck,
  MoveRight,
  MoveLeft,
  UserCheck,
} from 'lucide-react';

export const SignInSelectionPage: React.FC = () => {
  const { isAuthenticated, user, userAccount, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawReturnUrl = searchParams.get('returnUrl');

  const handleSelectRole = (targetPath: string, role: 'artisan' | 'coordinator') => {
    const isCompatible = rawReturnUrl && isPathRoleCompatible(rawReturnUrl, role);
    if (isCompatible && rawReturnUrl) {
      navigate(`${targetPath}?returnUrl=${encodeURIComponent(rawReturnUrl)}`);
    } else {
      navigate(targetPath);
    }
  };

  const activeRole = userAccount?.role || user?.role;
  const activeName = userAccount?.displayName || user?.name || 'User';

  return (
    <div className="w-full max-w-4xl mx-auto py-5 sm:py-7 px-3 sm:px-6 flex flex-col items-center">
      {/* Header Block */}
      <div className="flex flex-col items-center text-center gap-2.5 mb-5 sm:mb-7">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#FFB955] text-xs font-bold border border-white/20 shadow-xs select-none">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>KarigarSaathi Access Portal</span>
        </div>
        <h1 className="font-display text-2xl sm:text-4xl md:text-[42px] font-bold text-white tracking-tight drop-shadow-sm leading-tight">
          Welcome to KarigarSaathi
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-md drop-shadow-xs font-medium">
          Choose how you want to sign in.
        </p>
      </div>

      {/* Active session banner if user is already signed in */}
      {isAuthenticated && activeRole && (
        <Card className="w-full max-w-[720px] mx-auto mb-5 p-4 sm:p-5 bg-[#FFFDF9] border border-secondary/20 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-base shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{activeName}</span>
                <Badge variant={activeRole === 'coordinator' ? 'indigo' : 'success'} className="text-[10px] uppercase font-bold">
                  {activeRole === 'coordinator' ? 'Coordinator' : 'Artisan'}
                </Badge>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                You have an active session in this browser.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => {
                const target = activeRole === 'coordinator' ? ROUTES.COORDINATOR_DASHBOARD : ROUTES.ARTISAN_DASHBOARD;
                navigate(getSafeReturnUrl(rawReturnUrl, target, activeRole));
              }}
              size="sm"
              className="group/work flex-1 sm:flex-initial text-xs font-bold bg-secondary hover:bg-[#8B3400] text-white inline-flex items-center gap-1.5 transition-all duration-200 active:scale-95"
            >
              <span>Go to Workspace</span>
              <MoveRight className="w-3.5 h-3.5 transition-transform duration-250 ease-out group-hover/work:translate-x-1 motion-reduce:transform-none" />
            </Button>
            <Button
              onClick={async () => {
                await signOut();
              }}
              variant="ghost"
              size="sm"
              className="flex-1 sm:flex-initial text-xs font-bold border border-surface-variant hover:bg-black/5 transition-colors duration-150"
            >
              Sign Out
            </Button>
          </div>
        </Card>
      )}

      {/* Two Role Choice Panels: Symmetrical side-by-side on desktop, stacked on mobile */}
      <div className="role-selection">
        {/* Panel 1: Artisan */}
        <div className="role-panel">
          <div>
            {/* Top row: Icon and Role Label */}
            <div className="flex items-center justify-between w-full mb-5 sm:mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/12 text-secondary flex items-center justify-center shrink-0 border border-secondary/20 shadow-2xs">
                <Palette className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-semibold tracking-wider uppercase select-none">
                Craft Producer
              </span>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-primary tracking-tight leading-tight">
                Artisan sign in
              </h2>
              <p className="font-sans text-xs sm:text-sm font-normal text-on-surface-variant leading-relaxed">
                Create catalogues, manage your products, and connect with buyers.
              </p>
            </div>
          </div>

          {/* Bottom row: Divider, Action Button and Secondary Link */}
          <div className="pt-4 mt-auto flex flex-col gap-2.5 border-t border-[color-mix(in_srgb,var(--color-primary,#001D36)_10%,transparent)]">
            <Button
              onClick={() => handleSelectRole(ROUTES.LOGIN, 'artisan')}
              className="w-full h-12 min-h-[48px] rounded-xl bg-secondary hover:bg-[#8B3400] text-white font-semibold text-sm shadow-xs hover:shadow-md hover:shadow-secondary/20 active:scale-[0.985] flex items-center justify-center gap-2 transition-all duration-200 ease-out group/btn focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <span className="whitespace-nowrap font-semibold text-sm text-[#FFFDF9]">Continue as Artisan</span>
              <MoveRight className="w-4 h-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-1.5 motion-reduce:transform-none" />
            </Button>
            <Link
              to={ROUTES.LOGIN}
              className="group/artisan text-xs font-medium text-secondary hover:text-secondary/80 text-center py-1 transition-all duration-200 ease-out inline-flex items-center justify-center hover:translate-x-1"
            >
              New artisan? Register here →
            </Link>
          </div>
        </div>

        {/* Panel 2: Coordinator */}
        <div className="role-panel">
          <div>
            {/* Top row: Icon and Role Label */}
            <div className="flex items-center justify-between w-full mb-5 sm:mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wider uppercase select-none">
                Cluster Agency
              </span>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-primary tracking-tight leading-tight">
                Coordinator sign in
              </h2>
              <p className="font-sans text-xs sm:text-sm font-normal text-on-surface-variant leading-relaxed">
                Support assigned artisans, review products, and manage buyer enquiries.
              </p>
            </div>
          </div>

          {/* Bottom row: Divider, Action Button and Secondary Link */}
          <div className="pt-4 mt-auto flex flex-col gap-2.5 border-t border-[color-mix(in_srgb,var(--color-primary,#001D36)_10%,transparent)]">
            <Button
              onClick={() => handleSelectRole(ROUTES.COORDINATOR_LOGIN, 'coordinator')}
              className="w-full h-12 min-h-[48px] rounded-xl bg-secondary hover:bg-[#8B3400] text-white font-semibold text-sm shadow-xs hover:shadow-md hover:shadow-secondary/20 active:scale-[0.985] flex items-center justify-center gap-2 transition-all duration-200 ease-out group/btn focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <span className="whitespace-nowrap font-semibold text-sm text-[#FFFDF9]">Continue as Coordinator</span>
              <MoveRight className="w-4 h-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-1.5 motion-reduce:transform-none" />
            </Button>
            <Link
              to={ROUTES.COORDINATOR_REGISTER}
              className="group/coord text-xs font-medium text-secondary hover:text-secondary/80 text-center py-1 transition-all duration-200 ease-out inline-flex items-center justify-center hover:translate-x-1"
            >
              New coordinator? Register for cluster access →
            </Link>
          </div>
        </div>
      </div>

      {/* Return to Homepage Link */}
      <div className="flex items-center justify-center mt-6 sm:mt-8 text-xs">
        <Link
          to={ROUTES.HOME}
          className="group/home inline-flex items-center gap-2 text-white/80 hover:text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-3 py-1.5"
        >
          <MoveLeft className="w-4 h-4 transition-transform duration-250 ease-out group-hover/home:-translate-x-1 motion-reduce:transform-none" />
          <span>Back to homepage</span>
        </Link>
      </div>
    </div>
  );
};
