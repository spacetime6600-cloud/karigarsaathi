import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { ROUTES, getSafeReturnUrl } from '@/routes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  MoveRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  FileCheck,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { auth } from '@/config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { coordinatorApprovalService } from '@/services/coordinator/coordinatorApprovalService';

export const CoordinatorLoginPage: React.FC = () => {
  const { signInWithEmail, isAuthenticated, isLoading: authLoading, user, userAccount, signOut } = useAuth();
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

  const [email, setEmail] = useState('coordinator@karigarsaathi.gov.in');
  const [password, setPassword] = useState('CoordinatorPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAutofilled, setJustAutofilled] = useState(false);

  const handleAutofill = () => {
    setEmail('coordinator@karigarsaathi.gov.in');
    setPassword('CoordinatorPass123!');
    setJustAutofilled(true);
    setTimeout(() => setJustAutofilled(false), 1600);
  };

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleCoordinatorSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    // Check pre-approval or registration status
    const regStatus = coordinatorApprovalService.getRegistrationStatus(trimmedEmail);
    if (regStatus === 'pending') {
      setError(
        'Registration Pending: Your coordinator application is currently undergoing administrative review. Coordinator access will be unlocked once approved by a cluster administrator.'
      );
      setIsLoading(false);
      return;
    }
    if (regStatus === 'rejected') {
      setError(
        'Registration Rejected: Your coordinator application was not approved. Please contact your regional agency administrator.'
      );
      setIsLoading(false);
      return;
    }

    try {
      const loggedInAccount = await signInWithEmail({ email: trimmedEmail, password });

      const currentRole = loggedInAccount?.role || userAccount?.role || user?.role || 'coordinator';
      const isApproved = coordinatorApprovalService.isApproved(trimmedEmail);

      if (!isApproved || currentRole !== 'coordinator') {
        const postRegStatus = coordinatorApprovalService.getRegistrationStatus(trimmedEmail);
        if (postRegStatus === 'pending') {
          setError(
            'Registration Pending: Your coordinator application is currently undergoing administrative review. Coordinator access will be unlocked once approved by a cluster administrator.'
          );
        } else {
          setError(
            'Access Restricted: This account does not have field coordinator privileges. If you are an artisan, please sign in through the Artisan portal.'
          );
        }
      } else {
        const target = getSafeReturnUrl(rawReturnUrl, ROUTES.COORDINATOR_DASHBOARD, 'coordinator');
        navigate(target, { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid coordinator credentials or authorization error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your registered coordinator email address.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(true);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to send password recovery email.');
    } finally {
      setResetLoading(false);
    }
  };

  // If user is authentically signed in with an Artisan Firebase account and visits Coordinator Login
  const isArtisanLoggedIn = isAuthenticated && userAccount !== null && userAccount.role === 'artisan';

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Tasteful Craft Visual & Coordinator Copy     */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 sm:p-10 rounded-3xl bg-primary text-white relative overflow-hidden shadow-xl">
          {/* Subtle warm decorative glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-secondary/25 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-terracotta/20 blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-6 h-6 text-[#FFB955]" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold tracking-tight text-white leading-tight">
                  KarigarSaathi
                </span>
                <span className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">
                  Field Coordinator Portal
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FFB955] text-xs font-bold w-fit border border-white/15">
                <ShieldCheck className="w-3.5 h-3.5" /> Authorized Cluster Hub
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-white tracking-tight">
                Support artisans.
                <br />
                <span className="text-[#FFB955]">Connect opportunities.</span>
              </h1>
              <p className="text-sm text-white/80 leading-relaxed max-w-md mt-1">
                Manage your assigned artisans, review craft catalogues, verify readiness standards, and follow up on buyer enquiries.
              </p>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="relative z-10 grid grid-cols-1 gap-3.5 my-8">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all duration-300 ease-out hover:translate-x-0.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFB955]/20 text-[#FFB955] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Privacy-Safe Cluster Management</span>
                <span className="text-[11px] text-white/70">
                  Access only approved artisan clusters under active administrative assignment.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all duration-300 ease-out hover:translate-x-0.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFB955]/20 text-[#FFB955] flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Catalogue & Readiness Reviews</span>
                <span className="text-[11px] text-white/70">
                  Audit photos, verified facts, and export specifications before public distribution.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all duration-300 ease-out hover:translate-x-0.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFB955]/20 text-[#FFB955] flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquareQuote className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Buyer Linkage & Enquiry Follow-Up</span>
                <span className="text-[11px] text-white/70">
                  Assist regional artisans in replying to verified domestic and international buyer requests.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span>Official Partner Network</span>
            <span>Role: Field Coordinator</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Focused Coordinator Login Card              */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <Card className="p-6 sm:p-10 flex flex-col gap-6 bg-surface-container-lowest rounded-3xl shadow-xl border border-surface-variant relative overflow-hidden">
            {/* Loading Overlay */}
            {(isLoading || authLoading) && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-20 animate-in fade-in">
                <Loader2 className="w-10 h-10 animate-spin text-secondary mb-3" />
                <span className="text-sm font-bold tracking-wider text-primary uppercase">
                  Verifying Coordinator Credentials...
                </span>
              </div>
            )}

            {/* Mobile Header Branding */}
            <div className="lg:hidden flex items-center gap-2.5 pb-2 border-b border-surface-variant">
              <div className="w-8 h-8 rounded-lg bg-primary text-[#FFB955] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-base font-bold text-primary">KarigarSaathi</span>
                <span className="text-[9px] text-on-surface-variant font-semibold uppercase">
                  Coordinator Workspace
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  Coordinator Sign In
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary text-[10px] font-bold uppercase">
                  Cluster Lead
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Enter your authorized credentials to access regional artisan assistance and review queues.
              </p>
            </div>

            {/* If Coordinator is already logged in */}
            {isAuthenticated && userAccount?.role === 'coordinator' && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-950 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Signed in as Coordinator: <strong>{userAccount?.displayName || user?.name || 'Coordinator Lead'}</strong></span>
                </div>
                <Link
                  to={ROUTES.COORDINATOR_DASHBOARD}
                  className="group/hub text-xs font-bold text-emerald-800 hover:text-emerald-950 underline whitespace-nowrap self-end sm:self-auto inline-flex items-center gap-1 transition-colors"
                >
                  <span>Go to Coordinator Hub</span>
                  <MoveRight className="w-3.5 h-3.5 transition-transform duration-250 ease-out group-hover/hub:translate-x-1 motion-reduce:transform-none" />
                </Link>
              </div>
            )}

            {/* If Artisan is logged in, show clear role conflict warning */}
            {isArtisanLoggedIn && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Currently Signed In as Artisan ({user?.name || userAccount?.displayName})</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  You are currently logged into an artisan account. To access the coordinator hub, sign out and sign in with your coordinator email, or continue to your artisan dashboard.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(ROUTES.ARTISAN_DASHBOARD)}
                    className="text-xs font-bold flex-1"
                  >
                    Go to Artisan Dashboard
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await signOut();
                    }}
                    className="text-xs text-error font-bold flex-1"
                  >
                    Sign Out & Re-login
                  </Button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 text-error text-xs rounded-2xl border border-red-200 flex items-start gap-2.5 font-medium animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Judge & Evaluator Quick Demo Callout */}
            <div className="p-3 sm:p-3.5 bg-[#FFFDF9] border border-secondary/25 hover:border-secondary/40 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs transition-colors duration-200">
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
                    coordinator@karigarsaathi.gov.in
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

            {/* Form */}
            <form onSubmit={handleCoordinatorSignIn} className="flex flex-col gap-4">
              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="coord-email" className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-secondary" /> Coordinator Email Address
                </label>
                <input
                  id="coord-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coordinator@karigarsaathi.gov.in"
                  required
                  autoComplete="email"
                  className="w-full border border-outline-variant/60 hover:border-secondary/40 focus:border-secondary rounded-xl bg-white px-3.5 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-4 focus:ring-secondary/15 transition-all duration-200 ease-out shadow-2xs placeholder:text-on-surface-variant/40"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="coord-password" className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-secondary" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetModal(true);
                      setResetSuccess(false);
                      setResetError(null);
                    }}
                    className="text-xs text-secondary hover:text-secondary/80 font-bold hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded transition-colors duration-150"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="coord-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    className="w-full border border-outline-variant/60 hover:border-secondary/40 focus:border-secondary rounded-xl bg-white pl-3.5 pr-10 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-4 focus:ring-secondary/15 transition-all duration-200 ease-out shadow-2xs placeholder:text-on-surface-variant/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary hover:bg-black/5 p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-all duration-150 active:scale-90"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-[52px] min-h-[52px] font-bold text-sm rounded-xl mt-2 bg-secondary hover:bg-[#8B3400] active:bg-[#782C00] text-white shadow-sm hover:shadow-md hover:shadow-secondary/20 active:scale-[0.985] flex items-center justify-center gap-2.5 transition-all duration-200 ease-out group/btn focus-visible:ring-2 focus-visible:ring-[#FFB955]"
              >
                <span className="whitespace-nowrap font-bold text-sm tracking-wide">Sign in as Coordinator</span>
                <MoveRight className="w-5 h-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-1.5 motion-reduce:transform-none" />
              </Button>
            </form>

            {/* Navigation & Role Switch Links */}
            <div className="flex flex-col gap-3 pt-3 border-t border-surface-variant text-center">
              {/* New Coordinator Registration Link */}
              <div className="flex items-center justify-between p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs transition-colors">
                <div className="flex flex-col text-left">
                  <span className="font-bold text-amber-950">New coordinator?</span>
                  <span className="text-[11px] text-amber-800">Register your agency for cluster access.</span>
                </div>
                <Link
                  to={ROUTES.COORDINATOR_REGISTER}
                  className="group/reg font-bold text-secondary hover:text-white hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-xl px-3 py-1.5 bg-white border border-secondary/30 shadow-2xs shrink-0 inline-flex items-center gap-1 transition-all duration-200 ease-out active:scale-95"
                >
                  <span className="group-hover/reg:translate-x-0.5 transition-transform duration-200">Register →</span>
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-surface-container-low/80 rounded-xl border border-surface-variant/80 text-xs">
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
                  to={ROUTES.LOGIN}
                  className="group/artisan text-secondary hover:text-secondary/80 font-semibold focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded inline-flex items-center gap-1.5 transition-colors duration-150"
                >
                  <span>Artisan Sign In</span>
                  <MoveRight className="w-3.5 h-3.5 transition-transform duration-250 ease-out group-hover/artisan:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PASSWORD RESET DIALOG MODAL                               */}
      {/* ========================================================= */}
      {showResetModal && (
        <div
          role="dialog"
          aria-labelledby="reset-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <Card className="max-w-md w-full p-6 sm:p-8 bg-white rounded-3xl shadow-2xl border border-surface-variant flex flex-col gap-4 relative">
            <h3 id="reset-modal-title" className="font-display text-xl font-bold text-primary">
              Reset Coordinator Password
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Enter your registered coordinator email. We will send a secure password reset link to your official inbox.
            </p>

            {resetSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex flex-col gap-2 text-xs text-green-900 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-green-700" />
                  <span>Password Reset Link Sent!</span>
                </div>
                <p className="text-green-800">
                  Please check your inbox for instructions to update your password credentials.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowResetModal(false)}
                  className="mt-2 text-xs font-bold"
                >
                  Close & Return to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="flex flex-col gap-3">
                {resetError && (
                  <div className="p-3 bg-red-50 text-error text-xs rounded-xl border border-red-200 font-medium">
                    {resetError}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reset-email" className="text-xs font-bold text-primary">
                    Coordinator Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="coordinator@example.com"
                    required
                    className="w-full border border-outline-variant rounded-xl bg-white px-3.5 min-h-[44px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 text-xs font-bold bg-secondary text-white"
                  >
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
