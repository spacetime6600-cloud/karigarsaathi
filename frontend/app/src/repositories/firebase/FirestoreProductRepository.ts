import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  limit,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { IProductRepository } from '@/repositories/interfaces/IProductRepository';
import { ProductRecord, CreateProductInput, UpdateProductInput } from '@/domain/products';
import { logger } from '@/services/logging/logger';
import { removeUndefinedDeep, findUndefinedPaths } from '@/utils/firestore';

export class FirestoreProductRepository implements IProductRepository {
  async createProduct(ownerId: string, input: CreateProductInput): Promise<ProductRecord> {
    try {
      const productId = input.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      // Diagnostic check for development
      const undefinedPaths = findUndefinedPaths(input);
      if (undefinedPaths.length > 0 && process.env.NODE_ENV !== 'production') {
        logger.warn('FIRESTORE', `[DIAGNOSTIC] Undefined paths detected before sanitisation in createProduct: ${undefinedPaths.join(', ')}`);
      }

      const record: ProductRecord = {
        ...input,
        id: productId,
        ownerId,
        artisanId: input.artisanId || ownerId,
        title: input.title || 'Untitled Craft',
        description: input.description || input.title || 'Handmade artisanal craft',
        category: input.category || 'Handloom Textiles',
        craftType: input.craftType || 'Traditional Craft',
        state: input.state || 'India',
        price: Number(input.price) >= 0 ? Number(input.price) : 0,
        currency: input.currency || 'INR',
        stockQuantity: Number(input.stockQuantity) >= 0 ? Number(input.stockQuantity) : 1,
        status: input.status || 'draft',
        photoPaths: input.photoPaths || [],
        createdAt: (input as { createdAt?: string }).createdAt || now,
        updatedAt: now,
      };

      const safeRecord = removeUndefinedDeep(record);
      const docRef = doc(db, 'products', productId);
      await setDoc(docRef, safeRecord);
      logger.info('FIRESTORE', 'Created product draft/record in Firestore', { productId, ownerId, title: record.title });
      return safeRecord;
    } catch (err) {
      logger.error('FIRESTORE', 'Failed to create product in Firestore', err, { ownerId });
      throw this.normalizeError(err);
    }
  }

  async getOwnedProductById(ownerId: string, productId: string): Promise<ProductRecord | null> {
    try {
      const docRef = doc(db, 'products', productId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        return null;
      }

      const data = snap.data() as ProductRecord;
      if (data.ownerId !== ownerId) {
        throw new Error('Access denied: You do not own this product.');
      }

      return data;
    } catch (err) {
      logger.error('FIRESTORE', 'Failed to get product by id from Firestore', err, { productId, ownerId });
      throw this.normalizeError(err);
    }
  }

