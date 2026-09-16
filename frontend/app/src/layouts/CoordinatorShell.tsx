import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  MessageSquareQuote,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Home,
  Menu,
  X,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { SyncStatusIndicator } from '@/components/navigation/SyncStatusIndicator';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PageAtmosphere } from '@/components/layout/PageAtmosphere';
import { SkipLink } from '@/components/ui/SkipLink';
import { AriaLiveAnnouncer } from '@/components/ui/AriaLiveAnnouncer';
import { PageTransitionContainer } from '@/components/layout/PageTransitionContainer';
import { ROUTES } from '@/routes';
import { clsx } from 'clsx';

export const CoordinatorShell: React.FC = () => {
  const { user, signOut, switchRole } = useAuth();
  const { currentLanguageMeta } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close account popover
  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        (accountMenuRef.current && accountMenuRef.current.contains(target)) ||
        (accountButtonRef.current && accountButtonRef.current.contains(target)) ||
        (target as Element).closest?.('[role="menu"]') ||
        (target as Element).closest?.('button[aria-haspopup="menu"]')
      ) {
        return;
      }
      setIsAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isAccountMenuOpen]);

  // Escape key handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isAccountMenuOpen) {
        setIsAccountMenuOpen(false);
        accountButtonRef.current?.focus({ preventScroll: true });
      }
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
  };

  const navItems = [
    { to: ROUTES.COORDINATOR_DASHBOARD, label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: ROUTES.COORDINATOR_ARTISANS, label: 'Artisans', icon: Users },
    { to: ROUTES.COORDINATOR_REVIEWS, label: 'Product Reviews', icon: FileCheck2 },
    { to: ROUTES.COORDINATOR_ENQUIRIES, label: 'Buyer Enquiries', icon: MessageSquareQuote },
    { to: ROUTES.COORDINATOR_SALES, label: 'Sales & Reports', icon: BarChart3 },
    { to: ROUTES.COORDINATOR_SETTINGS, label: 'Settings', icon: Settings },
  ];

  // Derive current breadcrumb title
  const currentNav = navItems.find((item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  const pageTitle = currentNav?.label || 'Coordinator Portal';

  return (
    <PageAtmosphere variant="subtle" position="top" className="min-h-screen flex flex-col md:flex-row antialiased select-none">
      <SkipLink targetId="main-content" />
      <AriaLiveAnnouncer />
      <OfflineBanner />

      {/* ========================================================= */}
      {/* DESKTOP SLIM LEFT NAVIGATION RAIL (>= 768px)               */}
      {/* ========================================================= */}
      <aside
        onKeyDown={handleKeyDown}
        className="hidden md:flex flex-col w-64 bg-surface-container-lowest border-r border-surface-variant fixed left-0 top-0 h-full z-40 py-5 px-3.5 gap-4 shadow-sm"
      >
        {/* Brand Header */}
        <Link
          to={ROUTES.COORDINATOR_DASHBOARD}
          className="flex items-center gap-3 px-2 py-1.5 rounded-2xl hover:bg-surface-container transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
        >
          <div className="w-10 h-10 rounded-xl bg-primary text-[#FFB955] flex items-center justify-center font-bold shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-display text-base font-bold text-primary tracking-tight leading-none">
              KarigarSaathi
            </span>
            <span className="text-[10px] text-secondary font-bold tracking-wider uppercase mt-1">
              Coordinator Hub
            </span>
          </div>
        </Link>

        {/* Navigation Rail Links */}
        <nav aria-label="Coordinator Navigation" className="flex-1 flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] relative',
                  isActive
                    ? 'bg-secondary/10 text-secondary font-extrabold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                )}
              >
                <Icon className={clsx('w-4 h-4 shrink-0', isActive ? 'text-secondary' : 'text-on-surface-variant')} />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 w-1.5 h-4 bg-secondary rounded-full"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Rail Controls */}
        <div className="pt-3 border-t border-surface-variant flex flex-col gap-2">
          {/* Switch to Artisan View button */}
          <button
            type="button"
            onClick={() => {
              switchRole('artisan');
              navigate(ROUTES.ARTISAN_DASHBOARD);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary/[0.04] hover:bg-primary/[0.08] text-primary text-xs font-bold transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
          >
            <Home className="w-4 h-4" />
            <span>Switch to Artisan View</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate(ROUTES.HOME);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl hover:bg-error-container/40 text-on-surface-variant hover:text-error text-xs font-semibold transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE CONTENT AREA                               */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0 pb-16 md:pb-10">
        {/* Top Utility Header Bar */}
        <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-variant px-4 sm:px-8 h-16 flex items-center justify-between shadow-xs">
          {/* Left: Mobile Toggle & Page Context Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile drawer toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-primary bg-primary/[0.04] hover:bg-primary/[0.08] border border-primary/[0.08] touch-target"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline text-xs font-semibold text-on-surface-variant">
                Coordinator Hub
              </span>
              <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-on-surface-variant" />
              <h1 className="text-sm sm:text-base font-bold text-primary truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Language, Sync, Coordinator Avatar Overlay */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Preference */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.LANGUAGE)}
              aria-label={`Change language: current ${currentLanguageMeta.name}`}
              className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-primary bg-primary/[0.04] hover:bg-primary/[0.08] rounded-full border border-primary/[0.08] touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <Globe className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="hidden sm:inline">{currentLanguageMeta.name}</span>
            </button>

            {/* Cluster Sync State */}
            <SyncStatusIndicator />

            {/* Coordinator Account Avatar with Anchored Overlay Dropdown */}
            <div className="relative">
              <button
                ref={accountButtonRef}
                type="button"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                aria-label="Coordinator account settings"
                className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold shadow-xs ring-1 ring-white/50 hover:ring-2 hover:ring-secondary/40 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
              >
                {user?.name?.charAt(0) || 'C'}
              </button>

              {/* Anchored Overlay Dropdown */}
              {isAccountMenuOpen && (
                <div
                  ref={accountMenuRef}
                  role="menu"
                  aria-label="Coordinator Account Menu"
                  className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] glass-menu rounded-2xl p-4 shadow-xl z-50 motion-popover-enter flex flex-col gap-3"
                >
                  {/* Coordinator Summary */}
                  <div className="flex items-center gap-3 pb-3 border-b border-surface-variant/80">
                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center text-base font-bold shrink-0 ring-1 ring-white/50">
                      {user?.name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-primary truncate">{user?.name || 'Coordinator'}</span>
                      <span className="text-xs text-secondary font-semibold truncate">Field Coordinator Lead</span>
                    </div>
                  </div>

                  {/* Navigation item shortcuts */}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      navigate(ROUTES.COORDINATOR_SETTINGS);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-container text-xs font-semibold text-primary transition-colors text-left touch-target active:scale-[0.98]"
                  >
                    <Settings className="w-4 h-4 text-on-surface-variant" />
                    <span>Coordinator Settings</span>
                  </button>

                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      switchRole('artisan');
                      navigate(ROUTES.ARTISAN_DASHBOARD);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-container text-xs font-semibold text-primary transition-colors text-left touch-target active:scale-[0.98]"
                  >
                    <Home className="w-4 h-4 text-on-surface-variant" />
                    <span>Switch to Artisan Mode</span>
                  </button>

                  {/* Sign Out */}
                  <div className="pt-2 border-t border-surface-variant/80">
                    <button
                      role="menuitem"
                      type="button"
                      onClick={async () => {
                        setIsAccountMenuOpen(false);
                        try {
                          await signOut();
                          navigate(ROUTES.SIGN_IN, { replace: true });
                        } catch {
                          // error is captured in AuthProvider
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-error-container/60 hover:bg-error-container text-error text-xs font-bold transition-colors touch-target active:scale-[0.98]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer Dropdown */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            role="dialog"
            aria-label="Mobile Navigation Menu"
            className="md:hidden p-4 bg-white/95 backdrop-blur-md border-b border-surface-variant shadow-lg flex flex-col gap-2 animate-in slide-in-from-top-2 duration-150"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-colors touch-target',
                    isActive ? 'bg-secondary text-white' : 'bg-primary/[0.04] text-primary'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Child Workspace Route Output */}
        <main id="main-content" tabIndex={-1} className="p-4 sm:p-8 max-w-7xl w-full mx-auto outline-none">
          <PageTransitionContainer>
            <Outlet />
          </PageTransitionContainer>
        </main>
      </div>
    </PageAtmosphere>
  );
};
