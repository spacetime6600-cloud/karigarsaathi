import React from 'react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { CraftThreadMark } from './CraftThreadMark';
import workshopNightPng from '@/assets/ecosystem/craft-workshop-night.png';

export interface KarigarLoaderProps {
  variant?: 'initial' | 'route' | 'auth';
  destination?: string;
  visible?: boolean;
  message?: string;
  onRetry?: () => void;
  error?: string | Error | null;
  className?: string;
}

const localizedMessages: Record<string, Record<string, string>> = {
  en: {
    home: 'Returning to the workshop',
    about: 'Opening our story',
    marketplace: 'Curating artisan work',
    reviews: 'Gathering community stories',
    login: 'Preparing secure sign-in',
    passport: 'Opening the Craft Passport',
    product: 'Preparing product details',
    artisan: 'Preparing your artisan workspace',
    coordinator: 'Preparing the coordinator workspace',
    default: 'Preparing your experience',
  },
  hi: {
    home: 'कार्यशाला में लौट रहे हैं',
    about: 'हमारी कहानी खोल रहे हैं',
    marketplace: 'शिल्प कला का संकलन हो रहा है',
    reviews: 'सामुदायिक कहानियाँ एकत्रित की जा रही हैं',
    login: 'सुरक्षित साइन-इन तैयार हो रहा है',
    passport: 'शिल्प पासपोर्ट खुल रहा है',
    product: 'उत्पाद विवरण तैयार हो रहे हैं',
    artisan: 'कारीगर कार्यक्षेत्र तैयार हो रहा है',
    coordinator: 'समन्वयक कार्यक्षेत्र तैयार हो रहा है',
    default: 'आपका अनुभव तैयार किया जा रहा है',
  },
  or: {
    home: 'କର୍ମଶାଳାକୁ ଫେରୁଛୁ',
    about: 'ଆମ କାହାଣୀ ଖୋଲୁଛୁ',
    marketplace: 'କାରିଗରୀ କଳା ସଜାଯାଉଛି',
    reviews: 'କମ୍ୟୁନିଟି କାହାଣୀ ସଂଗ୍ରହ ହେଉଛି',
    login: 'ସୁରକ୍ଷିତ ସାଇନ୍-ଇନ୍ ପ୍ରସ୍ତୁତ ହେଉଛି',
    passport: 'ଶିଳ୍ପ ପାସପୋର୍ଟ ଖୋଲୁଛି',
    product: 'ଉତ୍ପାଦ ବିବରଣୀ ପ୍ରସ୍ତୁତ ହେଉଛି',
    artisan: 'କାରିଗର କାର୍ଯ୍ୟକ୍ଷେତ୍ର ପ୍ରସ୍ତୁତ ହେଉଛି',
    coordinator: 'ସଂଯୋଜକ କାର୍ଯ୍ୟକ୍ଷେତ୍ର ପ୍ରସ୍ତୁତ ହେଉଛି',
    default: 'ଆପଣଙ୍କ ଅନୁଭବ ପ୍ରସ୍ତୁତ ହେଉଛି',
  },
  bn: {
    home: 'কর্মশালায় ফিরে যাচ্ছি',
    about: 'আমাদের গল্প খুলছি',
    marketplace: 'কারিগরির সম্ভার সাজানো হচ্ছে',
    reviews: 'কমিউনিটির অভিজ্ঞতা সংগ্রহ করা হচ্ছে',
    login: 'নিরাপদ সাইন-ইন প্রস্তুত হচ্ছে',
    passport: 'ক্রাফট পাসপোর্ট খোলা হচ্ছে',
    product: 'পণ্যের বিবরণ তৈরি হচ্ছে',
    artisan: 'কারিগর কর্মক্ষেত্র প্রস্তুত হচ্ছে',
    coordinator: 'সমন্বয়কারী কর্মক্ষেত্র প্রস্তুত হচ্ছে',
    default: 'আপনার অভিজ্ঞতা প্রস্তুত করা হচ্ছে',
  },
};

