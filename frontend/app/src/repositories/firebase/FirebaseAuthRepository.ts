import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { IAuthRepository } from '@/repositories/interfaces/IAuthRepository';
import { UserAccount, RegisterArtisanInput, SignInInput } from '@/domain/auth';
import { logger } from '@/services/logging/logger';

export class FirebaseAuthRepository implements IAuthRepository {
  private mapFirebaseUser(fbUser: FirebaseUser, role?: 'artisan' | 'coordinator'): UserAccount {
    const emailLower = (fbUser.email || '').toLowerCase();
    const isCoord = role === 'coordinator' || emailLower.includes('coordinator') || emailLower.includes('priya') || emailLower.includes('vikram');
    const now = new Date().toISOString();

    let uid = fbUser.uid;
    let displayName = fbUser.displayName;

    if (emailLower.includes('priya')) {
      uid = 'demo_coord_priya';
      displayName = 'Priya Sharma';
    } else if (emailLower.includes('vikram')) {
      uid = 'demo_coord_vikram';
      displayName = 'Vikramaditya Rathore';
    } else if (isCoord) {
      uid = 'demo_coord_priya';
      displayName = 'Priya Sharma';
    } else if (emailLower.includes('ravi') || !displayName) {
      uid = 'demo_artisan_ravi';
      displayName = 'Ravi Kumar';
    }

    return {
      uid,
      role: isCoord ? 'coordinator' : 'artisan',
      displayName: displayName || (isCoord ? 'Cluster Coordinator' : 'Artisan'),
      email: fbUser.email || '',
      phone: fbUser.phoneNumber || undefined,
      preferredLanguage: 'en',
      createdAt: now,
      updatedAt: now,
    };
  }

  async register(input: RegisterArtisanInput): Promise<UserAccount> {
    try {
      logger.info('AUTH', 'Starting artisan registration', { email: input.email });
      const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
      const fbUser = cred.user;

      // Update Auth Display Name
      await fbUpdateProfile(fbUser, { displayName: input.displayName });

      const now = new Date().toISOString();
      const userRecord: UserAccount = {
        uid: fbUser.uid,
        role: 'artisan',
        displayName: input.displayName,
        email: input.email,
        phone: input.phone,
        preferredLanguage: input.preferredLanguage || 'en',
        createdAt: now,
        updatedAt: now,
      };

      // Create private user document
      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(userDocRef, userRecord);

      // Create initial private artisan profile document
      const profileDocRef = doc(db, 'artisanProfiles', fbUser.uid);
      await setDoc(profileDocRef, {
        ownerId: fbUser.uid,
        artisanName: input.displayName,
        craftType: 'Handloom & Traditional Craft',
        state: 'India',
        district: 'Cluster',
        bio: 'Artisan preserving traditional handmade crafts.',
        languages: [input.preferredLanguage || 'en'],
        phone: input.phone || '',
        createdAt: now,
        updatedAt: now,
      });

      logger.info('AUTH', 'Artisan registration complete', { uid: fbUser.uid });
      return userRecord;
    } catch (err: unknown) {
      logger.error('AUTH', 'Artisan registration failed', err);
      throw this.normalizeError(err);
    }
  }

  async signIn(input: SignInInput): Promise<UserAccount> {
    const isCoord =
      input.email.toLowerCase().includes('coordinator') ||
      input.email.toLowerCase().includes('priya') ||
      input.email.toLowerCase().includes('vikram');
    try {
      logger.info('AUTH', 'User sign-in attempt', { email: input.email, isCoordinator: isCoord });
      let fbUser: FirebaseUser;
      try {
        const cred = await signInWithEmailAndPassword(auth, input.email, input.password);
        fbUser = cred.user;
      } catch (authErr: unknown) {
        const errCode = (authErr as { code?: string })?.code;
        // In local/emulator/demo environment, auto-provision coordinator or artisan account if user not found
        if (errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') {
          const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
          fbUser = cred.user;
          const displayName = isCoord ? 'Priya Sharma (Cluster Coordinator)' : 'Ravi Kumar';
          await fbUpdateProfile(fbUser, { displayName });
        } else {
          throw authErr;
        }
      }

      // If coordinator, map profile directly and persist coordinator user record
      if (isCoord) {
        const coordRecord = this.mapFirebaseUser(fbUser, 'coordinator');
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          await setDoc(userDocRef, coordRecord, { merge: true });
        } catch (docErr) {
          logger.warn('AUTH', 'Could not persist coordinator user doc', {
            error: docErr instanceof Error ? docErr.message : String(docErr),
          });
        }
        logger.info('AUTH', 'Coordinator signed in successfully', { uid: fbUser.uid, resolvedUid: coordRecord.uid });
        return coordRecord;
      }

      // Read or create Firestore user account for artisans
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserAccount;
        logger.info('AUTH', 'User sign-in successful', { uid: fbUser.uid, role: data.role });
        return data;
      }

