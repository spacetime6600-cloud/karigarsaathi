import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { ROUTES, getSafeReturnUrl } from '@/routes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Mail,
  Lock,
  User,
  MoveRight,
  Loader2,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

export const SignInPage: React.FC = () => {
  const { signInWithEmail, registerArtisan, isAuthenticated, isLoading: authLoading, user, userAccount } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Extract and sanitize target return URL (from search param or location state)
  const fromState = (location.state as { from?: { pathname?: string; search?: string } | string })?.from;
  const stateReturnUrl = typeof fromState === 'string'
    ? fromState
    : fromState?.pathname
    ? `${fromState.pathname}${fromState.search || ''}`
    : null;
  const rawReturnUrl = searchParams.get('returnUrl') || stateReturnUrl;

  const [authMode, setAuthMode] = useState<'email_signin' | 'email_register'>('email_signin');

  // Email form state (prefilled demo credentials for seamless evaluator access)
  const [email, setEmail] = useState('artisan_a@karigarsaathi.local');
  const [password, setPassword] = useState('KarigarPass123!');
  const [displayName, setDisplayName] = useState('Ravi Kumar');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [justAutofilled, setJustAutofilled] = useState(false);

  const handleAutofill = () => {
    setEmail('artisan_a@karigarsaathi.local');
    setPassword('KarigarPass123!');
    setJustAutofilled(true);
    setTimeout(() => setJustAutofilled(false), 1600);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let accountRole: 'artisan' | 'coordinator' = 'artisan';
      if (authMode === 'email_register') {
        if (!displayName.trim()) {
          setError('Please provide your name or workshop title.');
          setIsLoading(false);
          return;
        }
        const createdAccount = await registerArtisan({
          email,
          password,
          displayName,
          preferredLanguage: 'en',
        });
        accountRole = (createdAccount?.role as 'artisan' | 'coordinator') || 'artisan';
      } else {
        const loggedInAccount = await signInWithEmail({ email, password });
        accountRole = (loggedInAccount?.role as 'artisan' | 'coordinator') || (userAccount?.role as 'artisan' | 'coordinator') || 'artisan';
      }

      const defaultDest = accountRole === 'coordinator' ? ROUTES.COORDINATOR_DASHBOARD : ROUTES.ARTISAN_DASHBOARD;
      const target = getSafeReturnUrl(rawReturnUrl, defaultDest, accountRole);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] flex flex-col gap-6 mx-auto">
      <Card className="p-6 md:p-10 flex flex-col gap-6 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-variant relative overflow-hidden">
        {/* Loading Overlay */}
        {(isLoading || authLoading) && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20 animate-in fade-in">
            <Loader2 className="w-10 h-10 animate-spin text-secondary mb-3" />
            <span className="text-sm font-bold tracking-wider text-primary uppercase">
              {authMode === 'email_register' ? 'Creating Account...' : 'Authenticating...'}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-2 pb-1">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary leading-tight">
            {authMode === 'email_register' ? 'Create Artisan Account' : t('auth.title')}
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant">
            {authMode === 'email_register'
              ? 'Join KarigarSaathi to catalog and protect your handcrafted products.'
              : t('auth.emailSubtitle')}
          </p>
        </div>

        {/* Active Session Notice with Quick Link */}
        {isAuthenticated && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Signed in as: <strong>{userAccount?.displayName || user?.name || 'Active User'}</strong></span>
            </div>
            <Link
              to={userAccount?.role === 'coordinator' ? ROUTES.COORDINATOR_DASHBOARD : ROUTES.ARTISAN_DASHBOARD}
              className="group/work text-xs font-bold text-emerald-800 hover:text-emerald-950 underline whitespace-nowrap self-end sm:self-auto inline-flex items-center gap-1 transition-colors"
            >
              <span>Go to Workspace</span>
              <MoveRight className="w-3.5 h-3.5 transition-transform duration-250 ease-out group-hover/work:translate-x-1 motion-reduce:transform-none" />
            </Link>
          </div>
        )}

        {/* Mode Selector: 2 Equal Width Centered Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-container rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('email_signin'); setError(''); }}
            className={`py-2.5 px-2 rounded-lg transition-all duration-200 text-center ${
              authMode === 'email_signin'
                ? 'bg-white text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('email_register'); setError(''); }}
            className={`py-2.5 px-2 rounded-lg transition-all duration-200 text-center ${
              authMode === 'email_register'
                ? 'bg-white text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 text-error text-xs rounded-xl border border-red-200 font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Judge & Evaluator Quick Demo Callout */}
        {authMode === 'email_signin' && (
          <div className="p-3 sm:p-3.5 bg-[#FFFDF9] border border-secondary/25 hover:border-secondary/40 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs transition-colors duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-primary text-[11px] sm:text-xs">
                    Evaluator Demo Access
                  </span>
                  <span className="px-1.5 py-0.2 bg-secondary/10 text-secondary text-[9px] font-bold rounded">
                    Prefilled
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-mono">
                  artisan_a@karigarsaathi.local
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutofill}
              className={clsx(
                'px-3 py-1.5 text-[11px] font-bold rounded-lg border shadow-2xs transition-all duration-200 shrink-0 flex items-center gap-1.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
                justAutofilled
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200'
                  : 'text-secondary bg-white hover:bg-secondary hover:text-white border-secondary/30 hover:border-secondary'
              )}
            >
              {justAutofilled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Filled</span>
                </>
              ) : (
                <>
                  <span>Auto-fill</span>
                  <Sparkles className="w-3 h-3 opacity-70" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Email Sign In / Registration Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          {authMode === 'email_register' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="artisan-name" className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" /> Artisan / Workshop Name
              </label>
              <input
                id="artisan-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                required
                className="w-full border border-outline-variant/60 hover:border-primary/40 focus:border-primary rounded-xl bg-white px-3.5 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all duration-200 ease-out shadow-2xs placeholder:text-on-surface-variant/40"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="artisan-email" className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-primary" /> Email Address
            </label>
            <input
              id="artisan-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="artisan@example.com"
              required
              className="w-full border border-outline-variant/60 hover:border-primary/40 focus:border-primary rounded-xl bg-white px-3.5 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all duration-200 ease-out shadow-2xs placeholder:text-on-surface-variant/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="artisan-password" className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" /> Password
            </label>
            <input
              id="artisan-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full border border-outline-variant/60 hover:border-primary/40 focus:border-primary rounded-xl bg-white px-3.5 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all duration-200 ease-out shadow-2xs placeholder:text-on-surface-variant/40"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-bold text-base min-h-[50px] rounded-xl mt-2 bg-primary hover:bg-[#00284D] active:bg-[#00172C] text-white shadow-sm hover:shadow-md hover:shadow-primary/20 active:scale-[0.985] flex items-center justify-center gap-2.5 transition-all duration-200 ease-out group/btn focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <span className="tracking-wide font-bold">{authMode === 'email_register' ? 'Register & Enter Dashboard' : 'Sign In with Firebase'}</span>
            <MoveRight className="w-5 h-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-1.5 motion-reduce:transform-none" />
          </Button>
        </form>

        {/* Footer & Role Navigation */}
        <div className="border-t border-surface-variant pt-4 flex flex-col gap-3 text-center text-xs text-on-surface-variant">
          <div className="flex items-center justify-between p-2.5 bg-surface-container-low/80 rounded-xl border border-surface-variant/80">
            <span className="font-medium text-primary">Need a different role?</span>
            <Link
              to={ROUTES.SIGN_IN}
              className="group/role font-bold text-secondary hover:text-secondary/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded transition-all duration-200 ease-out inline-flex items-center hover:translate-x-1"
            >
              Change sign-in type →
            </Link>
          </div>

          <div className="flex items-center justify-between text-xs px-1 pt-1">
            <Link
              to={ROUTES.HOME}
              className="group/home text-on-surface-variant hover:text-primary font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded transition-all duration-200 ease-out inline-flex items-center hover:-translate-x-1"
            >
              ← Back to home
            </Link>
            <Link
              to={ROUTES.COORDINATOR_LOGIN}
              className="group/coord text-secondary hover:text-secondary/80 font-semibold focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded inline-flex items-center gap-1.5 transition-colors duration-150"
            >
              <span>Coordinator Sign In</span>
              <MoveRight className="w-3.5 h-3.5 transition-transform duration-250 ease-out group-hover/coord:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
            </Link>
          </div>

          <p className="text-[11px] text-on-surface-variant/80 pt-1">
            By signing in, you agree to KarigarSaathi{' '}
            <span className="font-semibold text-primary hover:underline cursor-pointer">
              Terms of Service & Privacy Policy
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
};
