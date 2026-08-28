import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { InventoryManagementPage } from '@/features/inventory/InventoryManagementPage';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { ProductDraftProvider } from '@/app/providers/ProductDraftProvider';
import { storage } from '@/services/storage/localStorage';
import { productRepository } from '@/repositories';

describe('Craft Inventory & Catalogue Management Page', () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockProducts = [
    {
      id: 'prod_1',
      ownerId: 'artisan_default',
      title: 'Silk Jamdani Saree',
      description: 'Handwoven pure silk.',
      category: 'Handloom Textiles',
      craftType: 'Jamdani',
      state: 'Assam',
      price: 14500,
      currency: 'INR',
      stockQuantity: 3,
      status: 'draft' as const,
      photoPaths: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c'],
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    },
    {
      id: 'prod_2',
      ownerId: 'artisan_default',
      title: 'Terracotta Hand-Painted Vase',
      description: 'Clay pottery.',
      category: 'Pottery',
      craftType: 'Terracotta',
      state: 'West Bengal',
      price: 3200,
      currency: 'INR',
      stockQuantity: 5,
      status: 'ready' as const,
      photoPaths: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1'],
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    },
    {
      id: 'prod_3',
      ownerId: 'artisan_default',
      title: 'Old Archived Shawl',
      description: 'Archived.',
      category: 'Textiles',
      craftType: 'Weaving',
      state: 'Assam',
      price: 2000,
      currency: 'INR',
      stockQuantity: 0,
      status: 'archived' as const,
      photoPaths: [],
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
      archivedAt: '2026-08-27T11:00:00.000Z',
    },
  ];

  beforeEach(() => {
    storage.clearAll();
    storage.set('selectedLanguage', 'en');

    vi.spyOn(productRepository, 'listAllArtisanProducts').mockResolvedValue(mockProducts);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const renderInventoryPage = async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/artisan/inventory']}>
          <AuthProvider>
            <LanguageProvider>
              <ProductDraftProvider>
                <InventoryManagementPage />
              </ProductDraftProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });
  };

  it('renders catalogue title, filter tabs, and active products', async () => {
    await renderInventoryPage();

    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toContain('Craft Catalogue & Inventory');

    // Filter tabs
    expect(container.textContent).toContain('All Active');
    expect(container.textContent).toContain('Drafts');
    expect(container.textContent).toContain('Ready');
    expect(container.textContent).toContain('Archived');

    // Product cards (Active tab excludes archived)
    expect(container.textContent).toContain('Silk Jamdani Saree');
    expect(container.textContent).toContain('Terracotta Hand-Painted Vase');
    expect(container.textContent).not.toContain('Old Archived Shawl');
  });

  it('filters by status when switching to Archived tab', async () => {
    await renderInventoryPage();

    const archivedTabButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Archived')
    );
    expect(archivedTabButton).toBeDefined();

    await act(async () => {
      archivedTabButton?.click();
    });

    expect(container.textContent).toContain('Old Archived Shawl');
    expect(container.textContent).not.toContain('Silk Jamdani Saree');
  });

  it('filters products using the search input', async () => {
    await renderInventoryPage();

    const input = container.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    expect(input).toBeDefined();

    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(input, 'Terracotta');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(container.textContent).toContain('Terracotta Hand-Painted Vase');
    expect(container.textContent).not.toContain('Silk Jamdani Saree');
  });

  it('allows permanently deleting a product with confirmation modal', async () => {
    await renderInventoryPage();

    // Click delete on Silk Jamdani Saree
    const deleteButton = container.querySelector('button[aria-label="Delete Silk Jamdani Saree permanently"]') as HTMLButtonElement;
    expect(deleteButton).toBeDefined();

    await act(async () => {
      deleteButton.click();
    });

    // Confirmation modal should open
    expect(container.textContent).toContain('Delete Product Permanently');
    expect(container.textContent).toContain('Are you sure you want to permanently delete "Silk Jamdani Saree"?');

    // Confirm permanent deletion
    const confirmButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Delete Permanently')
    );
    expect(confirmButton).toBeDefined();

    await act(async () => {
      confirmButton?.click();
    });

    // Product card should be removed from catalogue
    const productTitles = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
    expect(productTitles).not.toContain('Silk Jamdani Saree');
    expect(productTitles).toContain('Terracotta Hand-Painted Vase');
    expect(container.textContent).toContain('Deleted "Silk Jamdani Saree" permanently.');
  });
});