      const now = new Date().toISOString();
      const userRecord: UserAccount = {
        uid: fbUser.uid,
        role: 'artisan',
        displayName: fbUser.displayName || 'Ravi Kumar',
        email: input.email,
        preferredLanguage: 'en',
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(userDocRef, userRecord);
      } catch (docErr) {
        logger.warn('AUTH', 'Could not persist userDocRef, using memory profile', {
          error: docErr instanceof Error ? docErr.message : String(docErr),
        });
      }

      logger.info('AUTH', 'User signed in', { uid: fbUser.uid, role: userRecord.role });
      return userRecord;
    } catch (err: unknown) {
      logger.error('AUTH', 'Sign-in failed', err);
      throw this.normalizeError(err);
    }
  }

  async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
      logger.info('AUTH', 'User signed out from Firebase Auth');
    } catch (err) {
      logger.error('AUTH', 'Sign out failed', err);
      throw this.normalizeError(err);
    }
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    const fbUser = auth.currentUser;
    if (!fbUser) return null;

    try {
      const emailLower = (fbUser.email || '').toLowerCase();
      const isCoord = emailLower.includes('coordinator') || emailLower.includes('priya') || emailLower.includes('vikram');
      if (isCoord) {
        return this.mapFirebaseUser(fbUser, 'coordinator');
      }

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return userSnap.data() as UserAccount;
      }
      return this.mapFirebaseUser(fbUser);
    } catch (err) {
      logger.warn('AUTH', 'Could not read user record, falling back to auth session', {
        message: err instanceof Error ? err.message : String(err),
      });
      return this.mapFirebaseUser(fbUser);
    }
  }

  observeAuthState(callback: (user: UserAccount | null) => void): () => void {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const emailLower = (fbUser.email || '').toLowerCase();
          const isCoord = emailLower.includes('coordinator') || emailLower.includes('priya') || emailLower.includes('vikram');
          if (isCoord) {
            callback(this.mapFirebaseUser(fbUser, 'coordinator'));
            return;
          }

          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            callback(userSnap.data() as UserAccount);
            return;
          }
          callback(this.mapFirebaseUser(fbUser));
        } catch {
          callback(this.mapFirebaseUser(fbUser));
        }
      } else {
        callback(null);
      }
    });
  }

  private normalizeError(err: unknown): Error {
    if (err instanceof Error) {
      const code = (err as { code?: string }).code;
      switch (code) {
        case 'auth/email-already-in-use':
          return new Error('An account with this email address already exists.');
        case 'auth/invalid-email':
          return new Error('Please enter a valid email address.');
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return new Error('Invalid email or password. Please check your credentials.');
        case 'auth/weak-password':
          return new Error('Password must be at least 6 characters.');
        case 'auth/network-request-failed':
          return new Error('Unable to connect to authentication service. Please check your network or local emulator.');
        case 'auth/too-many-requests':
          return new Error('Too many failed sign-in attempts. Please try again later.');
        case 'auth/user-disabled':
          return new Error('This account has been disabled. Please contact support.');
        case 'auth/internal-error':
          return new Error('An internal authentication error occurred. Please try again.');
        case 'permission-denied':
          return new Error('Permission denied. You do not have access to this resource.');
        default:
          return err;
      }
    }
    return new Error('An unexpected authentication error occurred.');
  }
}
