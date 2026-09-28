/**
 * KarigarSaathi — Central Typed Route Definitions & URL Helpers
 * Provides canonical path constants, dynamic parameter encoders, and open-redirect safe return URL validation.
 */

export const ROUTES = {
  // Public Marketing & Informational
  HOME: '/',
  ABOUT: '/about',
  MARKETPLACE: '/marketplace',
  REVIEWS: '/reviews',

  // Public Onboarding & Authentication
  LANGUAGE: '/language',
  LOGIN: '/login',
  SIGN_IN: '/sign-in',

  // Authenticated Artisan Workspace
  ARTISAN_DASHBOARD: '/artisan/dashboard',
  ARTISAN_INVENTORY: '/artisan/inventory',
  ARTISAN_ENQUIRIES: '/artisan/enquiries',

  // Add Product Sequence (8 Steps)
  PRODUCT_NEW: '/artisan/products/new',
  PRODUCT_NEW_PHOTOS: '/artisan/products/new/photos',
  PRODUCT_NEW_DETAILS: '/artisan/products/new/details',
  PRODUCT_NEW_REVIEW: '/artisan/products/new/review',
  PRODUCT_NEW_PRICE: '/artisan/products/new/price',
  PRODUCT_NEW_PRICING: '/artisan/products/new/pricing',
  PRODUCT_NEW_PUBLIC_FIELDS: '/artisan/products/new/public-fields',
  PRODUCT_NEW_APPROVE: '/artisan/products/new/approve',
  PRODUCT_NEW_PASSPORT: '/artisan/products/new/passport',
  PRODUCT_NEW_PASSPORT_CREATED: '/artisan/products/new/passport-created',
  PRODUCT_NEW_SHARE: '/artisan/products/new/share',

  // Coordinator Workspace & Login
  COORDINATOR_LOGIN: '/coordinator/login',
  COORDINATOR_REGISTER: '/coordinator/register',
  COORDINATOR_DASHBOARD: '/coordinator',
  COORDINATOR_ARTISANS: '/coordinator/artisans',
  COORDINATOR_REVIEWS: '/coordinator/reviews',
  COORDINATOR_ENQUIRIES: '/coordinator/enquiries',
  COORDINATOR_SALES: '/coordinator/sales',
  COORDINATOR_SETTINGS: '/coordinator/settings',
  COORDINATOR_INCOMPLETE: '/coordinator/reviews?tab=needs_review',
  COORDINATOR_EXPORTS: '/coordinator/sales?tab=exports',

  // Developer Sandbox (Direct access only)
  DEV_STATES: '/dev/states',

  // Dynamic Parameter Helper Functions
  artisanDetail: (artisanId: string) => `/coordinator/artisans/${encodeURIComponent(artisanId)}`,
  coordinatorEnquiryDetail: (enquiryId: string) => `/coordinator/enquiries/${encodeURIComponent(enquiryId)}`,
  productDetail: (productId: string) => `/marketplace/products/${encodeURIComponent(productId)}`,
  publicPassport: (slugOrId: string) => `/passport/${encodeURIComponent(slugOrId)}`,
  enquiryReply: (enquiryId: string) => `/artisan/enquiries/${encodeURIComponent(enquiryId)}`,
  productStep: (stepSlug: string, draftId?: string) => {
    let cleanSlug = stepSlug.replace(/^\/+/, '').replace(/^artisan\/products\/new\//, '');
    if (cleanSlug === 'pricing') cleanSlug = 'price';
    if (cleanSlug === 'passport-created') cleanSlug = 'passport';
    const base = `/artisan/products/new/${cleanSlug}`;
    return draftId ? `${base}?draftId=${encodeURIComponent(draftId)}` : base;
  },
} as const;

/**
 * Checks whether a relative application path is compatible with a given role.
 * Prevents cross-role redirection (e.g. an artisan returnUrl sent to a coordinator or vice versa).
 */
export function isPathRoleCompatible(
  url: string | null | undefined,
  targetRole?: 'artisan' | 'coordinator' | 'buyer'
): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return false;
  }

  // Extract base pathname without query string or hash
  const pathname = trimmed.split('?')[0].split('#')[0];

  // Auth pages and default roots should never be return URLs (avoids loops & cross-role traps)
  const authOrRootPaths = [
    '/',
    ROUTES.SIGN_IN,
    ROUTES.LOGIN,
    ROUTES.COORDINATOR_LOGIN,
    ROUTES.COORDINATOR_REGISTER,
    ROUTES.LANGUAGE,
  ];
  if (authOrRootPaths.includes(pathname)) {
    return false;
  }

  // Artisan-specific workspaces
  const isArtisanPath =
    pathname.startsWith('/artisan') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/enquiries') ||
    pathname.startsWith('/products/new');

  // Coordinator-specific workspaces
  const isCoordinatorPath =
    pathname.startsWith('/coordinator') &&
    pathname !== ROUTES.COORDINATOR_LOGIN &&
    pathname !== ROUTES.COORDINATOR_REGISTER;

  if (targetRole === 'coordinator') {
    // A coordinator should never be redirected to an artisan workspace
    if (isArtisanPath) return false;
    return true;
  }

  if (targetRole === 'artisan') {
    // An artisan should never be redirected to a coordinator workspace
    if (isCoordinatorPath) return false;
    return true;
  }

  return true;
}

