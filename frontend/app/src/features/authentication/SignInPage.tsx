import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { ROUTES, getSafeReturnUrl } from '@/routes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { signInWithEmail, registerArtisan, isAuthenticated, isLoading: authLoading, user, userAccount } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Extract and sanitize target return URL
  const rawReturnUrl = searchParams.get('returnUrl') || (location.state as { from?: { pathname?: string; search?: string } })?.from?.pathname;

  const [authMode, setAuthMode] = useState<'email_signin' | 'email_register'>('email_signin');

  // Email form state
  const [email, setEmail] = useState('artisan_a@karigarsaathi.local');
  const [password, setPassword] = useState('KarigarPass123!');
  const [displayName, setDisplayName] = useState('Ravi Kumar');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect to target or appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const userRole = userAccount?.role || user?.role;
      if (!userRole) return;
      const defaultDest = userRole === 'coordinator' ? ROUTES.COORDINATOR_DASHBOARD : ROUTES.ARTISAN_DASHBOARD;
      const target = getSafeReturnUrl(rawReturnUrl, defaultDest);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, authLoading, user?.role, userAccount?.role, rawReturnUrl, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (authMode === 'email_register') {
        if (!displayName.trim()) {
          setError('Please provide your name or workshop title.');
          setIsLoading(false);
          return;
        }
        await registerArtisan({
          email,
          password,
          displayName,
          preferredLanguage: 'en',
        });
      } else {
        await signInWithEmail({ email, password });
      }

      const currentRole = userAccount?.role || user?.role || 'artisan';
      const defaultDest = currentRole === 'coordinator' ? ROUTES.COORDINATOR_DASHBOARD : ROUTES.ARTISAN_DASHBOARD;
      const target = getSafeReturnUrl(rawReturnUrl, defaultDest);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] flex flex-col gap-6 mx-auto animate-in fade-in duration-200">
      <Card className="p-6 md:p-10 flex flex-col gap-6 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-variant relative overflow-hidden">
        {/* Loading Overlay */}
        {(isLoading || authLoading) && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-20 animate-in fade-in">
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

        {/* Mode Selector: 2 Equal Width Centered Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-container rounded-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('email_signin'); setError(''); }}
            className={`py-2 px-2 rounded-md transition-all text-center ${
              authMode === 'email_signin'
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('email_register'); setError(''); }}
            className={`py-2 px-2 rounded-md transition-all text-center ${
              authMode === 'email_register'
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 text-error text-xs rounded-md border border-red-200 font-medium">
            {error}
          </div>
        )}

        {/* Email Sign In / Registration Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          {authMode === 'email_register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" /> Artisan / Workshop Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                required
                className="w-full border border-outline-variant rounded-md bg-white px-3.5 min-h-[44px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-primary" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="artisan@example.com"
              required
              className="w-full border border-outline-variant rounded-md bg-white px-3.5 min-h-[44px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full border border-outline-variant rounded-md bg-white px-3.5 min-h-[44px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-bold text-base min-h-[50px] rounded-lg mt-2"
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            {authMode === 'email_register' ? 'Register & Enter Dashboard' : 'Sign In with Firebase'}
          </Button>
        </form>

        {/* Footer & Role Navigation */}
        <div className="border-t border-surface-variant pt-4 flex flex-col gap-3 text-center text-xs text-on-surface-variant">
          <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl border border-surface-variant">
            <span className="font-medium text-primary">Need a different role?</span>
            <Link
              to={ROUTES.SIGN_IN}
              className="font-bold text-secondary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded"
            >
              Change sign-in type →
            </Link>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <Link
              to={ROUTES.HOME}
              className="text-on-surface-variant hover:text-primary font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
            >
              ← Back to home
            </Link>
            <Link
              to={ROUTES.COORDINATOR_LOGIN}
              className="text-secondary font-semibold hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded"
            >
              Coordinator Sign In
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
