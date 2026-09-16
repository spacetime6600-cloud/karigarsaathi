import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLandingHeader } from '@/components/navigation/PublicLandingHeader';
import { PageTransitionContainer } from '@/components/layout/PageTransitionContainer';

export interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9EF] text-on-surface antialiased selection:bg-secondary/20 relative isolate overflow-x-clip">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB955]"
      >
        Skip to main content
      </a>

      {/* Shared Clear iOS Glass Header */}
      <PublicLandingHeader />

      {/* Main Landmark Container */}
      <main id="main-content" className="flex-1 flex flex-col w-full relative z-10">
        <PageTransitionContainer>
          {children}
        </PageTransitionContainer>
      </main>

      {/* Shared Public Footer */}
      <footer className="w-full border-t border-[#001D36]/10 px-4 sm:px-8 lg:px-12 py-10 bg-transparent relative z-10">
        <div className="max-w-[1220px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <Link to="/" className="font-display text-lg font-bold text-primary hover:text-secondary transition-colors">
              KarigarSaathi
            </Link>
            <p className="text-xs text-on-surface-variant text-center sm:text-left">
              Craft digitisation and provenance platform for Indian artisans.
            </p>
          </div>

          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-semibold text-on-surface-variant">
            <Link to="/about" className="hover:text-primary transition-colors">
              About Us
            </Link>
            <Link to="/marketplace" className="hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link to="/reviews" className="hover:text-primary transition-colors">
              Reviews
            </Link>
            <Link to="/#how-it-works" className="hover:text-primary transition-colors">
              How it works
            </Link>
            <Link to="/#features" className="hover:text-primary transition-colors">
              Features
            </Link>
            <Link to="/#craft-map" className="hover:text-primary transition-colors">
              Craft map
            </Link>
            <Link to="/login" className="text-secondary font-bold hover:underline">
              Artisan sign in
            </Link>
          </nav>
        </div>

        <div className="max-w-[1220px] mx-auto w-full pt-6 mt-6 border-t border-[#001D36]/10 flex items-center justify-center text-[11px] text-on-surface-variant/70">
          <p>© {currentYear} KarigarSaathi. Preserving India’s living craft heritage.</p>
        </div>
      </footer>
    </div>
  );
};
