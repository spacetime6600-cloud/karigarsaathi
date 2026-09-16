import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES, getSafeReturnUrl, getCanonicalPublicUrl } from '@/routes';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RouteScrollManager } from '@/components/layout/RouteScrollManager';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AudioHelpProvider } from '@/app/providers/AudioHelpProvider';
import { SyncProvider } from '@/app/providers/SyncProvider';
import { ProductDraftProvider } from '@/app/providers/ProductDraftProvider';
import { storage } from '@/services/storage/localStorage';
import { authService } from '@/services/api/authService';

// Page Components
import { LandingPage } from '@/features/landing/LandingPage';
import { AboutPage } from '@/features/about/AboutPage';
import { MarketplacePage } from '@/features/marketplace/MarketplacePage';
import { ProductDetailPage } from '@/features/marketplace/ProductDetailPage';
import { ReviewsPage } from '@/features/reviews/ReviewsPage';
import { SignInPage } from '@/features/authentication/SignInPage';
import { SignInSelectionPage } from '@/features/authentication/SignInSelectionPage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { PublicCraftPassportPage } from '@/features/craft-passport/PublicCraftPassportPage';
import { PublicPassportShell } from '@/layouts/PublicPassportShell';
import { ArtisanAppShell } from '@/layouts/ArtisanAppShell';
import { ProductCreationShell } from '@/layouts/ProductCreationShell';
import { CoordinatorShell } from '@/layouts/CoordinatorShell';
import { AddPhotographsPage } from '@/features/photographs/AddPhotographsPage';
import { AddProductDetailsPage } from '@/features/voice-details/AddProductDetailsPage';

