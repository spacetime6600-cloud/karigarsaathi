import { ProductRecord, CreateProductInput, UpdateProductInput } from '@/domain/products';

export interface IProductRepository {
  createProduct(ownerId: string, input: CreateProductInput): Promise<ProductRecord>;
  getOwnedProductById(ownerId: string, productId: string): Promise<ProductRecord | null>;
  listCurrentArtisanProducts(ownerId: string): Promise<ProductRecord[]>;
  listArchivedProducts(ownerId: string): Promise<ProductRecord[]>;
  listAllArtisanProducts(ownerId: string): Promise<ProductRecord[]>;
  updateProduct(ownerId: string, productId: string, input: UpdateProductInput): Promise<ProductRecord>;
  duplicateProduct(ownerId: string, productId: string): Promise<ProductRecord>;
  archiveProduct(ownerId: string, productId: string): Promise<ProductRecord>;
  restoreProduct(ownerId: string, productId: string): Promise<ProductRecord>;
  deleteProduct(ownerId: string, productId: string): Promise<void>;
}
