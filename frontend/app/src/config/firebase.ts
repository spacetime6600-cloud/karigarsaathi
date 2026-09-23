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

export interface FirebaseConfigValidation {
  config: FirebaseConfig;
  isValid: boolean;
  isEmulator: boolean;
  missingFields: string[];
}

export const EMULATOR_DUMMY_API_KEY = 'AIzaSyDemoFakeApiKeyForLocalEmulator123';
export const EMULATOR_DUMMY_PROJECT_ID = 'demo-karigarsaathi';
export const EMULATOR_DUMMY_AUTH_DOMAIN = 'demo-karigarsaathi.firebaseapp.com';
export const EMULATOR_DUMMY_STORAGE_BUCKET = 'demo-karigarsaathi.appspot.com';
export const EMULATOR_DUMMY_MESSAGING_SENDER_ID = '123456789012';
export const EMULATOR_DUMMY_APP_ID = '1:123456789012:web:abcdef1234567890abcdef';

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted || undefined;
  }
  return trimmed || undefined;
}

export function checkIsEmulatorMode(): boolean {
  const explicitlyDisabled = cleanEnv(import.meta.env.VITE_USE_FIREBASE_EMULATORS) === 'false';
  if (explicitlyDisabled) return false;

  const explicitlyEnabled = cleanEnv(import.meta.env.VITE_USE_FIREBASE_EMULATORS) === 'true';
  if (explicitlyEnabled) return true;

  // Never connect emulators in production unless explicitly enabled
  if (import.meta.env.PROD) return false;

  const rawProjectId = cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
  const isDemo = !rawProjectId || rawProjectId.startsWith('demo-');
  return Boolean(import.meta.env.DEV) && isDemo;
}

export const isEmulatorMode = checkIsEmulatorMode();

export function getFirebaseConfig(): FirebaseConfigValidation {
  const envApiKey = cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY);
  const envAuthDomain = cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  const envProjectId = cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
  const envStorageBucket = cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
  const envMessagingSenderId = cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
  const envAppId = cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID);
  const envMeasurementId = cleanEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID);

  if (isEmulatorMode) {
    return {
      config: {
        apiKey: envApiKey || EMULATOR_DUMMY_API_KEY,
        authDomain: envAuthDomain || EMULATOR_DUMMY_AUTH_DOMAIN,
        projectId: envProjectId || EMULATOR_DUMMY_PROJECT_ID,
        storageBucket: envStorageBucket || EMULATOR_DUMMY_STORAGE_BUCKET,
        messagingSenderId: envMessagingSenderId || EMULATOR_DUMMY_MESSAGING_SENDER_ID,
        appId: envAppId || EMULATOR_DUMMY_APP_ID,
        measurementId: envMeasurementId,
      },
      isValid: true,
      isEmulator: true,
      missingFields: [],
    };
  }

  // Production configuration: do NOT fall back to dummy emulator keys!
  const config: FirebaseConfig = {
    apiKey: envApiKey || '',
    authDomain: envAuthDomain || '',
    projectId: envProjectId || '',
    storageBucket: envStorageBucket || '',
    messagingSenderId: envMessagingSenderId || '',
    appId: envAppId || '',
    measurementId: envMeasurementId,
  };

  const missingFields: string[] = [];
  if (!config.apiKey || config.apiKey === EMULATOR_DUMMY_API_KEY) {
    missingFields.push('VITE_FIREBASE_API_KEY');
  }
  if (!config.authDomain || config.authDomain.includes('demo-karigarsaathi')) {
    missingFields.push('VITE_FIREBASE_AUTH_DOMAIN');
  }
  if (!config.projectId || config.projectId.startsWith('demo-')) {
    missingFields.push('VITE_FIREBASE_PROJECT_ID');
  }
  if (!config.storageBucket || config.storageBucket.includes('demo-karigarsaathi')) {
    missingFields.push('VITE_FIREBASE_STORAGE_BUCKET');
  }
  if (!config.messagingSenderId || config.messagingSenderId === EMULATOR_DUMMY_MESSAGING_SENDER_ID) {
    missingFields.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  }
  if (!config.appId || config.appId === EMULATOR_DUMMY_APP_ID) {
    missingFields.push('VITE_FIREBASE_APP_ID');
  }

  return {
    config,
    isValid: missingFields.length === 0,
    isEmulator: false,
    missingFields,
  };
}

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
  const { config: resolvedConfig, isValid: isConfigValid, isEmulator, missingFields } = getFirebaseConfig();

  if (!isConfigValid && !isEmulator) {
    logger.error('SYSTEM', 'Incomplete Firebase production configuration', {
      missingOrPlaceholderFields: missingFields,
      action: 'Configure these environment variables in Vercel Project Settings and trigger a redeployment.',
    });
  }

  if (!getApps().length) {
    firebaseApp = initializeApp(resolvedConfig);
    logger.info('SYSTEM', 'Firebase App initialized', {
      projectId: resolvedConfig.projectId || '(unconfigured)',
      isEmulator,
      isValid: isConfigValid,
    });
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

  if (isEmulatorMode && !globalThis.__FIREBASE_EMULATORS_CONNECTED__) {
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