/**
 * Validates and sanitizes a return URL to prevent open redirect vulnerabilities and cross-role traps.
 * Only relative paths within the application are permitted.
 * Role boundaries are strictly enforced to prevent coordinators from landing on artisan dashboards or vice versa.
 */
export function getSafeReturnUrl(
  url: string | null | undefined,
  defaultUrl: string = ROUTES.ARTISAN_DASHBOARD,
  targetRole?: 'artisan' | 'coordinator' | 'buyer'
): string {
  if (!url || typeof url !== 'string') return defaultUrl;

  const trimmed = url.trim();

  // Reject empty string or standalone root
  if (!trimmed) return defaultUrl;

  // Reject external protocols, protocol-relative, data URLs, javascript:
  if (
    trimmed.startsWith('//') ||
    trimmed.includes('://') ||
    trimmed.toLowerCase().startsWith('javascript:') ||
    trimmed.toLowerCase().startsWith('data:')
  ) {
    return defaultUrl;
  }

  // Must begin with a single slash
  if (!trimmed.startsWith('/') || trimmed.startsWith('/\\')) {
    return defaultUrl;
  }

  // Reject control characters or newlines
  if (/[\r\n\t]/.test(trimmed)) {
    return defaultUrl;
  }

  // Extract base pathname
  const pathname = trimmed.split('?')[0].split('#')[0];

  // Auth pages and default roots should never be return URLs:
  if (
    pathname === ROUTES.SIGN_IN ||
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.COORDINATOR_LOGIN ||
    pathname === ROUTES.COORDINATOR_REGISTER ||
    pathname === ROUTES.LANGUAGE
  ) {
    return defaultUrl;
  }

  // If a target role is specified, strictly enforce role boundaries:
  if (targetRole) {
    if (targetRole === 'coordinator') {
      if (
        pathname === ROUTES.ARTISAN_DASHBOARD ||
        pathname === ROUTES.COORDINATOR_DASHBOARD ||
        pathname === '/coordinator/dashboard' ||
        !isPathRoleCompatible(trimmed, 'coordinator')
      ) {
        return defaultUrl;
      }
    }

    if (targetRole === 'artisan') {
      if (
        pathname === ROUTES.ARTISAN_DASHBOARD ||
        pathname === ROUTES.COORDINATOR_DASHBOARD ||
        pathname === '/coordinator/dashboard' ||
        !isPathRoleCompatible(trimmed, 'artisan')
      ) {
        return defaultUrl;
      }
    }
  } else {
    // If targetRole is not passed, infer from default destination if it's coordinator
    if (defaultUrl.startsWith('/coordinator')) {
      if (pathname === ROUTES.ARTISAN_DASHBOARD || !isPathRoleCompatible(trimmed, 'coordinator')) {
        return defaultUrl;
      }
    }
    if (defaultUrl.startsWith('/artisan') && (pathname === ROUTES.COORDINATOR_DASHBOARD || pathname === '/coordinator/dashboard')) {
      return defaultUrl;
    }
  }

  return trimmed;
}

/**
 * Generates the full canonical public application URL for sharing or QR code rendering.
 */
export function getCanonicalPublicUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://karigarsaathi.vercel.app';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}
