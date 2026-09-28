import React, { Suspense } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { PublicLandingHeader } from '@/components/navigation/PublicLandingHeader';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PageAtmosphere } from '@/components/layout/PageAtmosphere';
import { SkipLink } from '@/components/ui/SkipLink';
import { AriaLiveAnnouncer } from '@/components/ui/AriaLiveAnnouncer';
import { PageTransitionContainer } from '@/components/layout/PageTransitionContainer';

export const OnboardingShell: React.FC = () => {
  return (
    <PageAtmosphere variant="dark" position="center" className="min-h-screen flex flex-col">
      <SkipLink targetId="main-content" />
      <AriaLiveAnnouncer />
      <OfflineBanner />

      {/* Shared Public Top Glass Navigation Bar (Remains stable during transitions) */}
      <PublicLandingHeader />

      {/* Centered Main Canvas */}
      <main id="main-content" tabIndex={-1} className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-[1200px] mx-auto z-10 relative focus:outline-none">
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="w-full min-h-[40vh] flex items-center justify-center opacity-30"
            >
              <div className="w-5 h-5 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
            </div>
          }
        >
          <PageTransitionContainer className="flex flex-col items-center justify-center">
            <Outlet />
          </PageTransitionContainer>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto flex flex-col items-center gap-2 py-4 px-4 border-t border-white/10 z-10 relative text-white/70 text-xs">
        <p className="text-center font-medium">
          © 2026 KarigarSaathi (कारीगर साथी). Provenance & Market Linkage for Indian Artisans.
        </p>
        <div className="flex gap-6 text-[11px] text-white/60">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span className="hover:text-white cursor-pointer">Terms</span>
          <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white cursor-pointer">Artisan Helpline</span>
        </div>
      </footer>
    </PageAtmosphere>
  );
};
