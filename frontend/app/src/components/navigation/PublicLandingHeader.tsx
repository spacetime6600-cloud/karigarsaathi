import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, Info, ShoppingBag, Star, Home, Volume2, VolumeX } from 'lucide-react';
import { clsx } from 'clsx';
import { useAudioHelp } from '@/app/providers/AudioHelpProvider';

export const PublicLandingHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isPlaying, toggleHelp } = useAudioHelp();
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll listener for dynamic glass depth
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle outside click & escape key
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Click handler for Home link & logo: if already on '/', return to top respecting reduced motion
  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'About Us', path: '/about', icon: Info },
    { label: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
    { label: 'Reviews', path: '/reviews', icon: Star },
  ];

  return (
    <header className="sticky top-0 z-50 w-full pt-2.5 sm:pt-3 px-3 sm:px-6 select-none">
      <div className="max-w-[1220px] mx-auto w-full">
        {/* Desktop Clear iOS Warm Glass Header Row */}
        <div
          data-scrolled={isScrolled ? 'true' : 'false'}
          className="public-header__glass hidden md:flex items-center justify-between h-[56px] sm:h-[58px] px-4 lg:px-6 rounded-[26px] relative"
        >
          {/* Left: Brand Identity */}
          <Link
            to="/"
            onClick={handleHomeClick}
            className="flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-md px-2 py-0.5 group active:scale-[0.98] transition-transform duration-150 relative z-10"
            aria-label="KarigarSaathi Home"
          >
            <span className="font-display text-xl lg:text-[21px] font-bold public-header__brand-title tracking-tight leading-none group-hover:text-[#A13F1C] transition-colors">
              KarigarSaathi
            </span>
            <span className="text-[8.5px] public-header__brand-subtitle font-semibold tracking-wider uppercase mt-0.5">
              Artisan Digitisation
            </span>
          </Link>

          {/* Center: Public Page Navigation (Home | About Us | Marketplace | Reviews) */}
          <nav aria-label="Public Navigation" className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 relative z-10">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={item.path === '/' ? handleHomeClick : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'public-header__link relative flex items-center gap-1.5 px-3 lg:px-3.5 py-1.5 text-[13px] lg:text-[13.5px] rounded-xl touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] transition-colors',
                    isActive
                      ? 'font-bold'
                      : 'hover:text-[#A13F1C]'
                  )}
                >
                  {item.path === '/' && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Audio Listen + Sign In CTA */}
          <div className="flex items-center gap-2 relative z-10">
            <button
              type="button"
              onClick={() => toggleHelp()}
              aria-label={isPlaying ? 'Stop audio assistance' : 'Listen to audio instructions'}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/40 hover:bg-white/60 text-[#001D36] border border-white/50 transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              {isPlaying ? (
                <VolumeX className="w-3.5 h-3.5 text-[#C65A35] animate-pulse" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#001D36]" />
              )}
              <span className="text-[11px] font-bold">{isPlaying ? 'Playing...' : 'Listen'}</span>
            </button>

            <Link
              to="/sign-in"
              className="public-header__signin flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full active:scale-[0.98] transition-all duration-150 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </Link>
          </div>
        </div>

        {/* Mobile Header Row */}
        <div
          data-scrolled={isScrolled ? 'true' : 'false'}
          className="public-header__glass md:hidden flex items-center justify-between h-[52px] w-full px-3.5 rounded-[22px] relative"
        >
          <Link
            to="/"
            onClick={handleHomeClick}
            className="flex flex-col select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-md p-1 relative z-10"
            aria-label="KarigarSaathi Home"
          >
            <span className="font-display text-lg font-bold public-header__brand-title tracking-tight leading-none">
              KarigarSaathi
            </span>
            <span className="text-[8.5px] public-header__brand-subtitle font-semibold tracking-wider uppercase mt-0.5">
              Artisan Platform
            </span>
          </Link>

          <div className="flex items-center gap-2 relative z-10">
            <Link
              to="/sign-in"
              className="public-header__signin flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-colors touch-target"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </Link>

            <button
              ref={mobileMenuButtonRef}
              type="button"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#001D36] bg-white/30 border border-white/50 active:scale-[0.98] transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            role="dialog"
            aria-label="Public Navigation Menu"
            className="md:hidden mt-2 p-3 rounded-[22px] glass-menu shadow-xl flex flex-col gap-2 animate-in slide-in-from-top-2 duration-150 relative z-50"
          >
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (item.path === '/') handleHomeClick(e);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-colors text-left touch-target',
                    isActive
                      ? 'bg-[#A13F1C]/10 text-[#A13F1C] font-bold'
                      : 'text-[#001D36] hover:bg-white/40 hover:text-[#A13F1C]'
                  )}
                >
                  <Icon className="w-4 h-4 text-[#A13F1C]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-[#001D36]/10 flex flex-col gap-2">
              <Link
                to="/sign-in"
                onClick={() => setIsMobileMenuOpen(false)}
                className="public-header__signin w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs touch-target"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