  async listCurrentArtisanProducts(ownerId: string): Promise<ProductRecord[]> {
    try {
      // Must use owner-scoped query matching Firestore security rules
      const q = query(
        collection(db, 'products'),
        where('ownerId', '==', ownerId),
        limit(100)
      );

      const querySnap = await getDocs(q);
      const records: ProductRecord[] = [];
      querySnap.forEach((docSnap) => {
        const item = docSnap.data() as ProductRecord;
        if (item.status !== 'archived') {
          records.push(item);
        }
      });

      logger.info('FIRESTORE', 'Listed active artisan products from Firestore', { ownerId, count: records.length });
      return records;
    } catch (err) {
      logger.warn('FIRESTORE', 'Failed to list artisan products from Firestore', {
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw this.normalizeError(err);
    }
  }

  async listArchivedProducts(ownerId: string): Promise<ProductRecord[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('ownerId', '==', ownerId),
        limit(100)
      );

      const querySnap = await getDocs(q);
      const records: ProductRecord[] = [];
      querySnap.forEach((docSnap) => {
        const item = docSnap.data() as ProductRecord;
        if (item.status === 'archived') {
          records.push(item);
        }
      });

      logger.info('FIRESTORE', 'Listed archived products from Firestore', { ownerId, count: records.length });
      return records;
    } catch (err) {
      logger.warn('FIRESTORE', 'Failed to list archived products', {
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw this.normalizeError(err);
    }
  }

  async listAllArtisanProducts(ownerId: string): Promise<ProductRecord[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('ownerId', '==', ownerId),
        limit(100)
      );

      const querySnap = await getDocs(q);
      const records: ProductRecord[] = [];
      querySnap.forEach((docSnap) => {
        records.push(docSnap.data() as ProductRecord);
      });

      return records;
    } catch (err) {
      logger.warn('FIRESTORE', 'Failed to list all artisan products', {
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw this.normalizeError(err);
    }
  }

  async updateProduct(ownerId: string, productId: string, input: UpdateProductInput): Promise<ProductRecord> {
    try {
      const docRef = doc(db, 'products', productId);
      const now = new Date().toISOString();

      // Diagnostic check for development
      const undefinedPaths = findUndefinedPaths(input);
      if (undefinedPaths.length > 0 && process.env.NODE_ENV !== 'production') {
        logger.warn('FIRESTORE', `[DIAGNOSTIC] Undefined paths detected before sanitisation in updateProduct: ${undefinedPaths.join(', ')}`);
      }

      const updateData: Record<string, unknown> = {
        ...input,
        updatedAt: now,
      };

      // Ensure id, ownerId, and createdAt are immutable
      delete updateData.id;
      delete updateData.ownerId;
      delete updateData.createdAt;

      const safeUpdate = removeUndefinedDeep(updateData);
      await updateDoc(docRef, safeUpdate);

      const updatedSnap = await getDoc(docRef);
      logger.info('FIRESTORE', 'Updated product in Firestore', { productId, ownerId, title: (safeUpdate as Record<string, unknown>).title });
      return updatedSnap.data() as ProductRecord;
    } catch (err) {
      logger.error('FIRESTORE', 'Failed to update product in Firestore', err, { productId, ownerId });
      throw this.normalizeError(err);
    }
  }

  async duplicateProduct(ownerId: string, sourceProductId: string): Promise<ProductRecord> {
    try {
      const original = await this.getOwnedProductById(ownerId, sourceProductId);
      if (!original) {
        throw new Error(`Cannot duplicate: source product ${sourceProductId} not found.`);
      }

      const newId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const duplicateInput: CreateProductInput = {
        ...original,
        id: newId,
        title: original.title ? `${original.title} (Copy)` : 'Untitled Craft (Copy)',
        status: 'draft',
        duplicatedFrom: sourceProductId,
        passportId: undefined,
        completionState: undefined,
      };

      const created = await this.createProduct(ownerId, duplicateInput);
      logger.info('FIRESTORE', 'Duplicated product draft in Firestore', {
        sourceId: sourceProductId,
        newId: created.id,
        ownerId,
      });

      return created;
    } catch (err) {
      logger.error('FIRESTORE', 'Failed to duplicate product', err, { sourceProductId, ownerId });
      throw this.normalizeError(err);
    }
  }

  async archiveProduct(ownerId: string, productId: string): Promise<ProductRecord> {
    try {
      const now = new Date().toISOString();
      const updated = await this.updateProduct(ownerId, productId, {
        status: 'archived',
        archivedAt: now,
      });
      logger.info('FIRESTORE', 'Soft-archived product record', { productId, ownerId });
      return updated;
    } catch (err) {
      logger.warn('FIRESTORE', 'Failed to archive product', {
        productId,
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw this.normalizeError(err);
    }
  }

  async restoreProduct(ownerId: string, productId: string): Promise<ProductRecord> {
    try {
      const docRef = doc(db, 'products', productId);
      const now = new Date().toISOString();
      await updateDoc(docRef, {
        status: 'draft',
        archivedAt: deleteField(),
        updatedAt: now,
      });
      const updatedSnap = await getDoc(docRef);
      logger.info('FIRESTORE', 'Restored archived product to draft', { productId, ownerId });
      return updatedSnap.data() as ProductRecord;
    } catch (err) {
      logger.warn('FIRESTORE', 'Failed to restore product', {
        productId,
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw this.normalizeError(err);
    }
  }

  async deleteProduct(ownerId: string, productId: string): Promise<void> {
    try {
      const docRef = doc(db, 'products', productId);
      await deleteDoc(docRef);
      logger.info('FIRESTORE', 'Deleted product from Firestore', { productId, ownerId });
    } catch (err) {
      logger.warn('FIRESTORE', 'Failed to delete product from Firestore', {
        productId,
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw this.normalizeError(err);
    }
  }

  private normalizeError(err: unknown): Error {
    if (err instanceof Error) {
      if (err.message.includes('permission-denied') || (err as { code?: string }).code === 'permission-denied') {
        return new Error('Access denied: You are not authorized to access or modify this product.');
      }
      return err;
    }
    return new Error('An error occurred while accessing product records.');
  }
}
