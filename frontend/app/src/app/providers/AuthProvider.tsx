import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ArtisanProfile } from '@/types';
import { UserAccount, RegisterArtisanInput, SignInInput } from '@/domain/auth';
import { authRepository, artisanProfileRepository } from '@/repositories';
import { authService } from '@/services/api/authService';
import { logger } from '@/services/logging/logger';

interface AuthContextType {
  user: ArtisanProfile | null;
  userAccount: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const [user, setUser] = useState<ArtisanProfile | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileIncomplete, setProfileIncomplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = useCallback(async (account: UserAccount) => {
    try {
      const activeRole: 'artisan' | 'coordinator' = (account.role as 'artisan' | 'coordinator') || 'artisan';
      const profile = await artisanProfileRepository.getCurrentProfile(account.uid);
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
      logger.error('AUTH', 'Failed to load user profile', err, { uid: account.uid });
      setProfileIncomplete(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authRepository.observeAuthState(async (account) => {
      setUserAccount(account);
      if (account) {
        await loadUserProfile(account);
      } else {
        const local = authService.getCurrentUser();
        setUser(local);
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (input: SignInInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const account = await authRepository.signIn(input);
      setUserAccount(account);
      await loadUserProfile(account);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerArtisan = async (input: RegisterArtisanInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const account = await authRepository.register(input);
      setUserAccount(account);
      await loadUserProfile(account);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authRepository.signOut();
      await authService.signOut();
      setUser(null);
      setUserAccount(null);
      setProfileIncomplete(false);
    } catch (err) {
      logger.error('AUTH', 'Sign out error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (role: 'artisan' | 'coordinator') => {
    const updated = authService.switchRole(role);
    setUser(updated);
  };

  const retryProfileInit = async () => {
    if (userAccount) {
      setIsLoading(true);
      await loadUserProfile(userAccount);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userAccount,
        isAuthenticated: !!user || !!userAccount,
        isLoading,
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
