import React from 'react';
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
      
      {/* Floating Top Liquid-Glass Navigation */}
      <ArtisanTopNavigation />

      {/* Main Workspace Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 focus:outline-none">
        <PageTransitionContainer>
          <Outlet />
        </PageTransitionContainer>
      </main>
    </PageAtmosphere>
  );
};