export function resolveDestinationKey(dest?: string): string {
  if (!dest) return 'default';
  const clean = dest.toLowerCase().trim().replace(/^[#?]/, '');
  if (clean === '/' || clean === 'home' || clean === '') return 'home';
  if (clean.includes('about')) return 'about';
  if (clean.includes('marketplace') && !clean.includes('product')) return 'marketplace';
  if (clean.includes('product')) return 'product';
  if (clean.includes('review')) return 'reviews';
  if (clean.includes('login') || clean.includes('sign-in')) return 'login';
  if (clean.includes('passport') || clean.startsWith('/p/')) return 'passport';
  if (clean.includes('coordinator')) return 'coordinator';
  if (clean.includes('artisan') || clean.includes('inventory') || clean.includes('enquiries')) return 'artisan';
  return 'default';
}

/**
 * KarigarLoader
 * Canonical, accessible loader component for KarigarSaathi.
 *
 * Variants:
 * - 'initial': Full-viewport startup loader with rich navy depth, subtle workshop texture and entrance/exit lift.
 * - 'route': Translucent atmospheric veil preserving current page visibility while preparing lazy destinations.
 * - 'auth': Security and credential resolution loader.
 */
export const KarigarLoader: React.FC<KarigarLoaderProps> = ({
  variant = 'route',
  destination,
  visible = true,
  message,
  onRetry,
  error,
  className,
}) => {
  // Determine language safely
  let lang = 'en';
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedLanguage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'string' && localizedMessages[parsed]) {
          lang = parsed;
        }
      }
    }
  } catch {
    lang = 'en';
  }

  const destKey = variant === 'auth' && !destination ? 'login' : resolveDestinationKey(destination);
  const displayMessage =
    message ||
    localizedMessages[lang]?.[destKey] ||
    localizedMessages.en[destKey] ||
    localizedMessages.en.default;

  if (!visible && !error) {
    return null;
  }

  const isInitial = variant === 'initial';
  const isRoute = variant === 'route';
  const isAuth = variant === 'auth';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!error}
      data-variant={variant}
      className={clsx(
        'karigar-loader select-none',
        // Layout positioning
        isInitial && 'karigar-loader--initial fixed inset-0 z-50 flex flex-col items-center justify-center p-6',
        isRoute && 'karigar-loader--route fixed inset-0 z-40 flex flex-col items-center justify-center p-6',
        isAuth && 'karigar-loader--auth fixed inset-0 z-50 flex flex-col items-center justify-center p-6',
        className
      )}
      style={{
        ...(isInitial || isAuth
          ? {
              background:
                'radial-gradient(circle at 50% 44%, color-mix(in srgb, var(--color-secondary, #A13F1C) 10%, transparent), transparent 38%), var(--color-navy, #001D36)',
            }
          : {
              background: 'color-mix(in srgb, var(--color-navy, #001D36) 82%, transparent)',
              backdropFilter: 'blur(10px) saturate(115%)',
              WebkitBackdropFilter: 'blur(10px) saturate(115%)',
            }),
      }}
    >
      {/* Subtle workshop texture overlay for initial load (below 8% visibility) */}
      {(isInitial || isAuth) && (
        <img
          src={workshopNightPng}
          alt=""
          role="presentation"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-[0.04] mix-blend-luminosity"
        />
      )}

      {/* Screen-reader status announcement */}
      <span className="sr-only">
        {error ? 'Error loading page content' : `Loading ${destination || 'page'}: ${displayMessage}`}
      </span>

      {/* Main Centered Content */}
      <div className="karigar-loader__content relative z-10 flex flex-col items-center justify-center max-w-sm text-center">
        {/* Brand Title */}
        <span className="font-display text-2xl sm:text-[30px] font-bold text-[#FFF9EF] tracking-tight leading-none">
          KarigarSaathi
        </span>

        {/* Brand Subtitle Tag */}
        <span className="font-sans text-[10px] sm:text-[11px] font-bold text-[#A13F1C] tracking-[0.16em] uppercase mt-2 select-none">
          ARTISAN DIGITISATION
        </span>

        {/* Error State or Animated Mark */}
        {error ? (
          <div className="flex flex-col items-center gap-3 my-6 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-[#A13F1C]/20 border border-[#A13F1C]/40 flex items-center justify-center text-[#A13F1C]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#FFF9EF]">
              Unable to load this section
            </p>
            <p className="text-xs text-[#FFF9EF]/70 max-w-xs leading-relaxed">
              {typeof error === 'string' && error !== 'Route error'
                ? error
                : 'A temporary network connection issue occurred while preparing the page.'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={onRetry || (() => window.location.reload())}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A13F1C] hover:bg-[#A13F1C]/90 text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
              <Link
                to="/"
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.href = '/';
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FFF9EF] border border-white/20 font-bold text-xs transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return home</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Animated Craft-Thread Mark */}
            <div className="my-5 sm:my-6">
              <CraftThreadMark size={isInitial ? 'lg' : 'md'} />
            </div>

            {/* Contextual Route Message */}
            <p className="font-sans text-[14px] sm:text-[15px] font-medium text-[#FFF9EF]/80 text-center px-4 leading-normal">
              {displayMessage}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
