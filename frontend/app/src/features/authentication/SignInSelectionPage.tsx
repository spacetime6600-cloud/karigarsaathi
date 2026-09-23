import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { ROUTES, getSafeReturnUrl } from '@/routes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Palette,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

export const SignInSelectionPage: React.FC = () => {
  const { isAuthenticated, user, userAccount, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawReturnUrl = searchParams.get('returnUrl');

  const handleSelectRole = (targetPath: string) => {
    if (rawReturnUrl) {
      navigate(`${targetPath}?returnUrl=${encodeURIComponent(rawReturnUrl)}`);
    } else {
      navigate(targetPath);
    }
  };

  const activeRole = userAccount?.role || user?.role;
  const activeName = userAccount?.displayName || user?.name || 'User';

  return (
    <div className="w-full max-w-none mx-auto py-6 sm:py-8 px-2 sm:px-4 animate-in fade-in duration-200 flex flex-col items-center">
      {/* Header Block */}
      <div className="flex flex-col items-center text-center gap-3 mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#FFB955] text-xs font-bold border border-white/20 shadow-xs select-none">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KarigarSaathi Access Portal</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-sm">
          Welcome to KarigarSaathi
        </h1>
        <p className="text-sm sm:text-base text-white/90 max-w-md drop-shadow-xs font-medium">
          Choose how you want to sign in.
        </p>
      </div>

      {/* Active session banner if user is already signed in */}
      {isAuthenticated && activeRole && (
        <Card className="max-w-[780px] mx-auto mb-6 p-4 sm:p-5 bg-[#FFFDF9] border border-secondary/20 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
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
                navigate(getSafeReturnUrl(rawReturnUrl, target));
              }}
              size="sm"
              className="flex-1 sm:flex-initial text-xs font-bold bg-secondary hover:bg-secondary/90 text-white"
            >
              Go to Workspace
            </Button>
            <Button
              onClick={async () => {
                await signOut();
              }}
              variant="ghost"
              size="sm"
              className="flex-1 sm:flex-initial text-xs font-bold border border-surface-variant"
            >
              Sign Out
            </Button>
          </div>
        </Card>
      )}

      {/* Two Role Choice Panels: Wide side-by-side on desktop, stacked on mobile */}
      <div className="role-selection">
        {/* Panel 1: Artisan */}
        <div className="role-panel">
          {/* Top row: Icon and Role Label */}
          <div className="flex items-center justify-between w-full mb-6 sm:mb-8">
            <div className="w-14 h-14 rounded-2xl bg-secondary/12 text-secondary flex items-center justify-center shrink-0 border border-secondary/20 shadow-xs">
              <Palette className="w-6 h-6" aria-hidden="true" />
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs sm:text-[13px] font-semibold tracking-wider uppercase select-none">
              Craft Producer
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-2.5 sm:gap-3 mb-6">
            <h2 className="font-sans text-2xl sm:text-[28px] lg:text-[32px] font-semibold text-primary tracking-tight leading-tight">
              Artisan sign in
            </h2>
            <p className="font-sans text-base sm:text-[17px] font-normal text-on-surface-variant leading-relaxed">
              Create catalogues, manage your products, and connect with buyers.
            </p>
          </div>

          {/* Bottom row: Subtle Divider and Action Button */}
          <div className="pt-6 sm:pt-8 mt-auto flex flex-col border-t border-[color-mix(in_srgb,var(--color-primary,#001D36)_12%,transparent)]">
            <Button
              onClick={() => handleSelectRole(ROUTES.LOGIN)}
              className="w-full h-14 min-h-[56px] rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold text-base shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2.5 transition-all duration-150 group/btn focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <span className="whitespace-nowrap font-semibold text-base text-[#FFFDF9]">Continue as Artisan</span>
              <ArrowRight className="w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover/btn:translate-x-[3px] motion-reduce:transform-none" />
            </Button>
          </div>
        </div>

        {/* Panel 2: Coordinator */}
        <div className="role-panel">
          {/* Top row: Icon and Role Label */}
          <div className="flex items-center justify-between w-full mb-6 sm:mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs sm:text-[13px] font-semibold tracking-wider uppercase select-none">
              Cluster Agency
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-2.5 sm:gap-3 mb-6">
            <h2 className="font-sans text-2xl sm:text-[28px] lg:text-[32px] font-semibold text-primary tracking-tight leading-tight">
              Coordinator sign in
            </h2>
            <p className="font-sans text-base sm:text-[17px] font-normal text-on-surface-variant leading-relaxed">
              Support assigned artisans, review products, and manage buyer enquiries.
            </p>
          </div>

          {/* Bottom row: Subtle Divider and Action Button */}
          <div className="pt-6 sm:pt-8 mt-auto flex flex-col border-t border-[color-mix(in_srgb,var(--color-primary,#001D36)_12%,transparent)]">
            <Button
              onClick={() => handleSelectRole(ROUTES.COORDINATOR_LOGIN)}
              className="w-full h-14 min-h-[56px] rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold text-base shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2.5 transition-all duration-150 group/btn focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <span className="whitespace-nowrap font-semibold text-base text-[#FFFDF9]">Continue as Coordinator</span>
              <ArrowRight className="w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover/btn:translate-x-[3px] motion-reduce:transform-none" />
            </Button>
          </div>
        </div>
      </div>

      {/* Return to Homepage Link */}
      <div className="flex items-center justify-center mt-8 sm:mt-10 text-xs">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg px-3 py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to homepage</span>
        </Link>
      </div>
    </div>
  );
};
