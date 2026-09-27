/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ROUTES, getSafeReturnUrl, getCanonicalPublicUrl, getValidatedPassportReturnRoute } from '@/routes';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { PublicCraftPassportPage } from '@/features/craft-passport/PublicCraftPassportPage';
import { storage } from '@/services/storage/localStorage';

describe('Routing and Navigation Architecture Audit Suite', () => {
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

  describe('1. Open-Redirect Security & URL Sanitization', () => {
    it('allows valid application relative URLs', () => {
      expect(getSafeReturnUrl('/artisan/dashboard')).toBe('/artisan/dashboard');
      expect(getSafeReturnUrl('/artisan/products/new/details?draftId=d123')).toBe('/artisan/products/new/details?draftId=d123');
      expect(getSafeReturnUrl('/coordinator/reviews?tab=needs_review')).toBe('/coordinator/reviews?tab=needs_review');
      expect(getSafeReturnUrl('/passport/chanderi-silk-7721')).toBe('/passport/chanderi-silk-7721');
    });

    it('rejects external URLs and protocol-relative attempts, falling back safely', () => {
      const fallback = ROUTES.ARTISAN_DASHBOARD;
      expect(getSafeReturnUrl('https://evil.com/hack', fallback)).toBe(fallback);
      expect(getSafeReturnUrl('http://attacker.org', fallback)).toBe(fallback);
      expect(getSafeReturnUrl('//evil.com/bypass', fallback)).toBe(fallback);
      expect(getSafeReturnUrl('javascript:alert(1)', fallback)).toBe(fallback);
      expect(getSafeReturnUrl('data:text/html,<script>alert(1)</script>', fallback)).toBe(fallback);
      expect(getSafeReturnUrl('', fallback)).toBe(fallback);
      expect(getSafeReturnUrl('   ', fallback)).toBe(fallback);
      expect(getSafeReturnUrl(null, fallback)).toBe(fallback);
      expect(getSafeReturnUrl(undefined, fallback)).toBe(fallback);
    });

    it('generates canonical public URLs with the active origin', () => {
      const url = getCanonicalPublicUrl('/passport/sample-slug');
      expect(url).toContain('/passport/sample-slug');
      expect(url.startsWith('http')).toBe(true);
    });
  });

  describe('2. Product Creation 8-Step Wizard URL Helpers & Aliases', () => {
    it('normalizes step paths and appends draftId correctly', () => {
      expect(ROUTES.productStep('photos', 'draft_101')).toBe('/artisan/products/new/photos?draftId=draft_101');
      expect(ROUTES.productStep('details', 'draft_101')).toBe('/artisan/products/new/details?draftId=draft_101');
      expect(ROUTES.productStep('review', 'draft_101')).toBe('/artisan/products/new/review?draftId=draft_101');
      expect(ROUTES.productStep('price', 'draft_101')).toBe('/artisan/products/new/price?draftId=draft_101');
      expect(ROUTES.productStep('pricing', 'draft_101')).toBe('/artisan/products/new/price?draftId=draft_101');
      expect(ROUTES.productStep('public-fields', 'draft_101')).toBe('/artisan/products/new/public-fields?draftId=draft_101');
      expect(ROUTES.productStep('approve', 'draft_101')).toBe('/artisan/products/new/approve?draftId=draft_101');
      expect(ROUTES.productStep('passport', 'draft_101')).toBe('/artisan/products/new/passport?draftId=draft_101');
      expect(ROUTES.productStep('passport-created', 'draft_101')).toBe('/artisan/products/new/passport?draftId=draft_101');
      expect(ROUTES.productStep('share', 'draft_101')).toBe('/artisan/products/new/share?draftId=draft_101');
    });

    it('works without draftId when starting fresh', () => {
      expect(ROUTES.productStep('photos')).toBe('/artisan/products/new/photos');
      expect(ROUTES.productStep('pricing')).toBe('/artisan/products/new/price');
    });
  });

  describe('3. Validated Passport Return Route Matching', () => {
    it('returns to artisan product creation when user has artisan role', () => {
      const res = getValidatedPassportReturnRoute(
        '/artisan/products/new/passport?draftId=d1',
        { id: 'a1', role: 'artisan' } as any,
        'artisan'
      );
      expect(res.path).toBe('/artisan/products/new/passport?draftId=d1');
      expect(res.isFallback).toBe(false);
    });

    it('prevents unauthenticated user from returning to protected artisan routes, falling back to home', () => {
      const res = getValidatedPassportReturnRoute(
        '/artisan/inventory',
        null,
        undefined
      );
      expect(res.path).toBe(ROUTES.HOME);
      expect(res.isFallback).toBe(true);
    });

    it('prevents non-coordinator from returning to coordinator routes', () => {
      const res = getValidatedPassportReturnRoute(
        '/coordinator/reviews',
        { id: 'a1', role: 'artisan' } as any,
        'artisan'
      );
      expect(res.path).toBe(ROUTES.HOME);
      expect(res.isFallback).toBe(true);
    });

    it('allows coordinator to return to coordinator reviews', () => {
      const res = getValidatedPassportReturnRoute(
        '/coordinator/reviews',
        { id: 'c1', role: 'coordinator' } as any,
        'coordinator'
      );
      expect(res.path).toBe('/coordinator/reviews');
      expect(res.isFallback).toBe(false);
    });

    it('allows anyone to return to marketplace', () => {
      const res = getValidatedPassportReturnRoute(
        '/marketplace',
        null,
        undefined
      );
      expect(res.path).toBe('/marketplace');
      expect(res.isFallback).toBe(false);
    });
  });

  describe('4. AuthGuard Return URL & Protection Invariants', () => {
    const LocationSpy: React.FC = () => {
      const location = useLocation();
      return <div data-testid="location-spy">{location.pathname}{location.search}</div>;
    };

    it('redirects unauthenticated visitor to central sign-in portal with returnUrl when accessing coordinator routes', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/coordinator/reviews']}>
            <AuthProvider>
              <Routes>
                <Route
                  path="/coordinator/reviews"
                  element={
                    <AuthGuard requiredRole="coordinator">
                      <div>Coordinator Secret Reviews</div>
                    </AuthGuard>
                  }
                />
                <Route path="/sign-in" element={<LocationSpy />} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      const spy = container.querySelector('[data-testid="location-spy"]');
      expect(spy).not.toBeNull();
      expect(spy?.textContent).toContain('/sign-in');
      expect(spy?.textContent).toContain('returnUrl=%2Fcoordinator%2Freviews');
    });

    it('redirects unauthenticated visitor to sign-in with returnUrl when accessing artisan routes', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/artisan/inventory']}>
            <AuthProvider>
              <Routes>
                <Route
                  path="/artisan/inventory"
                  element={
                    <AuthGuard requiredRole="artisan">
                      <div>Artisan Inventory</div>
                    </AuthGuard>
                  }
                />
                <Route path="/sign-in" element={<LocationSpy />} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      const spy = container.querySelector('[data-testid="location-spy"]');
      expect(spy).not.toBeNull();
      expect(spy?.textContent).toContain('/sign-in');
      expect(spy?.textContent).toContain('returnUrl=%2Fartisan%2Finventory');
    });
  });

  describe('5. Public Craft Passport Error Recovery', () => {
    it('renders clear recovery actions (Marketplace, Home) when passport is not found', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/passport/non-existent-craft-99999']}>
            <AuthProvider>
              <LanguageProvider>
                <Routes>
                  <Route path="/passport/:publicSlug" element={<PublicCraftPassportPage />} />
                </Routes>
              </LanguageProvider>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      // Wait for loading to finish and not-found card to appear
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(container.textContent).toContain('Craft Passport Not Found');
      const marketplaceLink = container.querySelector(`a[href="${ROUTES.MARKETPLACE}"]`);
      const homeLink = container.querySelector(`a[href="${ROUTES.HOME}"]`);
      expect(marketplaceLink).not.toBeNull();
      expect(homeLink).not.toBeNull();
      expect(marketplaceLink?.textContent).toContain('Explore Marketplace');
      expect(homeLink?.textContent).toContain('Return to Home');
    });
  });
});