describe('KarigarSaathi Comprehensive Routing & Navigation Audit', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    storage.clearAll();
    storage.set('selectedLanguage', 'en');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  // Helper to render router tree with real context providers
  const renderRouterTree = async (initialEntries: string[]) => {
    await act(async () => {
      root.render(
        <MemoryRouter key={initialEntries.join(',')} initialEntries={initialEntries}>
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <SyncProvider>
                  <ProductDraftProvider>
                    <RouteScrollManager />
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/marketplace" element={<MarketplacePage />} />
                      <Route path="/marketplace/products/:productId" element={<ProductDetailPage />} />
                      <Route path="/reviews" element={<ReviewsPage />} />
                      <Route path="/login" element={<SignInPage />} />
                      <Route path="/sign-in" element={<SignInSelectionPage />} />
                      <Route path="/coordinator/login" element={<SignInPage />} />

                      {/* Public Passport */}
                      <Route element={<PublicPassportShell />}>
                        <Route path="/passport/:publicSlug" element={<PublicCraftPassportPage />} />
                        <Route path="/p/:publicSlug" element={<PublicCraftPassportPage />} />
                      </Route>

                      {/* Authenticated Artisan Workspace */}
                      <Route
                        element={
                          <AuthGuard requiredRole="artisan">
                            <ArtisanAppShell />
                          </AuthGuard>
                        }
                      >
                        <Route path="/artisan/dashboard" element={<div data-testid="artisan-dashboard-view">Artisan Dashboard Content</div>} />
                        <Route path="/artisan/inventory" element={<div data-testid="artisan-inventory-view">Inventory Management Content</div>} />
                        <Route path="/inventory" element={<Navigate to="/artisan/inventory" replace />} />
                        <Route path="/artisan/enquiries" element={<div data-testid="artisan-enquiries-view">Enquiries Inbox Content</div>} />
                        <Route path="/enquiries" element={<Navigate to="/artisan/enquiries" replace />} />
                        <Route path="/artisan/enquiries/:enquiryId" element={<div data-testid="enquiry-reply-view">Enquiry Reply Content</div>} />
                      </Route>

                      {/* Product Creation Sequence (8 Steps) */}
                      <Route
                        element={
                          <AuthGuard requiredRole="artisan">
                            <ProductCreationShell />
                          </AuthGuard>
                        }
                      >
                        <Route path="/artisan/products/new/photos" element={<AddPhotographsPage />} />
                        <Route path="/artisan/products/new/details" element={<AddProductDetailsPage />} />
                        <Route path="/products/new/photos" element={<AddPhotographsPage />} />
                        <Route path="/products/new/details" element={<AddProductDetailsPage />} />
                      </Route>

                      {/* Coordinator Portal */}
                      <Route
                        element={
                          <AuthGuard requiredRole="coordinator">
                            <CoordinatorShell />
                          </AuthGuard>
                        }
                      >
                        <Route path="/coordinator" element={<div data-testid="coordinator-portal-view">Coordinator Hub Content</div>} />
                        <Route path="/coordinator/artisans" element={<div data-testid="coordinator-artisans-view">Artisans Directory Content</div>} />
                      </Route>

                      {/* 404 Catch All */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </ProductDraftProvider>
                </SyncProvider>
              </AudioHelpProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });
  };

  describe('1. Central URL & Safe Return Helper Tests', () => {
    it('generates canonical routes and dynamic parameters correctly', () => {
      expect(ROUTES.HOME).toBe('/');
      expect(ROUTES.MARKETPLACE).toBe('/marketplace');
      expect(ROUTES.LOGIN).toBe('/login');
      expect(ROUTES.productDetail('jamdani-saree-01')).toBe('/marketplace/products/jamdani-saree-01');
      expect(ROUTES.publicPassport('kp_7721')).toBe('/passport/kp_7721');
      expect(ROUTES.enquiryReply('enq_101')).toBe('/artisan/enquiries/enq_101');
      expect(ROUTES.productStep('photos', 'draft_99')).toBe('/artisan/products/new/photos?draftId=draft_99');
    });

    it('validates return URLs and prevents open redirect attacks', () => {
      // Safe relative internal URLs
      expect(getSafeReturnUrl('/artisan/inventory')).toBe('/artisan/inventory');
      expect(getSafeReturnUrl('/artisan/products/new/photos?draftId=123')).toBe('/artisan/products/new/photos?draftId=123');
      expect(getSafeReturnUrl('/coordinator/artisans')).toBe('/coordinator/artisans');

      // Malicious or external schemas rejected
      expect(getSafeReturnUrl('https://evil-phishing.com/steal')).toBe(ROUTES.ARTISAN_DASHBOARD);
      expect(getSafeReturnUrl('//attacker.com/exploit')).toBe(ROUTES.ARTISAN_DASHBOARD);
      expect(getSafeReturnUrl('javascript:alert(1)')).toBe(ROUTES.ARTISAN_DASHBOARD);
      expect(getSafeReturnUrl('data:text/html,<script>evil()</script>')).toBe(ROUTES.ARTISAN_DASHBOARD);
      expect(getSafeReturnUrl('')).toBe(ROUTES.ARTISAN_DASHBOARD);
      expect(getSafeReturnUrl(null)).toBe(ROUTES.ARTISAN_DASHBOARD);
      expect(getSafeReturnUrl(undefined)).toBe(ROUTES.ARTISAN_DASHBOARD);
    });

    it('generates canonical public URLs with configured origin', () => {
      const url = getCanonicalPublicUrl('/passport/chanderi-saree');
      expect(url).toContain('/passport/chanderi-saree');
      expect(url.startsWith('http')).toBe(true);
    });
  });

  describe('2. Public Website Navigation Tests', () => {
    it('renders Landing Homepage at "/" with all navigation links', async () => {
      await renderRouterTree(['/']);

      expect(container.textContent).toContain('KarigarSaathi');
      expect(container.textContent).toContain('Home');
      expect(container.textContent).toContain('About Us');
      expect(container.textContent).toContain('Sign in');
      expect(container.textContent).toContain('craft heritage');

      const homeLink = container.querySelector('nav[aria-label="Public Navigation"] a[href="/"]');
      const aboutLink = container.querySelector('a[href="/about"]');
      const marketplaceLink = container.querySelector('a[href="/marketplace"]');
      const reviewsLink = container.querySelector('a[href="/reviews"]');
      const signInLink = container.querySelector('a[href="/sign-in"]');

      expect(homeLink).not.toBeNull();
      expect(aboutLink).not.toBeNull();
      expect(marketplaceLink).not.toBeNull();
      expect(reviewsLink).not.toBeNull();
      expect(signInLink).not.toBeNull();
    });

    it('renders Marketplace Page at "/marketplace" with craft categories and products', async () => {
      await renderRouterTree(['/marketplace']);

      expect(container.textContent).toContain('Explore by craft');
      expect(container.textContent).toContain('Selected handmade pieces');
      expect(container.textContent).toContain('Textiles & Handloom');
      expect(container.textContent).toContain('Pottery & Ceramics');
    });

    it('renders Product Detail Page at "/marketplace/products/:productId" with specifications', async () => {
      await renderRouterTree(['/marketplace/products/prod_jamdani_01']);

      expect(container.textContent).toContain('Indigo & Terracotta Silk Jamdani Saree');
      expect(container.textContent).toContain('Pure Mulberry Silk');
      expect(container.textContent).toContain('Back to marketplace');
      expect(container.textContent).toContain('Craft Story & Provenance');
    });

    it('renders explicit Not Found card when invalid product ID is accessed on marketplace', async () => {
      await renderRouterTree(['/marketplace/products/non_existent_fake_id_999']);

      expect(container.textContent).toContain('Craft Item Not Found');
      expect(container.textContent).toContain('non_existent_fake_id_999');
      expect(container.textContent).toContain('Explore Other Authentic Crafts');
    });

    it('renders About Us page at "/about"', async () => {
      await renderRouterTree(['/about']);

      expect(container.textContent).toContain('Technology that works with artisans');
      expect(container.textContent).toContain('Artisan Dignity & Provenance');
    });

    it('renders Reviews page at "/reviews"', async () => {
      await renderRouterTree(['/reviews']);

      expect(container.textContent).toContain('Stories from buyers and craft communities');
    });

    it('renders 404 page for unknown routes with navigation options', async () => {
      await renderRouterTree(['/unknown/nonexistent/route/xyz']);

      expect(container.textContent).toContain('Error 404');
      expect(container.textContent).toContain('Page or Craft Record Not Found');
      expect(container.textContent).toContain('Return to Homepage');
      expect(container.textContent).toContain('Explore Marketplace');
    });
  });

  describe('3. Protected Deep Links & AuthGuard Redirection Tests', () => {
    it('redirects unauthenticated user from protected artisan dashboard to /sign-in', async () => {
      await authService.signOut();
      await renderRouterTree(['/artisan/dashboard']);

      // Should be redirected to sign in choice portal
      expect(container.querySelector('[data-testid="artisan-dashboard-view"]')).toBeNull();
      expect(container.textContent).toContain('Welcome to KarigarSaathi');
      expect(container.textContent).toContain('Artisan sign in');
      expect(container.textContent).toContain('Coordinator sign in');
    });

    it('redirects unauthenticated user from protected inventory to /sign-in', async () => {
      await authService.signOut();
      await renderRouterTree(['/artisan/inventory']);

      expect(container.querySelector('[data-testid="artisan-inventory-view"]')).toBeNull();
      expect(container.textContent).toContain('Welcome to KarigarSaathi');
    });

    it('redirects unauthenticated user from protected coordinator portal to /sign-in', async () => {
      await authService.signOut();
      await renderRouterTree(['/coordinator']);

      expect(container.querySelector('[data-testid="coordinator-portal-view"]')).toBeNull();
      expect(container.textContent).toContain('Welcome to KarigarSaathi');
    });

    it('redirects unauthenticated user from product creation to /sign-in', async () => {
      await authService.signOut();
      await renderRouterTree(['/artisan/products/new/photos']);

      expect(container.textContent).toContain('Welcome to KarigarSaathi');
    });
  });

  describe('4. Authenticated Workspace & Role Protection Tests', () => {
    it('allows authenticated artisan access to /artisan/dashboard', async () => {
      // Sign in as artisan
      await authService.signIn('9876543210', '123456', 'artisan');

      await renderRouterTree(['/artisan/dashboard']);

      expect(container.querySelector('[data-testid="artisan-dashboard-view"]')).not.toBeNull();
      expect(container.textContent).toContain('Artisan Dashboard Content');
    });

    it('allows authenticated artisan access to /artisan/inventory and legacy alias /inventory', async () => {
      await authService.signIn('9876543210', '123456', 'artisan');

      await renderRouterTree(['/artisan/inventory']);
      expect(container.querySelector('[data-testid="artisan-inventory-view"]')).not.toBeNull();

      // Test alias /inventory
      await renderRouterTree(['/inventory']);
      expect(container.querySelector('[data-testid="artisan-inventory-view"]')).not.toBeNull();
    });

    it('enforces role restriction when an artisan tries to access /coordinator', async () => {
      await authService.signIn('9876543210', '123456', 'artisan');

      await renderRouterTree(['/coordinator']);

      // Coordinator view should be blocked
      expect(container.querySelector('[data-testid="coordinator-portal-view"]')).toBeNull();
      expect(container.textContent).toContain('Role Access Restricted');
      expect(container.textContent).toContain('This area is restricted to authorized coordinator accounts');
      expect(container.textContent).toContain('Sign In with Coordinator Credentials');
    });

    it('allows authenticated coordinator access to /coordinator and blocks /artisan/dashboard', async () => {
      await authService.signIn('9123456780', '123456', 'coordinator');

      await renderRouterTree(['/coordinator']);
      expect(container.querySelector('[data-testid="coordinator-portal-view"]')).not.toBeNull();

      // Accessing artisan dashboard as coordinator shows restriction
      await renderRouterTree(['/artisan/dashboard']);
      expect(container.querySelector('[data-testid="artisan-dashboard-view"]')).toBeNull();
      expect(container.textContent).toContain('Role Access Restricted');
      expect(container.textContent).toContain('This area is restricted to authorized artisan accounts');
    });
  });

  describe('5. Public Craft Passport Shell Tests', () => {
    it('renders Public Passport Shell without authentication', async () => {
      await authService.signOut();

      await renderRouterTree(['/passport/chanderi-silk-saree-kamrup-7721']);

      expect(container.textContent).toContain('KarigarSaathi Craft Passport');
      const backButton = container.querySelector('button[aria-label="Return to Home"]');
      expect(backButton).not.toBeNull();
    });
  });
});
