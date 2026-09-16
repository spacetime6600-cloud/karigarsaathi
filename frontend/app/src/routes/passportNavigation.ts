import { ROUTES, getSafeReturnUrl } from './paths';
import { ArtisanProfile } from '@/types';
import { UserAccount } from '@/domain/auth';

export interface PassportNavigationState {
  from?: string;
  fromLabel?: string;
  sourceRole?: 'artisan' | 'coordinator' | 'public';
}

export interface ValidatedPassportReturn {
  path: string;
  label: string;
  isFallback: boolean;
}

export function getValidatedPassportReturnRoute(
  rawFrom: unknown,
  user: ArtisanProfile | UserAccount | null | undefined,
  userRole?: string,
  fromLabelOverride?: string
): ValidatedPassportReturn {
  if (typeof rawFrom !== 'string' || !rawFrom.trim()) {
    return {
      path: ROUTES.HOME,
      label: 'Return to Home',
      isFallback: true,
    };
  }

  const safePath = getSafeReturnUrl(rawFrom, '');
  if (!safePath) {
    return {
      path: ROUTES.HOME,
      label: 'Return to Home',
      isFallback: true,
    };
  }

  // Extract base pathname without search query/hash for permission matching
  const [pathname] = safePath.split(/[?#]/);

  // 1. Artisan Routes (Protected)
  if (pathname.startsWith('/artisan')) {
    const isArtisan = Boolean(user && (user.role === 'artisan' || userRole === 'artisan'));
    if (!isArtisan) {
      return {
        path: ROUTES.HOME,
        label: 'Return to Home',
        isFallback: true,
      };
    }

    if (pathname.startsWith('/artisan/products/new')) {
      return {
        path: safePath,
        label: fromLabelOverride || 'Return to Product Creation',
        isFallback: false,
      };
    }

    if (pathname === ROUTES.ARTISAN_INVENTORY || pathname.startsWith('/artisan/inventory')) {
      return {
        path: safePath,
        label: fromLabelOverride || 'Return to Inventory',
        isFallback: false,
      };
    }

    if (pathname === ROUTES.ARTISAN_ENQUIRIES || pathname.startsWith('/artisan/enquiries')) {
      return {
        path: safePath,
        label: fromLabelOverride || 'Return to Enquiries',
        isFallback: false,
      };
    }

    return {
      path: safePath,
      label: fromLabelOverride || 'Return to Artisan Dashboard',
      isFallback: false,
    };
  }

  // 2. Coordinator Routes (Protected)
  if (pathname.startsWith('/coordinator')) {
    const isCoordinator = Boolean(user && (user.role === 'coordinator' || userRole === 'coordinator'));
    if (!isCoordinator) {
      return {
        path: ROUTES.HOME,
        label: 'Return to Home',
        isFallback: true,
      };
    }

    if (pathname.startsWith('/coordinator/reviews')) {
      return {
        path: safePath,
        label: fromLabelOverride || 'Return to Reviews Queue',
        isFallback: false,
      };
    }

    if (pathname.startsWith('/coordinator/artisans')) {
      return {
        path: safePath,
        label: fromLabelOverride || 'Return to Artisans Directory',
        isFallback: false,
      };
    }

    if (pathname.startsWith('/coordinator/enquiries')) {
      return {
        path: safePath,
        label: fromLabelOverride || 'Return to Enquiries',
        isFallback: false,
      };
    }

    if (pathname.startsWith('/coordinator/sales')) {
      return {
        path: safePath,
        label: fromLabelOverride || 'Return to Sales & Exports',
        isFallback: false,
      };
    }

    return {
      path: safePath,
      label: fromLabelOverride || 'Return to Coordinator Hub',
      isFallback: false,
    };
  }

  // 3. Public Marketplace Routes
  if (pathname === ROUTES.MARKETPLACE || pathname.startsWith('/marketplace')) {
    const label = fromLabelOverride
      ? `Return to ${fromLabelOverride}`
      : pathname.includes('/products/')
      ? 'Return to Marketplace Product'
      : 'Return to Marketplace';
    return {
      path: safePath,
      label,
      isFallback: false,
    };
  }

  // 4. Other Public Informational Routes
  if (pathname === ROUTES.ABOUT) {
    return { path: safePath, label: 'Return to About Us', isFallback: false };
  }
  if (pathname === ROUTES.REVIEWS) {
    return { path: safePath, label: 'Return to Reviews', isFallback: false };
  }
  if (pathname === ROUTES.HOME || pathname === '') {
    return { path: ROUTES.HOME, label: 'Return to Home', isFallback: true };
  }

  // Default safe relative route
  return {
    path: safePath,
    label: fromLabelOverride ? `Return to ${fromLabelOverride}` : 'Return to Previous Page',
    isFallback: false,
  };
}
