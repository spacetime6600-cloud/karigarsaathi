import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import { firebaseApp } from '@/config/firebase';
import { logger } from '@/services/logging/logger';

let appCheckInstance: AppCheck | null = null;

export function initAppCheck(): AppCheck | null {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;

  // In development without a key, log preparation status
  if (!siteKey) {
    logger.debug('APP_CHECK', 'App Check not initialized (site key omitted for local/emulator development)');
    return null;
  }

  try {
    // In dev mode, enable debug token if specified
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    appCheckInstance = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });

    logger.info('APP_CHECK', 'App Check initialized with ReCaptchaEnterpriseProvider');
    return appCheckInstance;
  } catch (err) {
    logger.error('APP_CHECK', 'Failed to initialize App Check', err);
    return null;
  }
}
