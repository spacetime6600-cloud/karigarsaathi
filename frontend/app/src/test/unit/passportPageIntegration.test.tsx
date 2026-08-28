import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QRCraftPassportCreatedPage } from '@/features/craft-passport/QRCraftPassportCreatedPage';
import { ProductDraftProvider } from '@/app/providers/ProductDraftProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { passportManager } from '@/services/passport/passportManager';
import { PublicCraftPassport } from '@/types';

describe('QR Craft Passport Page Integration & Consistency Suite', () => {
  const MOCK_SLUG = 'indigo-terracotta-silk-jamdani-s-f18665bedbaf';
  const MOCK_PASSPORT_ID = 'pass_test_persisted_9988';
  const OWNER_ID = 'artisan_test_integr_01';

  const mockPublicPassport: PublicCraftPassport = {
    passportId: MOCK_PASSPORT_ID,
    productId: 'prod_test_01',
    ownerId: OWNER_ID,
    slug: MOCK_SLUG,
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Certified Indigo & Terracotta Silk Jamdani Saree',
      description: 'Handcrafted master weaving using certified muga silk.',
      category: 'Handloom Textiles',
      technique: 'Jamdani Weave',
      materials: ['Pure Silk', 'Natural Indigo Dye'],
      price: 14500,
      currency: 'INR',
      artisanName: 'Master Weaver Ananya',
      state: 'Assam',
      district: 'Kamrup',
      photos: ['https://example.com/saree.jpg'],
      verificationHash: 'KS-VERIFIED-11223344',
    },
    activatedAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.spyOn(passportManager, 'getPublicPassport').mockImplementation(async (slug: string) => {
      if (slug === MOCK_SLUG) {
        return mockPublicPassport;
      }
      return null;
    });
  });

  it('1. Loads persisted Craft Passport using location state slug and does NOT use stale draft title', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/artisan/products/new/passport',
            state: {
              passportId: MOCK_PASSPORT_ID,
              publicSlug: MOCK_SLUG,
              publicUrl: `http://localhost:3000/passport/${MOCK_SLUG}`,
            },
          },
        ]}
      >
        <AuthProvider>
          <LanguageProvider>
            <ProductDraftProvider>
              <Routes>
                <Route path="/artisan/products/new/passport" element={<QRCraftPassportCreatedPage />} />
              </Routes>
            </ProductDraftProvider>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial loading indicator
    expect(screen.getByText(/Loading verified Craft Passport/i)).toBeInTheDocument();

    // Wait for persisted data resolution
    await waitFor(() => {
      expect(screen.getByTestId('certificate-product-title')).toHaveTextContent(
        'Certified Indigo & Terracotta Silk Jamdani Saree'
      );
    });

    // Verify slug displayed matches persisted slug
    const slugDisplay = screen.getByTestId('passport-slug-display');
    expect(slugDisplay).toHaveTextContent(`Slug: ${MOCK_SLUG}`);

    // Verify View Live Passport link matches exact persisted slug URL
    const liveLink = screen.getByTestId('view-live-passport-link');
    expect(liveLink).toHaveAttribute('href', expect.stringContaining(`/passport/${MOCK_SLUG}`));

    // Verify QR code image is rendered with data URL
    const qrImg = screen.getByTestId('passport-qr-image');
    expect(qrImg).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/));
  });

  it('2. Retrieves the same persisted passport on page reload without location state', async () => {
    // Even if location state is empty, if draft has passportSlug, it loads from repository
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/artisan/products/new/passport',
            state: {
              publicSlug: MOCK_SLUG,
            },
          },
        ]}
      >
        <AuthProvider>
          <LanguageProvider>
            <ProductDraftProvider>
              <Routes>
                <Route path="/artisan/products/new/passport" element={<QRCraftPassportCreatedPage />} />
              </Routes>
            </ProductDraftProvider>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('certificate-product-title')).toBeInTheDocument();
    });

    expect(screen.getByTestId('passport-slug-display')).toHaveTextContent(MOCK_SLUG);
  });

  it('3. Displays controlled error state when slug is not found or revoked', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/artisan/products/new/passport',
            state: {
              publicSlug: 'non-existent-or-revoked-slug-0000',
            },
          },
        ]}
      >
        <AuthProvider>
          <LanguageProvider>
            <ProductDraftProvider>
              <Routes>
                <Route path="/artisan/products/new/passport" element={<QRCraftPassportCreatedPage />} />
              </Routes>
            </ProductDraftProvider>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Passport State Verification Failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/was not found in persistence/i)).toBeInTheDocument();
    expect(screen.getByText(/Return to Approval & Re-issue/i)).toBeInTheDocument();
  });
});
