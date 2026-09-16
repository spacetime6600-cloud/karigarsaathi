import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { logger } from '@/services/logging/logger';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Fallback configuration for demo-karigarsaathi emulator environment
const fallbackConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoFakeApiKeyForLocalEmulator123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-karigarsaathi.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-karigarsaathi',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-karigarsaathi.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890abcdef',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Global flags to prevent re-attaching emulators during Vite HMR
declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_EMULATORS_CONNECTED__: boolean | undefined;
}

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(fallbackConfig);
    logger.info('SYSTEM', 'Firebase App initialized', { projectId: fallbackConfig.projectId });
  } else {
    firebaseApp = getApp();
  }

  auth = getAuth(firebaseApp);

  try {
    db = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    logger.info('FIRESTORE', 'Firestore initialized with persistent multi-tab local cache');
  } catch {
    try {
      db = getFirestore(firebaseApp);
      logger.info('FIRESTORE', 'Firestore retrieved from existing instance');
    } catch {
      db = initializeFirestore(firebaseApp, {
        localCache: memoryLocalCache(),
      });
      logger.info('FIRESTORE', 'Firestore initialized with memory local cache');
    }
  }

  storage = getStorage(firebaseApp);

  const explicitlyDisabled = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'false';
  const explicitlyEnabled = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
  const isDemoProject = fallbackConfig.projectId.startsWith('demo-');
  const useEmulators = !explicitlyDisabled && (explicitlyEnabled || (Boolean(import.meta.env.DEV) && isDemoProject));

  if (useEmulators && !globalThis.__FIREBASE_EMULATORS_CONNECTED__) {
    const authHost = '127.0.0.1:9099';
    const firestoreHost = '127.0.0.1';
    const firestorePort = 8085;
    const storageHost = '127.0.0.1';
    const storagePort = 9199;

    try {
      connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
      connectFirestoreEmulator(db, firestoreHost, firestorePort);
      connectStorageEmulator(storage, storageHost, storagePort);
      globalThis.__FIREBASE_EMULATORS_CONNECTED__ = true;

      logger.info('EMULATOR', 'Connected to Firebase Local Emulator Suite', {
        auth: authHost,
        firestore: `${firestoreHost}:${firestorePort}`,
        storage: `${storageHost}:${storagePort}`,
      });
    } catch (err) {
      logger.warn('EMULATOR', 'Emulator connection notice (may already be bound during HMR)', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

initializeFirebase();

export { firebaseApp, auth, db, storage };
