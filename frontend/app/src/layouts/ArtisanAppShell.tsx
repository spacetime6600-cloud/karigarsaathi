import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ArtisanTopNavigation } from '@/components/navigation/ArtisanTopNavigation';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PageAtmosphere } from '@/components/layout/PageAtmosphere';
import { SkipLink } from '@/components/ui/SkipLink';
import { AriaLiveAnnouncer } from '@/components/ui/AriaLiveAnnouncer';
import { PageTransitionContainer } from '@/components/layout/PageTransitionContainer';

export const ArtisanAppShell: React.FC = () => {
  return (
    <PageAtmosphere variant="subtle" position="top" className="min-h-screen flex flex-col antialiased">
      <SkipLink targetId="main-content" />
      <AriaLiveAnnouncer />
      <OfflineBanner />
      
      {/* Floating Top Liquid-Glass Navigation (Remains stable across transitions) */}
      <ArtisanTopNavigation />

      {/* Main Workspace Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full workspace-container py-6 md:py-8 focus:outline-none">
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
          <PageTransitionContainer>
            <Outlet />
          </PageTransitionContainer>
        </Suspense>
      </main>
    </PageAtmosphere>
  );
};
