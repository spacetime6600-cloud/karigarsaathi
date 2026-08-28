import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductCreationShell } from '@/layouts/ProductCreationShell';
import { AddPhotographsPage } from '@/features/photographs/AddPhotographsPage';
import { AddProductDetailsPage } from '@/features/voice-details/AddProductDetailsPage';
import { ReviewFactsPage } from '@/features/facts-review/ReviewFactsPage';
import { ChoosePricePage } from '@/features/pricing/ChoosePricePage';
import { ChoosePublicFieldsPage } from '@/features/craft-passport/ChoosePublicFieldsPage';
import { ApprovePublicInfoPage } from '@/features/craft-passport/ApprovePublicInfoPage';
import { QRCraftPassportCreatedPage } from '@/features/craft-passport/QRCraftPassportCreatedPage';
import { ShareOrExportPage } from '@/features/sharing-export/ShareOrExportPage';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AudioHelpProvider } from '@/app/providers/AudioHelpProvider';
import { SyncProvider } from '@/app/providers/SyncProvider';
import { ProductDraftProvider } from '@/app/providers/ProductDraftProvider';
import { productRepository } from '@/services/api/productRepository';
import { passportManager } from '@/services/passport/passportManager';
import { storage } from '@/services/storage/localStorage';

describe('Product Draft Repository & 8-Step Creation Workflow', () => {
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

  const renderCreationWorkflow = async (
    initialRoute: string | { pathname: string; state?: Record<string, unknown> } = '/artisan/products/new/photos'
  ) => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <SyncProvider>
                  <ProductDraftProvider>
                    <Routes>
                      <Route element={<ProductCreationShell />}>
                        <Route path="/artisan/products/new/photos" element={<AddPhotographsPage />} />
                        <Route path="/artisan/products/new/details" element={<AddProductDetailsPage />} />
                        <Route path="/artisan/products/new/review" element={<ReviewFactsPage />} />
                        <Route path="/artisan/products/new/price" element={<ChoosePricePage />} />
                        <Route path="/artisan/products/new/public-fields" element={<ChoosePublicFieldsPage />} />
                        <Route path="/artisan/products/new/approve" element={<ApprovePublicInfoPage />} />
                        <Route path="/artisan/products/new/passport" element={<QRCraftPassportCreatedPage />} />
                        <Route path="/artisan/products/new/share" element={<ShareOrExportPage />} />
                      </Route>
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

  it('retrieves persistent product draft with default craft specifications', () => {
    const draft = productRepository.getDraft();
    expect(draft.title).toBeDefined();
    expect(draft.category).toBe('Handloom Textiles');
    expect(draft.photos.length).toBeGreaterThanOrEqual(1);
  });

  it('saves updates to draft safely without mutating other fields', () => {
    const updated = productRepository.saveDraft({ title: 'Heritage Sambalpuri Silk Ikat' });
    expect(updated.title).toBe('Heritage Sambalpuri Silk Ikat');
    expect(productRepository.getDraft().title).toBe('Heritage Sambalpuri Silk Ikat');
  });

  it('extracts confirmed facts and needs-review facts from vernacular audio input', () => {
    const { confirmed, needsReview } = productRepository.extractFactsFromInput(
      'यह साड़ी शुद्ध शहतूत रेशम से बुनी गई है'
    );
    expect(confirmed.length).toBeGreaterThanOrEqual(2);
    expect(needsReview.length).toBeGreaterThanOrEqual(1);
    expect(confirmed[0].isConfirmed).toBe(true);
    expect(needsReview[0].isConfirmed).toBe(false);
  });

  it('renders Step 1 (Photos) with 8-step progress stepper and Save Draft control', async () => {
    await renderCreationWorkflow('/artisan/products/new/photos');

    // Header & Stepper
    expect(container.textContent).toContain('KarigarSaathi');
    expect(container.textContent).toContain('Add New Product');
    expect(container.textContent).toContain('Photographs');
    expect(container.textContent).toContain('Save Draft');

    // Step 1 content
    expect(container.textContent).toContain('Upload From Device');
    expect(container.textContent).toContain('Capture with Camera');
    expect(container.textContent).toContain('Photography Guidelines');
  });

  it('renders Step 2 (Product Details) with General Information minimal card', async () => {
    await renderCreationWorkflow('/artisan/products/new/details');

    expect(container.textContent).toContain('Title & Heritage Narrative');
    expect(container.textContent).toContain('Product Title');
    expect(container.textContent).toContain('Craft Technique');
    expect(container.textContent).toContain('Voice Assistant');
  });

  it('renders Step 4 (Pricing) with Cost of Creation and Fair-Trade Tiers', async () => {
    await renderCreationWorkflow('/artisan/products/new/price');

    expect(container.textContent).toContain('Cost of Creation');
    expect(container.textContent).toContain('Fair-Trade Pricing Tiers');
    expect(container.textContent).toContain('Final Retail Listing Price');
  });

  it('renders Step 7 (Craft Passport Created) with Provenance Verified badge and QR code', async () => {
    vi.spyOn(passportManager, 'getPublicPassport').mockResolvedValueOnce({
      passportId: 'pass_mock_123',
      productId: 'prod_mock_123',
      ownerId: 'artisan_001',
      slug: 'indigo-terracotta-silk-jamdani-s-f18665bedbaf',
      status: 'active',
      snapshotVersion: 1,
      publicData: {
        title: 'Indigo & Terracotta Silk Jamdani Saree',
        description: 'Traditional Jamdani weave.',
        category: 'Handloom Textiles',
        technique: 'Jamdani',
        materials: ['Mulberry Silk'],
        price: 14500,
        currency: 'INR',
        artisanName: 'Master Artisan',
        photos: ['https://example.com/saree.jpg'],
        verificationHash: 'KS-VERIFIED-123',
      },
      activatedAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    });

    await renderCreationWorkflow({
      pathname: '/artisan/products/new/passport',
      state: { publicSlug: 'indigo-terracotta-silk-jamdani-s-f18665bedbaf' },
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });

    expect(container.textContent).toContain('Provenance Verified');
    expect(container.textContent).toContain('QR Craft Passport Created');
    expect(container.textContent).toContain('Copy Link');
  });
});
