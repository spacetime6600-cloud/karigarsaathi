import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLandingHeader } from '@/components/navigation/PublicLandingHeader';
import { LandingAtmosphere } from '@/components/layout/LandingAtmosphere';
import { IndiaCraftMap } from '@/components/map/IndiaCraftMap';
import { CraftGalleryBanner } from '@/components/gallery/CraftGalleryBanner';
import {
  Camera,
  Mic,
  Calculator,
  QrCode,
  Share2,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Wifi,
  Sparkles,
  ArrowRight,
  Globe,
  Edit3,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // One-time lightweight section reveal observer (0 layout shifts, respects reduced-motion)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.motion-reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.querySelectorAll('.motion-reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    const elements = document.querySelectorAll('.motion-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page min-h-screen flex flex-col bg-[#FFF9EF] text-on-surface antialiased selection:bg-secondary/20 relative isolate overflow-x-clip">
      {/* Skip to Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Public Clear iOS Glass Top Header (Floats above Hero) */}
      <PublicLandingHeader />

      {/* ========================================================================= */}
      {/* CONTINUOUS PAGE-LEVEL ATMOSPHERE (Overlapping, transparency-masked layers)  */}
      {/* ========================================================================= */}
      <LandingAtmosphere aria-hidden="true" />

      {/* Main Content Sections (All transparent, sitting on the continuous canvas) */}
      <main id="main-content" className="flex-1 flex flex-col w-full -mt-[58px] sm:-mt-[60px] relative z-10 overflow-visible">
        {/* ========================================================= */}
        {/* SECTION 1: HERO                                           */}
        {/* ========================================================= */}
        <section
          id="hero"
          aria-label="Introduction"
          className="flex items-center justify-center px-4 sm:px-8 lg:px-12 pt-28 pb-20 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-32 w-full min-h-[640px] sm:min-h-[700px] lg:min-h-[760px] bg-transparent"
        >
          <div className="max-w-[1220px] w-full mx-auto flex flex-col items-start">
            <div className="max-w-[540px] flex flex-col gap-4">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold w-fit shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#FFB955]" />
                <span>Built for India’s artisans</span>
              </div>

              {/* Main Heading */}
              <h1 className="font-display text-[clamp(1.85rem,1.25rem+2.5vw,2.875rem)] font-bold text-white leading-[1.14] tracking-tight drop-shadow-sm">
                From handmade craft to a market-ready catalogue.
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-white/90 leading-relaxed drop-shadow-xs font-normal">
                Photograph products, describe the craft, understand fair pricing, create a Craft Passport and respond to buyer enquiries.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to="/sign-in"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-secondary hover:bg-secondary/90 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all duration-150 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
                >
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection('craft-map-section')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/35 backdrop-blur-md font-bold text-xs active:scale-[0.98] transition-all duration-150 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
                >
                  <span>Explore craft traditions</span>
                </button>
              </div>

              {/* Trust Indicators Row */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-3.5 pt-4 text-xs text-white/90 font-medium">
                <div className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-[#FFB955] shrink-0" />
                  <span>Voice-first</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-[#FFB955] shrink-0" />
                  <span>Editable at every step</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-[#FFB955] shrink-0" />
                  <span>Low-connectivity aware</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFB955] shrink-0" />
                  <span>Artisan stays in control</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: HOW IT WORKS / GUIDED WORKFLOW                 */}
        {/* ========================================================= */}
        <section
          id="how-it-works"
          aria-label="How it works"
          className="motion-reveal px-4 sm:px-8 lg:px-12 py-14 lg:py-20 max-w-[1220px] w-full mx-auto flex flex-col gap-10 bg-transparent"
        >
          <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Step-By-Step Workflow
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight">
              One guided path from craft to catalogue
            </h2>
            <p className="text-sm text-on-surface-variant">
              Each stage is clear, editable and controlled by the artisan.
            </p>
          </div>

          {/* Editorial Four-Step Workflow: Unboxed, side-by-side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:[grid-template-columns:repeat(4,minmax(0,1fr))] gap-8 md:gap-x-12 md:gap-y-10 lg:gap-0">
            {/* Step 1: Capture */}
            <div className="workflow-step relative flex flex-row items-start gap-5 pb-8 last:pb-0 md:flex-col md:items-start md:gap-0 md:pb-0 lg:pl-0 lg:pr-8 xl:pr-10">
              {/* Mobile Timeline Track */}
              <div
                className="md:hidden absolute left-[21px] top-12 bottom-0 w-px bg-[color-mix(in_srgb,var(--color-primary,#001D36)_12%,transparent)]"
                aria-hidden="true"
              />

              {/* Number */}
              <span className="font-sans text-[44px] sm:text-[48px] lg:text-[48px] font-medium leading-none text-secondary/70 shrink-0 select-none tracking-tight pt-0.5 md:pt-0">
                01
              </span>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0 md:w-full">
                <div className="flex items-center gap-2.5 md:mt-4 lg:mt-5 mb-1.5 md:mb-2 lg:mb-2.5">
                  <h3 className="font-sans text-xl lg:text-[22px] font-semibold text-primary tracking-tight">
                    Capture
                  </h3>
                  <Camera
                    className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-secondary/80 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-sans text-sm lg:text-[15px] font-normal text-on-surface-variant leading-relaxed">
                  Take or select product photographs and review them before continuing.
                </p>
              </div>
            </div>

            {/* Step 2: Create */}
            <div className="workflow-step relative flex flex-row items-start gap-5 pb-8 last:pb-0 md:flex-col md:items-start md:gap-0 md:pb-0 lg:pl-8 xl:pl-10 lg:pr-8 xl:pr-10 lg:border-l lg:border-[color-mix(in_srgb,var(--color-primary,#001D36)_12%,transparent)]">
              {/* Mobile Timeline Track */}
              <div
                className="md:hidden absolute left-[21px] top-12 bottom-0 w-px bg-[color-mix(in_srgb,var(--color-primary,#001D36)_12%,transparent)]"
                aria-hidden="true"
              />

              {/* Number */}
              <span className="font-sans text-[44px] sm:text-[48px] lg:text-[48px] font-medium leading-none text-secondary/70 shrink-0 select-none tracking-tight pt-0.5 md:pt-0">
                02
              </span>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0 md:w-full">
                <div className="flex items-center gap-2.5 md:mt-4 lg:mt-5 mb-1.5 md:mb-2 lg:mb-2.5">
                  <h3 className="font-sans text-xl lg:text-[22px] font-semibold text-primary tracking-tight">
                    Create
                  </h3>
                  <Mic
                    className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-secondary/80 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-sans text-sm lg:text-[15px] font-normal text-on-surface-variant leading-relaxed">
                  Speak or type the craft details, then correct every generated field.
                </p>
              </div>
            </div>

            {/* Step 3: Confirm */}
            <div className="workflow-step relative flex flex-row items-start gap-5 pb-8 last:pb-0 md:flex-col md:items-start md:gap-0 md:pb-0 lg:pl-8 xl:pl-10 lg:pr-8 xl:pr-10 lg:border-l lg:border-[color-mix(in_srgb,var(--color-primary,#001D36)_12%,transparent)]">
              {/* Mobile Timeline Track */}
              <div
                className="md:hidden absolute left-[21px] top-12 bottom-0 w-px bg-[color-mix(in_srgb,var(--color-primary,#001D36)_12%,transparent)]"
                aria-hidden="true"
              />

              {/* Number */}
              <span className="font-sans text-[44px] sm:text-[48px] lg:text-[48px] font-medium leading-none text-secondary/70 shrink-0 select-none tracking-tight pt-0.5 md:pt-0">
                03
              </span>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0 md:w-full">
                <div className="flex items-center gap-2.5 md:mt-4 lg:mt-5 mb-1.5 md:mb-2 lg:mb-2.5">
                  <h3 className="font-sans text-xl lg:text-[22px] font-semibold text-primary tracking-tight">
                    Confirm
                  </h3>
                  <Calculator
                    className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-secondary/80 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-sans text-sm lg:text-[15px] font-normal text-on-surface-variant leading-relaxed">
                  Review the listing, understand the suggested price and approve the Craft Passport.
                </p>
              </div>
            </div>

            {/* Step 4: Connect */}
            <div className="workflow-step relative flex flex-row items-start gap-5 pb-8 last:pb-0 md:flex-col md:items-start md:gap-0 md:pb-0 lg:pl-8 xl:pl-10 lg:pr-0 lg:border-l lg:border-[color-mix(in_srgb,var(--color-primary,#001D36)_12%,transparent)]">
              {/* Number */}
              <span className="font-sans text-[44px] sm:text-[48px] lg:text-[48px] font-medium leading-none text-secondary/70 shrink-0 select-none tracking-tight pt-0.5 md:pt-0">
                04
              </span>

              {/* Content */}
              <div className="flex flex-col flex-1 min-w-0 md:w-full">
                <div className="flex items-center gap-2.5 md:mt-4 lg:mt-5 mb-1.5 md:mb-2 lg:mb-2.5">
                  <h3 className="font-sans text-xl lg:text-[22px] font-semibold text-primary tracking-tight">
                    Connect
                  </h3>
                  <Share2
                    className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-secondary/80 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-sans text-sm lg:text-[15px] font-normal text-on-surface-variant leading-relaxed">
                  Export the catalogue and continue buyer conversations from one workspace.
                </p>
              </div>
            </div>
          </div>

          {/* Supporting Artisan Craft Visual Exhibition (Compact Animated Gallery) */}
          <CraftGalleryBanner />
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: FEATURES & TOOLKIT                             */}
        {/* ========================================================= */}
        <section
          id="features"
          aria-label="Capabilities"
          className="motion-reveal px-4 sm:px-8 lg:px-12 py-14 lg:py-20 bg-transparent"
        >
          <div className="max-w-[1220px] w-full mx-auto flex flex-col gap-10">
            <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Built-in Toolkit
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight">
                Everything needed to present a craft clearly
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-[#FFF9EF]/85 backdrop-blur-xs rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-sm text-primary">Better product photographs</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Capture or choose a photograph, review the result and keep the original safe.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#FFF9EF]/85 backdrop-blur-xs rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-sm text-primary">Voice and manual details</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Describe the craft by voice or enter it manually. Every field remains editable.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#FFF9EF]/85 backdrop-blur-xs rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-sm text-primary">Explainable fair pricing</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Review material, labour, overhead and margin before choosing the final price.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#FFF9EF]/85 backdrop-blur-xs rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-sm text-primary">QR Craft Passport</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Carry the product’s origin, materials, technique and story in a shareable Passport.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-[#FFF9EF]/85 backdrop-blur-xs rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-sm text-primary">Catalogue export</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Prepare listings for WhatsApp and buyer catalogues without repeating the work.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-[#FFF9EF]/85 backdrop-blur-xs rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-sm text-primary">Buyer enquiries</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Read requests, review quantities and reply from the artisan workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: INTERACTIVE INDIA CRAFT MAP                     */}
        {/* ========================================================= */}
        <section
          id="craft-map-section"
          aria-label="Interactive India Craft Map"
          className="motion-reveal px-4 sm:px-8 lg:px-12 py-14 lg:py-20 max-w-[1220px] w-full mx-auto flex flex-col gap-8 bg-transparent overflow-visible relative"
        >
          <span id="craft-map" className="sr-only" aria-hidden="true" />
          <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Artisanal Geography
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight">
              Explore craft traditions across India
            </h2>
            <p className="text-sm text-on-surface-variant">
              Choose a state or union territory to explore its craft traditions.
            </p>
          </div>

          {/* Interactive Map Component (Floating directly over calm central plaster wall) */}
          <IndiaCraftMap />
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: ETHICAL PHILOSOPHY / ARTISAN STORY             */}
        {/* ========================================================= */}
        <section
          id="artisan-story"
          aria-label="Artisan Control Story"
          className="motion-reveal px-4 sm:px-8 lg:px-12 py-14 lg:py-20 w-full max-w-[1220px] mx-auto bg-transparent"
        >
          <div className="w-full bg-[#001D36] rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Left Column: Heading & Philosophy */}
            <div className="flex flex-col gap-3.5 max-w-xl text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FFB955]">
                Ethical Philosophy
              </span>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                The artisan remains in control.
              </h2>

              <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
                KarigarSaathi suggests, explains and organises. The maker reviews every description, price and Craft Passport before sharing.
              </p>
            </div>

            {/* Right Column: 4 Trust & Accessibility Pillars (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:max-w-lg shrink-0">
              <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                <CheckCircle2 className="w-5 h-5 text-[#4BB543] shrink-0" />
                <span>Editable at every step</span>
              </div>

              <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                <CheckCircle2 className="w-5 h-5 text-[#4BB543] shrink-0" />
                <span>Manual fallback available</span>
              </div>

              <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                <CheckCircle2 className="w-5 h-5 text-[#4BB543] shrink-0" />
                <span>Designed for low connectivity</span>
              </div>

              <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-white">
                <Globe className="w-5 h-5 text-[#FFB955] shrink-0" />
                <span>English, Hindi, Odia & Bengali</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 6: FINAL CALL TO ACTION                           */}
        {/* ========================================================= */}
        <section
          id="cta"
          aria-label="Call to action"
          className="motion-reveal px-4 sm:px-8 lg:px-12 py-16 lg:py-24 max-w-[1220px] w-full mx-auto text-center flex flex-col items-center gap-6 bg-transparent"
        >
          <div className="max-w-xl flex flex-col gap-2">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Ready to digitise your craft?
            </h2>
            <p className="text-sm text-white/80">
              Start with one product and move through the process at your own pace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/sign-in"
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-secondary hover:bg-secondary/90 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all duration-150 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md font-bold text-xs active:scale-[0.98] transition-all duration-150 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <span>See how it works</span>
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FOOTER                                                    */}
        {/* ========================================================= */}
        <footer className="w-full border-t border-white/10 px-4 sm:px-8 lg:px-12 py-10 bg-transparent">
          <div className="max-w-[1220px] mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span className="font-display text-lg font-bold text-white">
                KarigarSaathi
              </span>
              <p className="text-xs text-white/70 text-center sm:text-left">
                Craft digitisation and provenance platform for Indian artisans.
              </p>
            </div>

            <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-semibold text-white/80">
              <Link to="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
              <Link to="/marketplace" className="hover:text-white transition-colors">
                Marketplace
              </Link>
              <Link to="/reviews" className="hover:text-white transition-colors">
                Reviews
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-white transition-colors"
              >
                How it works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="hover:text-white transition-colors"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('craft-map-section')}
                className="hover:text-white transition-colors"
              >
                Craft map
              </button>
              <Link to="/sign-in" className="text-[#FFB955] font-bold hover:underline">
                Sign in
              </Link>
            </nav>
          </div>

          <div className="max-w-[1220px] mx-auto w-full pt-6 mt-6 border-t border-white/10 flex items-center justify-center text-[11px] text-white/60">
            <p>© {currentYear} KarigarSaathi. Preserving India’s living craft heritage.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};
