import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PublicPassportShell } from '@/layouts/PublicPassportShell';
import { getValidatedPassportReturnRoute } from '@/routes/passportNavigation';
import { ROUTES } from '@/routes/paths';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AudioHelpProvider } from '@/app/providers/AudioHelpProvider';
import { UserAccount } from '@/domain/auth';

describe('Craft Passport Context-Aware Navigation & Security Suite', () => {
  const mockArtisanUser: UserAccount = {
    uid: 'artisan_ravi_123',
    email: 'ravi@example.com',
    role: 'artisan',
    displayName: 'Ravi Weaver',
    preferredLanguage: 'hi',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  const mockCoordinatorUser: UserAccount = {
    uid: 'coord_priya_456',
    email: 'priya@example.com',
    role: 'coordinator',
    displayName: 'Priya Sharma',
    preferredLanguage: 'en',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  describe('1. Pure Function: getValidatedPassportReturnRoute', () => {
    it('returns Home fallback for missing, empty, or undefined return state (QR scan / direct URL)', () => {
      const res1 = getValidatedPassportReturnRoute(undefined, null);
      expect(res1).toEqual({ path: ROUTES.HOME, label: 'Return to Home', isFallback: true });

      const res2 = getValidatedPassportReturnRoute('', null);
      expect(res2).toEqual({ path: ROUTES.HOME, label: 'Return to Home', isFallback: true });

      const res3 = getValidatedPassportReturnRoute(null, null);
      expect(res3).toEqual({ path: ROUTES.HOME, label: 'Return to Home', isFallback: true });
    });

    it('rejects open redirects and external URLs, falling back to Home', () => {
      const res1 = getValidatedPassportReturnRoute('https://evil.com/steal', mockArtisanUser);
      expect(res1.path).toBe(ROUTES.HOME);
      expect(res1.isFallback).toBe(true);

      const res2 = getValidatedPassportReturnRoute('//malicious.com', mockArtisanUser);
      expect(res2.path).toBe(ROUTES.HOME);

      const res3 = getValidatedPassportReturnRoute('javascript:alert(1)', mockArtisanUser);
      expect(res3.path).toBe(ROUTES.HOME);
    });

    it('validates public Marketplace product return paths', () => {
      const res = getValidatedPassportReturnRoute('/marketplace/products/saree_101', null, undefined, 'Assam Saree');
      expect(res).toEqual({
        path: '/marketplace/products/saree_101',
        label: 'Return to Assam Saree',
        isFallback: false,
      });
    });

    it('validates protected Artisan routes when user is authenticated as artisan', () => {
      // Product creation step
      const resCreation = getValidatedPassportReturnRoute('/artisan/products/new/passport', mockArtisanUser, 'artisan');
      expect(resCreation).toEqual({
        path: '/artisan/products/new/passport',
        label: 'Return to Product Creation',
        isFallback: false,
      });

      // Inventory with query params
      const resInventory = getValidatedPassportReturnRoute('/artisan/inventory?tab=published&search=silk', mockArtisanUser, 'artisan');
      expect(resInventory).toEqual({
        path: '/artisan/inventory?tab=published&search=silk',
        label: 'Return to Inventory',
        isFallback: false,
      });

      // Artisan dashboard
      const resDash = getValidatedPassportReturnRoute('/artisan/dashboard', mockArtisanUser, 'artisan');
      expect(resDash).toEqual({
        path: '/artisan/dashboard',
        label: 'Return to Artisan Dashboard',
        isFallback: false,
      });
    });

    it('blocks protected Artisan routes when user is signed out or has wrong role', () => {
      // Signed out user
      const resSignedOut = getValidatedPassportReturnRoute('/artisan/inventory', null);
      expect(resSignedOut).toEqual({
        path: ROUTES.HOME,
        label: 'Return to Home',
        isFallback: true,
      });

      // Coordinator trying to access artisan return path
      const resWrongRole = getValidatedPassportReturnRoute('/artisan/dashboard', mockCoordinatorUser, 'coordinator');
      expect(resWrongRole).toEqual({
        path: ROUTES.HOME,
        label: 'Return to Home',
        isFallback: true,
      });
    });

    it('validates protected Coordinator routes when user is authenticated as coordinator', () => {
      const res = getValidatedPassportReturnRoute('/coordinator/reviews?tab=needs_review', mockCoordinatorUser, 'coordinator');
      expect(res).toEqual({
        path: '/coordinator/reviews?tab=needs_review',
        label: 'Return to Reviews Queue',
        isFallback: false,
      });
    });

    it('blocks protected Coordinator routes when user is not a coordinator', () => {
      const res = getValidatedPassportReturnRoute('/coordinator/reviews', mockArtisanUser, 'artisan');
      expect(res).toEqual({
        path: ROUTES.HOME,
        label: 'Return to Home',
        isFallback: true,
      });
    });
  });

  describe('2. PublicPassportShell Back Control Component Integration', () => {
    it('renders "Return to Home" button when opened without origin state (direct QR scan)', () => {
      render(
        <MemoryRouter initialEntries={['/passport/sample-slug']}>
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <Routes>
                  <Route element={<PublicPassportShell />}>
                    <Route path="/passport/:publicSlug" element={<div>Passport Content</div>} />
                  </Route>
                </Routes>
              </AudioHelpProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      const backButton = screen.getByRole('button', { name: /Return to Home/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('title', 'Return to Home');
    });

    it('renders context-aware button and navigates to originating marketplace page on click', () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/passport/sample-slug',
              state: {
                from: '/marketplace/products/saree_77',
                fromLabel: 'Chanderi Saree',
                sourceRole: 'public',
              },
            },
          ]}
        >
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <Routes>
                  <Route element={<PublicPassportShell />}>
                    <Route path="/passport/:publicSlug" element={<div>Passport Content</div>} />
                  </Route>
                  <Route path="/marketplace/products/saree_77" element={<div>Back to Marketplace Product!</div>} />
                </Routes>
              </AudioHelpProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      const backButton = screen.getByRole('button', { name: /Return to Chanderi Saree/i });
      expect(backButton).toBeInTheDocument();

      fireEvent.click(backButton);
      expect(screen.getByText('Back to Marketplace Product!')).toBeInTheDocument();
    });
  });
});
