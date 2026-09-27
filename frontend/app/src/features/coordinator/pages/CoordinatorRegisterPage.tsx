import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorApprovalService, CoordinatorRegistrationRecord } from '@/services/coordinator/coordinatorApprovalService';
import { ROUTES } from '@/routes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  FileCheck,
} from 'lucide-react';

export const CoordinatorRegisterPage: React.FC = () => {
  const { registerCoordinator } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<CoordinatorRegistrationRecord | null>(null);
  const [statusCheckResult, setStatusCheckResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusCheckResult(null);

    // Client-side validations
    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedAgency = agencyName.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please provide your full legal name (at least 2 characters).');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please provide a valid official email address.');
      return;
    }

    if (!trimmedAgency || trimmedAgency.length < 2) {
      setError('Please specify your cluster agency, organization, or promoting society.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const record = await registerCoordinator({
        email: trimmedEmail,
        password,
        displayName: trimmedName,
        agencyName: trimmedAgency,
        phone: phone.trim() || undefined,
      });

      setSubmittedRecord(record);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = () => {
    if (!submittedRecord) return;
    const currentStatus = coordinatorApprovalService.getRegistrationStatus(submittedRecord.email);
    if (currentStatus === 'approved') {
      setStatusCheckResult('Congratulations! Your coordinator account is now approved. You can sign in.');
    } else if (currentStatus === 'rejected') {
      setStatusCheckResult('Your registration request was not approved. Please contact cluster administration.');
    } else {
      setStatusCheckResult('Status: Pending administrative review. Your application is in the queue.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-8 px-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Tasteful Craft Visual & Coordinator Copy     */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 sm:p-10 rounded-3xl bg-primary text-white relative overflow-hidden shadow-xl">
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
                  Field Coordinator Program
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FFB955] text-xs font-bold w-fit border border-white/15">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Partner Verification
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-white tracking-tight">
                Empower artisans.
                <br />
                <span className="text-[#FFB955]">Bridge clusters.</span>
              </h1>
              <p className="text-sm text-white/80 leading-relaxed mt-1">
                Field Coordinators help traditional craftspeople digitize catalogues, ensure export readiness, and verify authenticity.
              </p>
            </div>
          </div>

          {/* Verification Protocol Highlight */}
          <div className="relative z-10 flex flex-col gap-3.5 my-8">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#FFB955]/20 text-[#FFB955] flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Administrative Review Protocol</span>
                <span className="text-[11px] text-white/70">
                  To safeguard artisan privacy and prevent unauthorized data access, all coordinator registrations require verification.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#FFB955]/20 text-[#FFB955] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Assigned Clusters Only</span>
                <span className="text-[11px] text-white/70">
                  Coordinators only receive access to artisan workshops explicitly assigned by regional administrators.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#FFB955]/20 text-[#FFB955] flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Authentic Craft Linkage</span>
                <span className="text-[11px] text-white/70">
                  Assist regional weavers and craftspeople in answering verified buyer inquiries and generating passports.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span>Ministry / Agency Affiliated</span>
            <span>Security Level: Supervised</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Registration Form or Pending Approval Card  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {submittedRecord ? (
            /* ========================================================= */
            /* SUCCESS STATE: Registration Pending Administrative Review */
            /* ========================================================= */
            <Card className="p-6 sm:p-10 flex flex-col gap-6 bg-surface-container-lowest rounded-3xl shadow-xl border border-surface-variant animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase w-fit">
                    Status: Pending Verification
                  </span>
                  <h2 className="font-display text-2xl font-bold text-primary tracking-tight mt-1">
                    Application Submitted
                  </h2>
                </div>
              </div>

              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex flex-col gap-2 text-xs text-amber-950 leading-relaxed">
                <p className="font-semibold text-amber-900">
                  Thank you, {submittedRecord.displayName}! Your coordinator registration for{' '}
                  <strong>{submittedRecord.agencyName || 'your organization'}</strong> has been recorded.
                </p>
                <p className="text-amber-900/90">
                  To protect artisan clusters and prevent unauthorized access to sensitive workshop records, coordinator privileges are granted only after administrative approval.
                </p>
              </div>

              {/* Applicant Summary */}
              <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-variant flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-surface-variant/60">
                  <span className="text-on-surface-variant font-medium">Applicant Name</span>
                  <span className="font-bold text-primary">{submittedRecord.displayName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-variant/60">
                  <span className="text-on-surface-variant font-medium">Official Email</span>
                  <span className="font-bold text-primary">{submittedRecord.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-variant/60">
                  <span className="text-on-surface-variant font-medium">Agency / Cluster</span>
                  <span className="font-bold text-primary">{submittedRecord.agencyName}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant font-medium">Approval Status</span>
                  <span className="font-bold text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Pending Administrative Review
                  </span>
                </div>
              </div>

              {/* Status check response banner */}
              {statusCheckResult && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium animate-in fade-in flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-blue-700 mt-0.5" />
                  <span>{statusCheckResult}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleCheckStatus}
                  variant="secondary"
                  className="flex-1 h-12 text-xs font-bold"
                >
                  Check Approval Status
                </Button>
                <Button
                  onClick={() => navigate(ROUTES.COORDINATOR_LOGIN)}
                  className="flex-1 h-12 text-xs font-bold bg-secondary hover:bg-secondary/90 text-white"
                >
                  Go to Coordinator Sign In
                </Button>
              </div>

              <div className="pt-3 border-t border-surface-variant text-center">
                <Link
                  to={ROUTES.HOME}
                  className="text-xs text-on-surface-variant hover:text-primary font-medium hover:underline inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Homepage</span>
                </Link>
              </div>
            </Card>
          ) : (
            /* ========================================================= */
            /* REGISTRATION FORM                                         */
            /* ========================================================= */
            <Card className="p-6 sm:p-10 flex flex-col gap-6 bg-surface-container-lowest rounded-3xl shadow-xl border border-surface-variant relative overflow-hidden">
              {/* Loading Overlay */}
              {isSubmitting && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-20 animate-in fade-in">
                  <Loader2 className="w-10 h-10 animate-spin text-secondary mb-3" />
                  <span className="text-sm font-bold tracking-wider text-primary uppercase">
                    Submitting Coordinator Application...
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
                    Coordinator Registration
                  </span>
                </div>
              </div>

              {/* Header */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                    Coordinator Registration
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary text-[10px] font-bold uppercase">
                    Cluster Lead
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Register for verified cluster coordinator access. Accounts are reviewed to safeguard artisan privacy.
                </p>
              </div>

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

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-name" className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-secondary" /> Full Legal Name *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    minLength={2}
                    className="w-full border border-outline-variant rounded-xl bg-white px-3.5 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                  />
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-email" className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-secondary" /> Official Email Address *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coordinator@agency.gov.in"
                    required
                    autoComplete="email"
                    className="w-full border border-outline-variant rounded-xl bg-white px-3.5 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                  />
                </div>

                {/* Agency / Cluster Organization */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-agency" className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-secondary" /> Agency / Promoting Organization *
                  </label>
                  <input
                    id="reg-agency"
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. District Handicrafts Promotion Society / NABARD / KVIC"
                    required
                    minLength={2}
                    className="w-full border border-outline-variant rounded-xl bg-white px-3.5 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                  />
                </div>

                {/* Phone (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-phone" className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-secondary" /> Contact Phone Number (Optional)
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full border border-outline-variant rounded-xl bg-white px-3.5 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                  />
                </div>

                {/* Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-password" className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-secondary" /> Password *
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="w-full border border-outline-variant rounded-xl bg-white pl-3.5 pr-10 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1 rounded-md focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-confirm-password" className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-secondary" /> Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="w-full border border-outline-variant rounded-xl bg-white pl-3.5 pr-10 min-h-[46px] text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1 rounded-md focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[52px] min-h-[52px] font-bold text-sm rounded-xl mt-2 bg-secondary hover:bg-secondary/90 text-white shadow-xs hover:shadow active:scale-[0.99] flex items-center justify-center gap-2.5 transition-all duration-150 group/btn focus-visible:ring-2 focus-visible:ring-[#FFB955]"
                >
                  <span className="whitespace-nowrap font-bold text-sm">Submit Registration for Approval</span>
                  <ArrowRight className="w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover/btn:translate-x-[3px] motion-reduce:transform-none" />
                </Button>
              </form>

              {/* Navigation & Help Links */}
              <div className="flex flex-col gap-3 pt-3 border-t border-surface-variant text-center">
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl border border-surface-variant text-xs">
                  <span className="font-medium text-primary">Already an approved coordinator?</span>
                  <Link
                    to={ROUTES.COORDINATOR_LOGIN}
                    className="font-bold text-secondary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded"
                  >
                    Sign in here →
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <Link
                    to={ROUTES.SIGN_IN}
                    className="text-on-surface-variant hover:text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Role selection</span>
                  </Link>
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-secondary font-semibold hover:underline"
                  >
                    Artisan Sign In / Register
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
