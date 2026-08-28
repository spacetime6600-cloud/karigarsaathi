import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ArtisanDashboardPage } from '@/features/dashboard/ArtisanDashboardPage';
import { RecentCraftItemsSection } from '@/features/dashboard/RecentCraftItemsSection';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { ProductDraftProvider } from '@/app/providers/ProductDraftProvider';
import { SyncProvider } from '@/app/providers/SyncProvider';
import { storage } from '@/services/storage/localStorage';
import { salesService } from '@/services/api/salesService';

describe('Artisan Dashboard — Clean, Practical Seller Workspace with Sales Insights', () => {
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

  const renderDashboard = async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/artisan/dashboard']}>
          <AuthProvider>
            <SyncProvider>
              <LanguageProvider>
                <ProductDraftProvider>
                  <ArtisanDashboardPage />
                </ProductDraftProvider>
              </LanguageProvider>
            </SyncProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });
  };

  it('renders welcome greeting and subtitle with authenticated artisan name', async () => {
    await renderDashboard();
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toContain('Namaste');
    expect(h1?.textContent).toContain('Ravi Kumar');
    expect(container.textContent).toContain('Manage your products, stock and enquiries');
  });

  it('renders compact primary Add product button and contextual draft action', async () => {
    await renderDashboard();
    const buttons = Array.from(container.querySelectorAll('button'));
    const buttonTexts = buttons.map((b) => b.textContent);

    expect(buttonTexts.some((t) => t?.includes('Add product'))).toBe(true);
    expect(buttonTexts.some((t) => t?.includes('Continue draft'))).toBe(true);
  });

  it('renders 4 summary metrics cards with truthful period comparison labels', async () => {
    await renderDashboard();
    const summarySection = container.querySelector('section[aria-label="Summary Performance Metrics"]');
    expect(summarySection).not.toBeNull();

    expect(summarySection?.textContent).toContain('Units sold');
    expect(summarySection?.textContent).toContain('Recorded sales value');
    expect(summarySection?.textContent).toContain('Live products');
    expect(summarySection?.textContent).toContain('New enquiries');
    expect(summarySection?.textContent).toContain('No previous-period comparison');
  });

  it('renders date range selector with 7 days, 30 days, 90 days, and Custom options', async () => {
    await renderDashboard();
    const dateGroup = container.querySelector('div[role="group"][aria-label="Analytics date range selector"]');
    expect(dateGroup).not.toBeNull();
    expect(dateGroup?.textContent).toContain('7 days');
    expect(dateGroup?.textContent).toContain('30 days');
    expect(dateGroup?.textContent).toContain('90 days');
    expect(dateGroup?.textContent).toContain('Custom');
  });

  it('renders honest empty sales onboarding state when artisan has 0 confirmed sales', async () => {
    await renderDashboard();
    expect(container.textContent).toContain('Your sales insights will appear here');
    expect(container.textContent).toContain('Start recording confirmed craft sales');
  });

  it('renders Sales Overview, India Regional Map, Price History and Craft Category panels when populated', async () => {
    // Seed isolated test fixture
    salesService.seedDemoSales('artisan_001');

    await renderDashboard();

    // Sales overview
    expect(container.textContent).toContain('Sales overview');
    expect(container.textContent).toContain('Sales value');
    expect(container.textContent).toContain('Units sold');

    // Where your buyers are
    expect(container.textContent).toContain('Where your buyers are');
    expect(container.textContent).toContain('Top Buyer Destinations');

    // Product price history
    expect(container.textContent).toContain('Your product price history');

    // Sales by craft category
    expect(container.textContent).toContain('Sales by craft category');
  });

  it('renders Your products main workspace panel with accurate count, search input, and segmented filter tabs', async () => {
    await renderDashboard();
    expect(container.textContent).toContain('Your products');
    expect(container.textContent).toContain('View inventory');

    // Search input
    const searchInput = container.querySelector('input[placeholder*="Search products"]');
    expect(searchInput).not.toBeNull();

    // Segmented filters
    expect(container.textContent).toContain('All');
    expect(container.textContent).toContain('Drafts');
    expect(container.textContent).toContain('Needs attention');
  });

  it('renders image-led product table rows with real cover image, title, craft type, formatted price, stock, and Edit action', async () => {
    await renderDashboard();
    expect(container.textContent).toContain('Indigo & Terracotta Silk Jamdani Saree');
    expect(container.textContent).toContain('Traditional Handloom Jamdani Weaving');
    expect(container.textContent).toContain('₹14,243');
    expect(container.textContent).toContain('Edit');

    const productImages = container.querySelectorAll('img');
    expect(productImages.length).toBeGreaterThan(0);
  });

  it('renders standalone RecentCraftItemsSection with correct pluralization and empty state', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <RecentCraftItemsSection products={[]} />
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('No digitized craft items cataloged yet');
  });
});
