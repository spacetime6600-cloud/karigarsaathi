import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, LogOut, Shield, Globe, MessageSquare, Menu, X, Home, PlusCircle, Package } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAudioHelp } from '@/app/providers/AudioHelpProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { enquiryRepository } from '@/repositories';
import { BuyerEnquiry } from '@/types';
import { SyncStatusIndicator } from '@/components/navigation/SyncStatusIndicator';
import { BuyerEnquiryPopover } from '@/components/navigation/BuyerEnquiryPopover';
import { ROUTES } from '@/routes';
import { isEmulatorMode } from '@/config/firebase';
import { clsx } from 'clsx';

interface AccountDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  user: import('@/types').ArtisanProfile | null;
  currentLanguageMeta: (typeof import('@/i18n').supportedLanguages)[number];
  switchRole: (role: 'artisan' | 'coordinator') => void;
  signOut: () => Promise<void> | void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
}

const AccountDropdownMenu: React.FC<AccountDropdownMenuProps> = ({
  isOpen,
  onClose,
  triggerRef,
  user,
  currentLanguageMeta,
  switchRole,
  signOut,
  navigate,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const targetEl = target as Element;
      if (
        (menuRef.current && menuRef.current.contains(target)) ||
        (triggerRef.current && triggerRef.current.contains(target)) ||
        targetEl.closest?.('[role="menu"]') ||
        targetEl.closest?.('button[aria-haspopup="menu"]')
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose, triggerRef]);

  // Focus management when menu opens
  useEffect(() => {
    if (isOpen) {
      // Focus first actionable menuitem on open
      const firstItem = menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]');
      firstItem?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation within menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }

    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]');
    if (!items || items.length === 0) return;

    const itemsArray = Array.from(items);
    const currentIndex = itemsArray.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < itemsArray.length - 1 ? currentIndex + 1 : 0;
      itemsArray[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : itemsArray.length - 1;
      itemsArray[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      itemsArray[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      itemsArray[itemsArray.length - 1]?.focus();
    }
  };

  const handleLanguageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    navigate('/language');
  };

  const handleCoordinatorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    if (user?.role === 'coordinator') {
      switchRole('coordinator');
      navigate(ROUTES.COORDINATOR_DASHBOARD);
    } else {
      navigate(ROUTES.COORDINATOR_LOGIN);
    }
  };

  const handleSignOutClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    try {
      await signOut();
      navigate(ROUTES.SIGN_IN, { replace: true });
    } catch {
      // error captured in AuthProvider
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Artisan Account Menu"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] glass-menu rounded-2xl p-4 shadow-xl z-50 motion-popover-enter flex flex-col gap-3"
    >
      {/* User Profile Summary */}
      <div className="flex items-center gap-3 pb-3 border-b border-surface-variant/80">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-base font-bold shrink-0 ring-1 ring-white/50">
          {user?.name?.charAt(0) || 'A'}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm text-primary truncate">{user?.name || 'Artisan'}</span>
          <span className="text-xs text-on-surface-variant truncate">{user?.workshopName || 'Artisan Workshop'}</span>
        </div>
      </div>

      {/* Sync Status Info */}
      <div className="flex items-center justify-between py-1 text-xs text-on-surface-variant">
        <span>Sync State:</span>
        <SyncStatusIndicator />
      </div>

      {/* Language Switching Action */}
      <button
        role="menuitem"
        type="button"
        onClick={handleLanguageClick}
        className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container text-xs font-semibold text-primary transition-colors text-left touch-target active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
      >
        <span className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-on-surface-variant" /> Change Language
        </span>
        <span className="text-secondary font-bold">{currentLanguageMeta.name}</span>
      </button>

      {/* Coordinator Portal View */}
      <button
        role="menuitem"
        type="button"
        onClick={handleCoordinatorClick}
        className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-container text-xs font-semibold text-primary transition-colors text-left touch-target active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
      >
        <Shield className="w-4 h-4 text-on-surface-variant" />
        <span>Coordinator Portal View</span>
      </button>

      {/* Sign Out */}
      <div className="pt-2 border-t border-surface-variant/80">
        <button
          role="menuitem"
          type="button"
          onClick={handleSignOutClick}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-error-container/60 hover:bg-error-container text-error text-xs font-bold transition-colors touch-target active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export const ArtisanTopNavigation: React.FC = () => {
  const { user, userAccount, signOut, switchRole } = useAuth();
  const { isPlaying, toggleHelp } = useAudioHelp();
  const { currentLanguageMeta } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEnquiriesOpen, setIsEnquiriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>([]);

  const desktopProfileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileProfileButtonRef = useRef<HTMLButtonElement>(null);
  const enquiryButtonRef = useRef<HTMLButtonElement>(null);
  const mobileEnquiryButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const currentArtisanId = userAccount?.uid || user?.id || (isEmulatorMode ? 'demo_artisan_ravi' : null);

  // Subscribe to authoritative enquiries for signed-in artisan
  useEffect(() => {
    if (!currentArtisanId) {
      setEnquiries([]);
      return;
    }

    if (enquiryRepository.subscribeArtisanEnquiries) {
      const unsub = enquiryRepository.subscribeArtisanEnquiries(currentArtisanId, (list) => {
        setEnquiries(list || []);
      });
      return unsub;
    } else {
      enquiryRepository
        .listArtisanEnquiries(currentArtisanId)
        .then((list) => {
          setEnquiries(list || []);
        })
        .catch(() => {
          setEnquiries([]);
        });
    }
  }, [currentArtisanId]);

  const unreadEnquiriesCount = enquiries.filter((e) => e.status === 'new').length;

  // Close menus on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsEnquiriesOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isMobileMenuOpen]);

  // Keyboard navigation (Escape to close mobile drawer)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      mobileMenuButtonRef.current?.focus({ preventScroll: true });
    }
  };

  // Primary navigation items
  const navLinks = [
    { to: '/artisan/dashboard', label: 'Home', icon: Home },
    { to: '/artisan/inventory', label: 'Inventory', icon: Package },
    { to: '/artisan/products/new/photos', label: 'New Product', icon: PlusCircle },
  ];

  return (
    <header
      onKeyDown={handleKeyDown}
      className="sticky top-0 z-40 w-full pt-2.5 sm:pt-3 select-none"
    >
      <div className="workspace-container w-full">
        {/* ========================================================= */}
        {/* DESKTOP & TABLET THREE-REGION CLEAR iOS GLASS HEADER      */}
        {/* Clear Glass: 56-58px height, rounded-[20px], top reflection */}
        {/* ========================================================= */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center h-[56px] sm:h-[58px] px-4 lg:px-5 glass-nav rounded-[20px] relative">
          {/* 1. Left Navigation: Home, Inventory, New Product */}
          <nav aria-label="Main Artisan Navigation" className="flex items-center gap-2 sm:gap-3 justify-start relative z-10">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'relative h-[34px] px-3 flex items-center text-[13px] font-semibold transition-all duration-150 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-lg active:scale-[0.98]',
                    isActive
                      ? 'text-primary font-bold bg-primary/[0.05]'
                      : 'text-on-surface-variant hover:text-primary hover:bg-primary/[0.03]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {/* Active indicator */}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 left-2.5 right-2.5 h-[2px] bg-secondary rounded-full animate-in fade-in duration-200"
                      />
                    )}
                    {isActive && <span className="sr-only"> (Current Page)</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* 2. Centred Brand Identity */}
          <div className="justify-self-center text-center relative z-10">
            <Link
              to="/artisan/dashboard"
              className="flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-md px-2 py-0.5 group active:scale-[0.98] transition-transform duration-150"
              aria-label="KarigarSaathi Home"
            >
              <span className="font-display text-xl lg:text-[21px] font-bold text-primary tracking-tight leading-none group-hover:text-secondary transition-colors">
                KarigarSaathi
              </span>
              <span className="text-[8.5px] text-on-surface-variant font-medium tracking-wider uppercase mt-0.5">
                Artisan Workspace
              </span>
            </Link>
          </div>

          {/* 3. Right Utilities: Listen, English, Synced, Messages, Profile */}
          <div className="flex items-center justify-end gap-2 lg:gap-2.5 relative z-10">
            {/* Audio Assistance (Listen) */}
            <button
              type="button"
              onClick={() => toggleHelp()}
              aria-label={isPlaying ? 'Stop audio assistance' : 'Listen to audio instructions'}
              className="flex items-center gap-1.5 h-[34px] px-2.5 lg:px-3 text-xs font-semibold text-primary bg-primary/[0.03] hover:bg-primary/[0.07] active:scale-[0.98] rounded-full transition-all duration-150 border border-primary/[0.08] touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              {isPlaying ? (
                <VolumeX className="w-3.5 h-3.5 text-secondary animate-pulse" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="hidden xl:inline">{isPlaying ? 'Playing...' : 'Listen'}</span>
              <span className="xl:hidden">{isPlaying ? 'Stop' : 'Listen'}</span>
            </button>

            {/* Language Selector (English / Hindi / etc.) */}
            <button
              type="button"
              onClick={() => navigate('/language')}
              aria-label={`Change language, current: ${currentLanguageMeta.name}`}
              className="flex items-center gap-1.5 h-[34px] px-2.5 lg:px-3 text-xs font-semibold text-primary bg-primary/[0.03] hover:bg-primary/[0.07] active:scale-[0.98] rounded-full transition-all duration-150 border border-primary/[0.08] touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <Globe className="w-3.5 h-3.5 text-on-surface-variant" />
              <span>{currentLanguageMeta.name}</span>
            </button>

            {/* Synced Status Badge (Compact 30px Translucent) */}
            <SyncStatusIndicator />

            {/* Buyer Enquiries Message Icon with Floating Popover */}
            <div className="relative">
              <button
                ref={enquiryButtonRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isEnquiriesOpen}
                aria-controls="buyer-enquiries-popover"
                aria-label="Open buyer enquiries"
                onClick={() => {
                  setIsEnquiriesOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                className={clsx(
                  'relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 touch-target select-none active:scale-[0.98]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                  isEnquiriesOpen
                    ? 'bg-secondary text-white shadow-xs'
                    : unreadEnquiriesCount > 0
                    ? 'bg-secondary-fixed/60 text-secondary hover:bg-secondary-fixed border border-secondary/25'
                    : 'bg-primary/[0.03] hover:bg-primary/[0.07] text-primary border border-primary/[0.08]'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                {unreadEnquiriesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 bg-secondary text-white text-[8.5px] font-bold rounded-full flex items-center justify-center shadow-xs border border-white">
                    {unreadEnquiriesCount}
                  </span>
                )}
              </button>

              {/* Floating Buyer Enquiries Popover */}
              <BuyerEnquiryPopover
                isOpen={isEnquiriesOpen}
                onClose={() => setIsEnquiriesOpen(false)}
                triggerRef={enquiryButtonRef}
                enquiries={enquiries}
              />
            </div>

            {/* Profile Avatar & Dropdown Trigger */}
            <div className="relative">
              <button
                ref={desktopProfileButtonRef}
                type="button"
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsEnquiriesOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                aria-label="Artisan account and settings menu"
                className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/50 hover:ring-2 hover:ring-secondary/40 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] touch-target shadow-xs"
              >
                {user?.name?.charAt(0) || 'A'}
              </button>

              {/* Profile Dropdown Popover */}
              <AccountDropdownMenu
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                triggerRef={desktopProfileButtonRef}
                user={user}
                currentLanguageMeta={currentLanguageMeta}
                switchRole={switchRole}
                signOut={signOut}
                navigate={navigate}
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE SLIM CLEAR iOS GLASS HEADER (< 768px)             */}
        {/* ========================================================= */}
        <div className="md:hidden flex items-center justify-between h-[52px] w-full px-3 glass-nav rounded-[16px] relative">
          {/* Brand Identity */}
          <Link
            to="/artisan/dashboard"
            className="flex flex-col select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-md p-1 relative z-10 active:scale-[0.98]"
            aria-label="KarigarSaathi Home"
          >
            <span className="font-display text-lg font-bold text-primary tracking-tight leading-none">
              KarigarSaathi
            </span>
            <span className="text-[8.5px] text-on-surface-variant font-medium tracking-wider uppercase mt-0.5">
              Artisan Workspace
            </span>
          </Link>

          {/* Right Utilities: Messages, Profile & Mobile Hamburger Menu */}
          <div className="flex items-center gap-2 relative z-10">
            {/* Mobile Buyer Enquiries Message Icon */}
            <div className="relative">
              <button
                ref={mobileEnquiryButtonRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isEnquiriesOpen}
                aria-controls="buyer-enquiries-popover"
                aria-label="Open buyer enquiries"
                onClick={() => {
                  setIsEnquiriesOpen((prev) => !prev);
                  setIsProfileOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={clsx(
                  'relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 touch-target active:scale-[0.98]',
                  isEnquiriesOpen
                    ? 'bg-secondary text-white'
                    : unreadEnquiriesCount > 0
                    ? 'bg-secondary-fixed text-secondary'
                    : 'bg-primary/[0.04] text-primary border border-primary/[0.08]'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                {unreadEnquiriesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 bg-secondary text-white text-[8.5px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadEnquiriesCount}
                  </span>
                )}
              </button>

              {/* Mobile Popover */}
              <BuyerEnquiryPopover
                isOpen={isEnquiriesOpen}
                onClose={() => setIsEnquiriesOpen(false)}
                triggerRef={mobileEnquiryButtonRef}
                enquiries={enquiries}
              />
            </div>

            {/* Mobile Profile Trigger & Dropdown */}
            <div className="relative">
              <button
                ref={mobileProfileButtonRef}
                type="button"
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsEnquiriesOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                aria-label="Artisan account menu"
                className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold touch-target ring-1 ring-white/50 active:scale-[0.98]"
              >
                {user?.name?.charAt(0) || 'A'}
              </button>

              {/* Mobile Profile Dropdown */}
              <AccountDropdownMenu
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                triggerRef={mobileProfileButtonRef}
                user={user}
                currentLanguageMeta={currentLanguageMeta}
                switchRole={switchRole}
                signOut={signOut}
                navigate={navigate}
              />
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              ref={mobileMenuButtonRef}
              type="button"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => {
                setIsMobileMenuOpen((prev) => !prev);
                setIsEnquiriesOpen(false);
                setIsProfileOpen(false);
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-primary bg-primary/[0.04] hover:bg-primary/[0.08] border border-primary/[0.08] active:scale-[0.98] transition-all duration-150 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE EXPANDED MENU DRAWER                               */}
        {/* ========================================================= */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            role="dialog"
            aria-label="Mobile Navigation Menu"
            className="md:hidden mt-1.5 p-3 rounded-[18px] glass-menu border border-surface-variant/60 shadow-xl flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-150 motion-reduce:animate-none"
          >
            {/* Primary Nav Links */}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-colors touch-target select-none active:scale-[0.98]',
                        isActive
                          ? 'bg-primary text-white font-bold'
                          : 'bg-primary/[0.04] text-primary hover:bg-primary/[0.08]'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Utilities Row: Listen & Language */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleHelp()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary/[0.04] hover:bg-primary/[0.08] text-primary font-semibold text-xs touch-target border border-primary/[0.08] active:scale-[0.98]"
              >
                {isPlaying ? <VolumeX className="w-4 h-4 text-secondary" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlaying ? 'Playing...' : 'Listen'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/language');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary/[0.04] hover:bg-primary/[0.08] text-primary font-semibold text-xs touch-target border border-primary/[0.08] active:scale-[0.98]"
              >
                <Globe className="w-4 h-4 text-on-surface-variant" />
                <span>{currentLanguageMeta.name}</span>
              </button>
            </div>

            {/* Sync State */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-primary/[0.03] text-xs text-on-surface-variant">
              <span>Sync Status</span>
              <SyncStatusIndicator />
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={async () => {
                setIsMobileMenuOpen(false);
                try {
                  await signOut();
                  navigate(ROUTES.SIGN_IN, { replace: true });
                } catch {
                  // error captured in AuthProvider
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-error-container/60 text-error font-bold text-xs touch-target active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

