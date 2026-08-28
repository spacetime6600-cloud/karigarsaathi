import { describe, it, expect, beforeEach } from 'vitest';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';

describe('Product Repository Operations: Duplicate, Archive, Restore', () => {
  let repo: MockProductRepository;
  const OWNER_ID = 'artisan_owner_1';

  beforeEach(() => {
    localStorage.clear();
    repo = new MockProductRepository();
  });

  it('creates, lists, duplicates, archives, and restores a product', async () => {
    // 1. Create original product
    const created = await repo.createProduct(OWNER_ID, {
      title: 'Kalamkari Hand-Painted Saree',
      description: 'Natural dye hand painting.',
      category: 'Textiles',
      craftType: 'Kalamkari',
      state: 'Andhra Pradesh',
      price: 9000,
      currency: 'INR',
      stockQuantity: 2,
      status: 'draft',
      photoPaths: ['photo1.jpg'],
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Kalamkari Hand-Painted Saree');

    // 2. Duplicate product
    const duplicated = await repo.duplicateProduct(OWNER_ID, created.id);
    expect(duplicated.id).not.toBe(created.id);
    expect(duplicated.title).toBe('Kalamkari Hand-Painted Saree (Copy)');
    expect(duplicated.status).toBe('draft');
    expect(duplicated.duplicatedFrom).toBe(created.id);

    // List active products (should be 2)
    const activeList = await repo.listCurrentArtisanProducts(OWNER_ID);
    expect(activeList).toHaveLength(2);

    // 3. Archive original product
    const archived = await repo.archiveProduct(OWNER_ID, created.id);
    expect(archived.status).toBe('archived');
    expect(archived.archivedAt).toBeDefined();

    // Active list should now be 1
    const activeAfterArchive = await repo.listCurrentArtisanProducts(OWNER_ID);
    expect(activeAfterArchive).toHaveLength(1);
    expect(activeAfterArchive[0].id).toBe(duplicated.id);

    // Archived list should be 1
    const archivedList = await repo.listArchivedProducts(OWNER_ID);
    expect(archivedList).toHaveLength(1);
    expect(archivedList[0].id).toBe(created.id);

    // 4. Restore original product
    const restored = await repo.restoreProduct(OWNER_ID, created.id);
    expect(restored.status).toBe('draft');
    expect(restored.archivedAt).toBeUndefined();

    // Active list should now be 2 again
    const activeAfterRestore = await repo.listCurrentArtisanProducts(OWNER_ID);
    expect(activeAfterRestore).toHaveLength(2);
  });
});
