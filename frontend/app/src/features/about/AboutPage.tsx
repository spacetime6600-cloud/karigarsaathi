import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import {
  Camera,
  Mic,
  Calculator,
  QrCode,
  ShieldCheck,
  Globe,
  Wifi,
  Users,
  UserCheck,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import workshopLightPng from '@/assets/ecosystem/craft-workshop-light.png';

export const AboutPage: React.FC = () => {
  return (
    <PublicLayout>
      {/* Background Atmosphere for Internal Page (Light workshop over warm cream without video) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <img
          src={workshopLightPng}
          alt=""
          role="presentation"
          loading="lazy"
          decoding="async"
          className="w-full h-[1200px] object-cover opacity-12"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 249, 239, 0.7) 0%, rgba(255, 249, 239, 0.95) 400px, #FFF9EF 800px)',
          }}
        />
      </div>

      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16 flex flex-col gap-16 sm:gap-20 relative z-10">
        {/* ========================================================= */}
        {/* 1. PAGE INTRODUCTION                                      */}
        {/* ========================================================= */}
        <section aria-label="About KarigarSaathi Introduction" className="flex flex-col gap-5 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold w-fit shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artisan Dignity & Provenance</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary leading-tight tracking-tight">
            Technology that works with artisans, not around them.
          </h1>

          <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
            KarigarSaathi helps artisans transform handmade products into clear, market-ready digital catalogues while preserving their voice, craft identity and control.
          </p>
        </section>

        {/* ========================================================= */}
        {/* 2. THE CHALLENGE                                          */}
        {/* ========================================================= */}
        <section aria-label="The Challenge Faced by Artisans" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Context & Reality
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              The challenge of handmade craft digitisation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#001D36]/10 shadow-xs flex flex-col gap-2">
              <h3 className="font-bold text-base text-primary">Intermittent Market Access</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Many artisans depend on seasonal craft exhibitions and local weekly haats, leaving long gaps between sales and limited direct outreach to distant buyers.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#001D36]/10 shadow-xs flex flex-col gap-2">
              <h3 className="font-bold text-base text-primary">Complex Cataloguing Friction</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Publishing standard digital listings demands consistent studio photography, descriptive copywriting, cost formulas and complex e-commerce interfaces.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#001D36]/10 shadow-xs flex flex-col gap-2">
              <h3 className="font-bold text-base text-primary">Language & Connectivity Barriers</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Conventional e-commerce platforms rely heavily on English text entry, high-bandwidth connections, and technical terminology unfamiliar to village clusters.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-5 sm:p-6 border border-[#001D36]/10 shadow-xs flex flex-col gap-2">
              <h3 className="font-bold text-base text-primary">Maintaining Maker Control</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Artisans need direct, ongoing communication with conscious buyers and institutions without intermediaries dictating prices or diluting their craft lineage.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. WHAT KARIGARSAATHI PROVIDES                            */}
        {/* ========================================================= */}
        <section aria-label="What KarigarSaathi Provides" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Platform Capabilities
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              A complete toolkit built for authentic craft
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/85 rounded-2xl p-4 sm:p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-3">
              <Camera className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <h4 className="font-bold text-xs sm:text-sm text-primary">AI Photography Guidance</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Clear photo prompts and background cleanup to showcase craft textures cleanly.
                </p>
              </div>
            </div>

            <div className="bg-white/85 rounded-2xl p-4 sm:p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-3">
              <Mic className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <h4 className="font-bold text-xs sm:text-sm text-primary">Voice-First Product Entry</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Speak in Hindi, Odia, Bengali, Telugu or English to record craft details naturally.
                </p>
              </div>
            </div>

            <div className="bg-white/85 rounded-2xl p-4 sm:p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-3">
              <Calculator className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <h4 className="font-bold text-xs sm:text-sm text-primary">Explainable Fair Pricing</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Transparent breakdown of materials, labour hours, overhead and maker margins.
                </p>
              </div>
            </div>

            <div className="bg-white/85 rounded-2xl p-4 sm:p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-3">
              <QrCode className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <h4 className="font-bold text-xs sm:text-sm text-primary">QR Craft Passport</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Verifiable digital certificate conveying materials, artisan identity, and heritage.
                </p>
              </div>
            </div>

            <div className="bg-white/85 rounded-2xl p-4 sm:p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-3">
              <ShoppingBag className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <h4 className="font-bold text-xs sm:text-sm text-primary">Marketplace Discovery</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Public discovery for retail and institutional buyers looking for authentic goods.
                </p>
              </div>
            </div>

            <div className="bg-white/85 rounded-2xl p-4 sm:p-5 border border-[#001D36]/10 shadow-xs flex items-start gap-3">
              <Wifi className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <h4 className="font-bold text-xs sm:text-sm text-primary">Low-Connectivity Aware</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Works offline with automated sync when returning to network range.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. WHO IT SUPPORTS                                        */}
        {/* ========================================================= */}
        <section aria-label="Who KarigarSaathi Supports" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Community Roles
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Designed for the entire craft ecosystem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Artisans */}
            <div className="bg-white/90 rounded-2xl p-6 border border-[#001D36]/10 shadow-xs flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-primary">Artisans</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Create, review, and control their digital catalogue with voice or manual tools in their native tongue.
              </p>
            </div>

            {/* Coordinators */}
            <div className="bg-white/90 rounded-2xl p-6 border border-[#001D36]/10 shadow-xs flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-primary">Coordinators</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Field coordinators and self-help group leaders help onboard artisans and assist with digitisation.
              </p>
            </div>

            {/* Buyers */}
            <div className="bg-white/90 rounded-2xl p-6 border border-[#001D36]/10 shadow-xs flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-primary">Buyers</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Discover genuine handmade traditions, inspect verifiable Craft Passports, and initiate direct enquiries.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. ARTISAN CONTROL PRINCIPLES                             */}
        {/* ========================================================= */}
        <section aria-label="Artisan Control Principles" className="bg-[#001D36] text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFB955]">
              Core Ethics
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              The artisan retains complete ownership and approval.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-2xl p-4">
              <CheckCircle2 className="w-5 h-5 text-[#4BB543] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs sm:text-sm">
                <span className="font-bold text-white">AI Suggestions Remain Editable</span>
                <span className="text-white/80">
                  Every auto-generated tag, description, and fact can be edited or overwritten at any time.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-2xl p-4">
              <CheckCircle2 className="w-5 h-5 text-[#4BB543] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs sm:text-sm">
                <span className="font-bold text-white">Explicit Publish Approval</span>
                <span className="text-white/80">
                  Nothing is exported, shared or published to buyers without explicit artisan confirmation.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-2xl p-4">
              <CheckCircle2 className="w-5 h-5 text-[#4BB543] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs sm:text-sm">
                <span className="font-bold text-white">Explainable Fair Pricing</span>
                <span className="text-white/80">
                  Price guidance is formulated with open formulas, not presented as an enforced mandate.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-2xl p-4">
              <Lock className="w-5 h-5 text-[#FFB955] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs sm:text-sm">
                <span className="font-bold text-white">Protected Heritage & Identity</span>
                <span className="text-white/80">
                  Artisans select which phone numbers, workshop details and story points are public.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. ACCESSIBILITY & INCLUSION                              */}
        {/* ========================================================= */}
        <section aria-label="Accessibility and Inclusion" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Universal Access
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Built for every maker, device and connectivity level
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Globe className="w-4 h-4 text-secondary" />
                <span>Multilingual Support</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Full interface and speech recognition available in Hindi, Odia, Bengali, Telugu, and English.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span>Simple Step-by-Step UI</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Uncluttered sequential flow with large touch targets, visual cues, and zero technical jargon.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 border border-[#001D36]/10 shadow-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Wifi className="w-4 h-4 text-secondary" />
                <span>Low-Bandwidth Resilient</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Lightweight asset footprints and offline draft persistence tailored for rural craft regions.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. CLOSING CTA                                            */}
        {/* ========================================================= */}
        <section aria-label="About Us Call to Action" className="bg-white/90 rounded-3xl p-8 sm:p-12 border border-[#001D36]/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h3 className="font-display text-2xl font-bold text-primary">
              Ready to explore living craft traditions?
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Discover authentic handmade items or sign in to your artisan workshop.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/marketplace"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-secondary hover:bg-secondary/90 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <span>Explore the marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/sign-in"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
            >
              <span>Sign in</span>
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
