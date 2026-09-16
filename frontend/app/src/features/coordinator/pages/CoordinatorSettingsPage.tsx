import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Mail,
  Globe,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Building,
  KeyRound,
} from 'lucide-react';
import { auth } from '@/config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ROUTES } from '@/routes';

export const CoordinatorSettingsPage: React.FC = () => {
  const { user, userAccount, signOut, switchRole } = useAuth();
  const { currentLanguageMeta } = useLanguage();
  const navigate = useNavigate();

  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const coordinatorEmail = userAccount?.email || 'coordinator@karigarsaathi.gov.in';

  const handlePasswordReset = async () => {
    setIsResetting(true);
    setResetError(null);
    setResetSuccess(false);
    try {
      await sendPasswordResetEmail(auth, coordinatorEmail);
      setResetSuccess(true);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to trigger password recovery.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-surface-variant/80 pb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Workspace Configuration
          </span>
          <Badge variant="indigo" className="text-[10px] uppercase font-bold">
            Authorized Account
          </Badge>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight mt-1">
          Coordinator Settings
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Manage your field coordinator profile, vernacular language preferences, security credentials, and role permissions.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-6 bg-white border border-surface-variant/80 rounded-3xl shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center font-bold text-xl ring-2 ring-secondary/20">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div className="flex flex-col">
            <h3 className="font-display text-lg font-bold text-primary">{user?.name || 'Field Coordinator'}</h3>
            <span className="text-xs text-secondary font-semibold">Authorized Cluster Lead</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-surface-variant text-xs">
          <div className="p-3.5 bg-surface-container-low rounded-2xl border border-surface-variant/40 flex items-center gap-3">
            <Mail className="w-4 h-4 text-secondary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Official Email</span>
              <span className="font-semibold text-primary truncate">{coordinatorEmail}</span>
            </div>
          </div>

          <div className="p-3.5 bg-surface-container-low rounded-2xl border border-surface-variant/40 flex items-center gap-3">
            <Building className="w-4 h-4 text-secondary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Assigned Scope</span>
              <span className="font-semibold text-primary truncate">{user?.location || 'Assigned Regional Clusters'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Language Preference Card */}
      <Card className="p-6 bg-white border border-surface-variant/80 rounded-3xl shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-base font-bold text-primary">Language Preference</h3>
          </div>
          <span className="text-xs font-bold text-secondary">{currentLanguageMeta.name}</span>
        </div>
        <p className="text-xs text-on-surface-variant">
          Select your primary interface language for navigating the coordinator portal and inspecting vernacular artisan voice transcripts.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(ROUTES.LANGUAGE)}
          className="w-fit text-xs font-bold"
        >
          Change Language Settings
        </Button>
      </Card>

      {/* Security & Password Reset Card */}
      <Card className="p-6 bg-white border border-surface-variant/80 rounded-3xl shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-secondary" />
          <h3 className="font-display text-base font-bold text-primary">Security & Password</h3>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Coordinator accounts use Firebase security authentication. You can send a password reset link to your registered email anytime.
        </p>

        {resetSuccess && (
          <div className="p-3.5 bg-green-50 text-green-900 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
            <span>Password reset instructions sent to {coordinatorEmail}</span>
          </div>
        )}

        {resetError && (
          <div className="p-3.5 bg-red-50 text-error border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{resetError}</span>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          disabled={isResetting}
          onClick={handlePasswordReset}
          className="w-fit text-xs font-bold border border-surface-variant"
        >
          {isResetting ? 'Sending Reset Email...' : 'Send Password Reset Email'}
        </Button>
      </Card>

      {/* Role Switch & Sign Out Actions */}
      <Card className="p-6 bg-white border border-surface-variant/80 rounded-3xl shadow-xs flex flex-col gap-4">
        <h3 className="font-display text-base font-bold text-primary">Account Session</h3>
        <p className="text-xs text-on-surface-variant">
          Switch view to test the artisan experience or sign out of this device securely.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => {
              switchRole('artisan');
              navigate(ROUTES.ARTISAN_DASHBOARD);
            }}
            className="w-full sm:w-auto text-xs font-bold"
          >
            Switch to Artisan Mode
          </Button>

          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await signOut();
                navigate(ROUTES.SIGN_IN, { replace: true });
              } catch {
                // error is captured in AuthProvider
              }
            }}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs font-bold text-error hover:bg-error-container/40"
          >
            Sign Out of Coordinator Hub
          </Button>
        </div>
      </Card>
    </div>
  );
};
