import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ArtisanProfile } from '@/types';
import { UserAccount, RegisterArtisanInput, SignInInput } from '@/domain/auth';
import { authRepository, artisanProfileRepository } from '@/repositories';
import { authService } from '@/services/api/authService';
import { logger } from '@/services/logging/logger';
import { ROUTES } from '@/routes';

interface AuthContextType {
  user: ArtisanProfile | null;
  userAccount: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  profileIncomplete: boolean;
  error: string | null;
  signIn: (phone: string, otp: string, role?: 'artisan' | 'coordinator') => Promise<void>;
  signInWithEmail: (input: SignInInput) => Promise<void>;
  registerArtisan: (input: RegisterArtisanInput) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (role: 'artisan' | 'coordinator') => void;
  retryProfileInit: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [user, setUser] = useState<ArtisanProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [profileIncomplete, setProfileIncomplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isSigningOutRef = useRef<boolean>(false);
  const authSessionIdRef = useRef<number>(0);

  const loadUserProfile = useCallback(async (account: UserAccount, sessionId: number) => {
    try {
      if (isSigningOutRef.current || sessionId !== authSessionIdRef.current) {
        return;
      }
      const activeRole: 'artisan' | 'coordinator' = (account.role as 'artisan' | 'coordinator') || 'artisan';
      const profile = await artisanProfileRepository.getCurrentProfile(account.uid);

      if (isSigningOutRef.current || sessionId !== authSessionIdRef.current) {
        return;
      }

      if (profile) {
        const userProfile: ArtisanProfile = {
          id: account.uid,
          name: profile.artisanName || account.displayName,
          phone: profile.phone || account.phone || '',
          role: activeRole,
          craftType: profile.craftType || (activeRole === 'coordinator' ? 'Cluster Coordination & Documentation' : 'Handloom & Crafts'),
          location: `${profile.district || ''}, ${profile.state || 'India'}`.replace(/^,\s*/, ''),
          avatarUrl: profile.profileImagePath || (activeRole === 'coordinator' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
          workshopName: profile.workshopName || (activeRole === 'coordinator' ? 'Regional Craft Linkage Hub' : `${profile.artisanName}'s Workshop`),
          bio: profile.bio || '',
          joinedYear: profile.joinedYear || new Date().getFullYear(),
        };
        setUser(userProfile);
        setProfileIncomplete(false);
      } else {
        setProfileIncomplete(activeRole === 'artisan');
        // Provide minimal fallback so UI remains functional
        setUser({
          id: account.uid,
          name: account.displayName || (activeRole === 'coordinator' ? 'Coordinator' : 'Artisan'),
          phone: account.phone || '',
          role: activeRole,
          craftType: activeRole === 'coordinator' ? 'Cluster Assistance & Review' : 'Traditional Craft',
          location: 'India',
          avatarUrl: activeRole === 'coordinator' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          workshopName: activeRole === 'coordinator' ? 'Regional Cluster Hub' : 'Artisan Workshop',
          bio: '',
          joinedYear: new Date().getFullYear(),
        });
      }
    } catch (err) {
      if (isSigningOutRef.current || sessionId !== authSessionIdRef.current) {
        return;
      }
      logger.error('AUTH', 'Failed to load user profile', err, { uid: account.uid });
      setProfileIncomplete(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authRepository.observeAuthState(async (account) => {
      if (isSigningOutRef.current) {
        return;
      }

      authSessionIdRef.current += 1;
      const currentSessionId = authSessionIdRef.current;

      logger.info('AUTH', 'Auth observer state changed', {
        uid: account?.uid || undefined,
        role: account?.role || undefined,
        isAuthenticated: !!account,
      });

      setUserAccount(account);
      if (account) {
        await loadUserProfile(account, currentSessionId);
      } else {
        const local = authService.getCurrentUser();
        if (local) {
          setUser(local);
          setUserAccount({
            uid: local.id,
            role: local.role || 'artisan',
            displayName: local.name,
            email: `${local.id}@karigarsaathi.local`,
            phone: local.phone,
            preferredLanguage: 'en',
            createdAt: '2026-08-20T10:00:00Z',
            updatedAt: '2026-08-20T10:00:00Z',
          });
        } else {
          setUser(null);
          setProfileIncomplete(false);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const signIn = async (phone: string, otp: string, role: 'artisan' | 'coordinator' = 'artisan') => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await authService.signIn(phone, otp, role);
      setUser(profile);
      setUserAccount({
        uid: profile.id,
        role: profile.role || role,
        displayName: profile.name,
        email: `${profile.id}@karigarsaathi.local`,
        phone: profile.phone,
        preferredLanguage: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logger.info('AUTH', 'Phone sign-in successful', { uid: profile.id, role: profile.role });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      logger.error('AUTH', 'Phone sign-in failed', err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (input: SignInInput) => {
    setIsLoading(true);
    setError(null);
    authSessionIdRef.current += 1;
    const currentSessionId = authSessionIdRef.current;

    try {
      const account = await authRepository.signIn(input);
      setUserAccount(account);
      await loadUserProfile(account, currentSessionId);
      logger.info('AUTH', 'Email sign-in successful', { uid: account.uid, role: account.role });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      logger.error('AUTH', 'Email sign-in failed', err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerArtisan = async (input: RegisterArtisanInput) => {
    setIsLoading(true);
    setError(null);
    authSessionIdRef.current += 1;
    const currentSessionId = authSessionIdRef.current;

    try {
      const account = await authRepository.register(input);
      setUserAccount(account);
      await loadUserProfile(account, currentSessionId);
      logger.info('AUTH', 'Artisan registration successful', { uid: account.uid });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      logger.error('AUTH', 'Artisan registration failed', err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    logger.info('AUTH', 'Initiating user sign out', {
      uid: userAccount?.uid || user?.id || undefined,
      role: userAccount?.role || user?.role || undefined,
    });

    setIsLoading(true);
    setIsSigningOut(true);
    isSigningOutRef.current = true;
    authSessionIdRef.current += 1;

    // Immediately clear in-memory state so UI will not flash stale roles
    setUser(null);
    setUserAccount(null);
    setProfileIncomplete(false);
    setError(null);

    try {
      await authRepository.signOut();
      await authService.signOut();
      logger.info('AUTH', 'User signed out cleanly');

      if (typeof window !== 'undefined') {
        try {
          const { router } = await import('@/app/router');
          if (router && typeof router.navigate === 'function') {
            await router.navigate(ROUTES.SIGN_IN, { replace: true });
          }
        } catch {
          // fallback in MemoryRouter / vitest environments
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign out failed';
      logger.error('AUTH', 'Sign out failed', err);
      setError(errorMsg);
      throw err;
    } finally {
      isSigningOutRef.current = false;
      setIsSigningOut(false);
      setIsLoading(false);
    }
  };

  const switchRole = (role: 'artisan' | 'coordinator') => {
    const currentUid = userAccount?.uid || user?.id;
    if (!currentUid) return;
    const updated = authService.switchRole(role, currentUid);
    if (updated) {
      setUser(updated);
    }
  };

  const retryProfileInit = async () => {
    if (userAccount) {
      setIsLoading(true);
      authSessionIdRef.current += 1;
      await loadUserProfile(userAccount, authSessionIdRef.current);
      setIsLoading(false);
    }
  };

  const isAuthenticated = Boolean((user || userAccount) && !isSigningOut);

  return (
    <AuthContext.Provider
      value={{
        user,
        userAccount,
        isAuthenticated,
        isLoading: isLoading || isSigningOut,
        isSigningOut,
        profileIncomplete,
        error,
        signIn,
        signInWithEmail,
        registerArtisan,
        signOut,
        switchRole,
        retryProfileInit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
