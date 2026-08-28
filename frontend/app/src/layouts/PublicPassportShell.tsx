import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useAudioHelp } from '@/app/providers/AudioHelpProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { ROUTES } from '@/routes';
import { SkipLink } from '@/components/ui/SkipLink';
import { AriaLiveAnnouncer } from '@/components/ui/AriaLiveAnnouncer';

export const PublicPassportShell: React.FC = () => {
  const { isPlaying, toggleHelp } = useAudioHelp();
  const { currentLanguageMeta } = useLanguage();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.MARKETPLACE);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-app-bg text-on-background selection:bg-primary-container selection:text-white bg-ikat-pattern">
      <SkipLink targetId="main-content" />
      <AriaLiveAnnouncer />

      {/* Public Verified Top Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-surface-variant px-4 md:px-12 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Return to marketplace or previous page"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] text-primary hover:bg-surface-container rounded-full transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
            <ShieldCheck className="w-6 h-6 text-secondary group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl font-bold text-primary tracking-tight group-hover:text-secondary transition-colors">
              KarigarSaathi Craft Passport
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleHelp()}
            aria-label="Listen to audio story"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-container rounded-full transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isPlaying ? (
              <VolumeX className="w-4 h-4 text-secondary animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4 text-primary" />
            )}
            <span className="hidden sm:inline">{isPlaying ? 'Playing Story...' : 'Audio Story'}</span>
          </button>

          <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-variant">
            {currentLanguageMeta.name}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-10 max-w-5xl w-full mx-auto pb-16 focus:outline-none">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-surface-container-lowest border-t border-surface-variant py-8 px-4 text-center mt-auto">
        <div className="max-w-md mx-auto flex flex-col gap-2 text-xs text-on-surface-variant">
          <div className="flex items-center justify-center gap-1.5 text-primary font-bold">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span>Digital GI & Artisan Origin Verification Network</span>
          </div>
          <p>© 2026 KarigarSaathi. Empowering verified Indian artisans with immutable digital passports.</p>
        </div>
      </footer>
    </div>
  );
};
