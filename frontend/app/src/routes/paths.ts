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
  PRODUCT_NEW_PHOTOS: '/artisan/products/new/photos',
  PRODUCT_NEW_DETAILS: '/artisan/products/new/details',
  PRODUCT_NEW_REVIEW: '/artisan/products/new/review',
  PRODUCT_NEW_PRICE: '/artisan/products/new/price',
  PRODUCT_NEW_PUBLIC_FIELDS: '/artisan/products/new/public-fields',
  PRODUCT_NEW_APPROVE: '/artisan/products/new/approve',
  PRODUCT_NEW_PASSPORT: '/artisan/products/new/passport',
  PRODUCT_NEW_SHARE: '/artisan/products/new/share',

  // Coordinator Workspace & Login
  COORDINATOR_LOGIN: '/coordinator/login',
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
    const cleanSlug = stepSlug.replace(/^\/+/, '').replace(/^artisan\/products\/new\//, '');
    const base = `/artisan/products/new/${cleanSlug}`;
    return draftId ? `${base}?draftId=${encodeURIComponent(draftId)}` : base;
  },
} as const;

/**
 * Validates and sanitizes a return URL to prevent open redirect vulnerabilities.
 * Only relative paths within the application are permitted.
 * Protocol-relative URLs (//example.com) and external schemas (javascript:, http:, etc.) are rejected.
 */
export function getSafeReturnUrl(url: string | null | undefined, defaultUrl: string = ROUTES.ARTISAN_DASHBOARD): string {
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

  return trimmed;
}

/**
 * Generates the full canonical public application URL for sharing or QR code rendering.
 */
export function getCanonicalPublicUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://karigarsaathi.web.app';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}
