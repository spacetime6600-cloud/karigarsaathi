import { IProductRepository } from '@/repositories/interfaces/IProductRepository';
import { ProductRecord, CreateProductInput, UpdateProductInput } from '@/domain/products';
import { storage } from '@/services/storage/localStorage';
import { DEMO_PRODUCTS } from '@/services/demo/demoDataService';

export class MockProductRepository implements IProductRepository {
  private getAll(ownerId: string): ProductRecord[] {
    const list = storage.get<ProductRecord[]>(`mock_products_${ownerId}`, []);
    if (list.length > 0) return list;
    const demoMatches = DEMO_PRODUCTS.filter((p) => p.ownerId === ownerId);
    if (demoMatches.length > 0) return demoMatches;
    if (ownerId === 'artisan_default' || ownerId === 'artisan_001') {
      return DEMO_PRODUCTS.filter((p) => p.ownerId === 'demo_artisan_ravi');
    }
    return [];
  }

  private saveAll(ownerId: string, list: ProductRecord[]): void {
    storage.set(`mock_products_${ownerId}`, list);
  }

  async createProduct(ownerId: string, input: CreateProductInput): Promise<ProductRecord> {
    const id = input.id || `mock_prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const record: ProductRecord = {
      ...input,
      id,
      ownerId,
      artisanId: input.artisanId || ownerId,
      createdAt: now,
      updatedAt: now,
    };
    const list = this.getAll(ownerId);
    list.unshift(record);
    this.saveAll(ownerId, list);
    return record;
  }

  async getOwnedProductById(ownerId: string, productId: string): Promise<ProductRecord | null> {
    const list = this.getAll(ownerId);
    return list.find((p) => p.id === productId && p.ownerId === ownerId) || null;
  }

  async listCurrentArtisanProducts(ownerId: string): Promise<ProductRecord[]> {
    const list = this.getAll(ownerId);
    return list.filter((p) => p.status !== 'archived');
  }

  async listArchivedProducts(ownerId: string): Promise<ProductRecord[]> {
    const list = this.getAll(ownerId);
    return list.filter((p) => p.status === 'archived');
  }

  async listAllArtisanProducts(ownerId: string): Promise<ProductRecord[]> {
    return this.getAll(ownerId);
  }

  async updateProduct(ownerId: string, productId: string, input: UpdateProductInput): Promise<ProductRecord> {
    const list = this.getAll(ownerId);
    const index = list.findIndex((p) => p.id === productId && p.ownerId === ownerId);
    if (index < 0) {
      throw new Error('Product not found');
    }
    const updated: ProductRecord = {
      ...list[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveAll(ownerId, list);
    return updated;
  }

  async duplicateProduct(ownerId: string, productId: string): Promise<ProductRecord> {
    const original = await this.getOwnedProductById(ownerId, productId);
    if (!original) {
      throw new Error('Cannot duplicate: Product not found');
    }
    const newId = `mock_prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const duplicated: ProductRecord = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      status: 'draft',
      duplicatedFrom: productId,
      passportId: undefined,
      completionState: undefined,
      createdAt: now,
      updatedAt: now,
    };
    const list = this.getAll(ownerId);
    list.unshift(duplicated);
    this.saveAll(ownerId, list);
    return duplicated;
  }

  async archiveProduct(ownerId: string, productId: string): Promise<ProductRecord> {
    return this.updateProduct(ownerId, productId, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });
  }

  async restoreProduct(ownerId: string, productId: string): Promise<ProductRecord> {
    return this.updateProduct(ownerId, productId, {
      status: 'draft',
      archivedAt: undefined,
    });
  }

  async deleteProduct(ownerId: string, productId: string): Promise<void> {
    let list = this.getAll(ownerId);
    list = list.filter((p) => p.id !== productId);
    this.saveAll(ownerId, list);
  }
}
