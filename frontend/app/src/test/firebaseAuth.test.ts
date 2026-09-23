import { describe, it, expect } from 'vitest';
import { FirebaseAuthRepository } from '@/repositories/firebase/FirebaseAuthRepository';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

describe('Firebase Authentication & Error Normalization Regression Suite', () => {
  const repo = new FirebaseAuthRepository();

  describe('1. Error Code Normalization', () => {
    it('normalizes credential mismatch errors to privacy-safe message', () => {
      const errorUserNotFound = Object.assign(new Error('user not found'), { code: 'auth/user-not-found' });
      const errorWrongPassword = Object.assign(new Error('wrong password'), { code: 'auth/wrong-password' });
      const errorInvalidCred = Object.assign(new Error('invalid credential'), { code: 'auth/invalid-credential' });

      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorUserNotFound).message).toBe('Invalid email or password. Please check your credentials.');
      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorWrongPassword).message).toBe('Invalid email or password. Please check your credentials.');
      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorInvalidCred).message).toBe('Invalid email or password. Please check your credentials.');
    });

    it('distinguishes network and connectivity failures from credential errors', () => {
      const errorNetwork = Object.assign(new Error('network error'), { code: 'auth/network-request-failed' });
      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorNetwork).message).toBe(
        'Unable to connect to authentication service. Please check your network or local emulator.'
      );
    });

    it('normalizes rate limit, disabled account, and validation errors', () => {
      const errorTooMany = Object.assign(new Error('too many requests'), { code: 'auth/too-many-requests' });
      const errorDisabled = Object.assign(new Error('user disabled'), { code: 'auth/user-disabled' });
      const errorInvalidEmail = Object.assign(new Error('invalid email'), { code: 'auth/invalid-email' });
      const errorInUse = Object.assign(new Error('email in use'), { code: 'auth/email-already-in-use' });

      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorTooMany).message).toBe('Too many failed sign-in attempts. Please try again later.');
      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorDisabled).message).toBe('This account has been disabled. Please contact support.');
      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorInvalidEmail).message).toBe('Please enter a valid email address.');
      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorInUse).message).toBe('An account with this email address already exists.');
    });

    it('normalizes invalid or missing Firebase API key errors to clear deployment instructions', () => {
      const errorApiKeyNotValid = Object.assign(
        new Error('Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.).'),
        { code: 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' }
      );
      const errorShortApiKey = Object.assign(new Error('api key invalid'), { code: 'auth/api-key-not-valid' });
      const errorInvalidKey = Object.assign(new Error('invalid api key'), { code: 'auth/invalid-api-key' });

      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorApiKeyNotValid).message).toContain('VITE_FIREBASE_API_KEY');
      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorShortApiKey).message).toContain('VITE_FIREBASE_API_KEY');
      // @ts-expect-error accessing private method for unit testing
      expect(repo.normalizeError(errorInvalidKey).message).toContain('VITE_FIREBASE_API_KEY');
    });
  });

  describe('2. Live Auth Emulator Integration & Isolation', () => {
    it('authenticates seeded Artisan A and rejects wrong password', async () => {
      const testApp = initializeApp({ apiKey: 'fake', projectId: 'demo-karigarsaathi' }, `test-auth-app-${Date.now()}`);
      const testAuth = getAuth(testApp);
      connectAuthEmulator(testAuth, 'http://127.0.0.1:9099', { disableWarnings: true });

      try {
        // 1. Correct credentials succeed
        const cred = await signInWithEmailAndPassword(testAuth, 'artisan_a@karigarsaathi.local', 'KarigarPass123!');
        expect(cred.user.email).toBe('artisan_a@karigarsaathi.local');
        expect(cred.user.uid).toBeTruthy();

        // 2. Intentionally wrong password fails
        await expect(
          signInWithEmailAndPassword(testAuth, 'artisan_a@karigarsaathi.local', 'WrongPassword999!')
        ).rejects.toThrow();
      } finally {
        await deleteApp(testApp);
      }
    });

    it('authenticates seeded Artisan B with distinct UID', async () => {
      const testApp = initializeApp({ apiKey: 'fake', projectId: 'demo-karigarsaathi' }, `test-auth-app-b-${Date.now()}`);
      const testAuth = getAuth(testApp);
      connectAuthEmulator(testAuth, 'http://127.0.0.1:9099', { disableWarnings: true });

      try {
        const credA = await signInWithEmailAndPassword(testAuth, 'artisan_a@karigarsaathi.local', 'KarigarPass123!');
        let credB;
        try {
          credB = await signInWithEmailAndPassword(testAuth, 'artisan_b@karigarsaathi.local', 'KarigarPass123!');
        } catch {
          credB = await createUserWithEmailAndPassword(testAuth, 'artisan_b@karigarsaathi.local', 'KarigarPass123!');
        }

        expect(credA.user.uid).not.toBe(credB.user.uid);
      } finally {
        await deleteApp(testApp);
      }
    });
  });

  describe('3. Firebase Configuration Validation', () => {
    it('provides sanitized configuration and distinguishes emulator from production', async () => {
      const { getFirebaseConfig, EMULATOR_DUMMY_API_KEY } = await import('@/config/firebase');
      const configResult = getFirebaseConfig();

      expect(configResult).toHaveProperty('config');
      expect(configResult).toHaveProperty('isValid');
      expect(configResult).toHaveProperty('isEmulator');
      expect(configResult.config.apiKey).toBeTruthy();

      if (configResult.isEmulator) {
        expect(configResult.isValid).toBe(true);
        expect(configResult.config.apiKey).toBe(EMULATOR_DUMMY_API_KEY);
      }
    });
  });
});

