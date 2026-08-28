import { ProductDraft } from '@/types';

export interface ReadinessValidationError {
  field: string;
  message: string;
  stepUrl: string;
  stepName: string;
}

export interface ReadinessValidationResult {
  isReady: boolean;
  errors: ReadinessValidationError[];
}

/**
 * Phase 9 Final Listing-Readiness Validation Gate.
 * Validates the 10 mandatory conditions for transitioning to status 'ready':
 * 1. At least one successfully uploaded product photograph exists
 * 2. A primary image is selected
 * 3. No required image upload is pending or failed
 * 4. Product title is non-empty after trimming
 * 5. Description is non-empty after trimming
 * 6. Category is selected
 * 7. Craft type is non-empty
 * 8. Material is non-empty
 * 9. Price is a valid non-negative INR amount
 * 10. Stock quantity is a valid non-negative integer
 */
export function validateProductForReadiness(draft: ProductDraft): ReadinessValidationResult {
  const errors: ReadinessValidationError[] = [];

  // 1. At least one successfully uploaded product photograph exists
  const hasPhotos = (draft.photos && draft.photos.length > 0) ||
    (draft.images && draft.images.some((img) => img.uploadStatus === 'completed'));

  if (!hasPhotos) {
    errors.push({
      field: 'photos',
      message: 'At least one authentic craft photograph must be uploaded.',
      stepUrl: '/artisan/products/new/photos',
      stepName: 'Photographs',
    });
  }

  // 2. A primary image is selected
  const hasPrimaryImage = (draft.coverPhotoIndex !== undefined && draft.coverPhotoIndex >= 0 && draft.photos && draft.coverPhotoIndex < draft.photos.length) ||
    Boolean(draft.primaryImageId);

  if (!hasPrimaryImage && hasPhotos) {
    errors.push({
      field: 'primaryImage',
      message: 'A primary cover photograph must be selected.',
      stepUrl: '/artisan/products/new/photos',
      stepName: 'Photographs',
    });
  }

  // 3. No required image upload is pending or failed
  if (draft.images && draft.images.length > 0) {
    const hasIncompleteUploads = draft.images.some(
      (img) => img.uploadStatus === 'pending' || img.uploadStatus === 'failed'
    );
    if (hasIncompleteUploads) {
      errors.push({
        field: 'imageUploadStatus',
        message: 'All photograph uploads must be completed successfully without pending or failed files.',
        stepUrl: '/artisan/products/new/photos',
        stepName: 'Photographs',
      });
    }
  }

  // 4. Product title is non-empty after trimming
  if (!draft.title || !draft.title.trim()) {
    errors.push({
      field: 'title',
      message: 'Product title is required and cannot be empty.',
      stepUrl: '/artisan/products/new/details',
      stepName: 'Product Details',
    });
  }

  // 5. Description is non-empty after trimming
  const descriptionText = draft.story || draft.description || '';
  if (!descriptionText.trim()) {
    errors.push({
      field: 'description',
      message: 'Heritage craft story and product description are required.',
      stepUrl: '/artisan/products/new/details',
      stepName: 'Product Details',
    });
  }

  // 6. Category is selected
  if (!draft.category || !draft.category.trim()) {
    errors.push({
      field: 'category',
      message: 'Craft category must be selected.',
      stepUrl: '/artisan/products/new/details',
      stepName: 'Product Details',
    });
  }

  // 7. Craft type is non-empty
  const craftTypeText = draft.technique || draft.craftType || '';
  if (!craftTypeText.trim()) {
    errors.push({
      field: 'craftType',
      message: 'Craft technique / type must be specified.',
      stepUrl: '/artisan/products/new/details',
      stepName: 'Product Details',
    });
  }

  // 8. Material is non-empty
  const hasMaterials = (draft.material && draft.material.trim().length > 0) ||
    (Array.isArray(draft.materials) && draft.materials.length > 0 && draft.materials.some((m) => m && m.trim().length > 0));

  if (!hasMaterials) {
    errors.push({
      field: 'materials',
      message: 'At least one raw craft material must be listed.',
      stepUrl: '/artisan/products/new/details',
      stepName: 'Product Details',
    });
  }

  // 9. Price is a valid non-negative INR amount
  const priceValue = typeof draft.selectedPrice === 'number' ? draft.selectedPrice : undefined;
  if (priceValue === undefined || priceValue === null || isNaN(priceValue) || priceValue < 0) {
    errors.push({
      field: 'price',
      message: 'A valid non-negative retail price in INR is required.',
      stepUrl: '/artisan/products/new/price',
      stepName: 'Fair Pricing',
    });
  }

  // 10. Stock quantity is a valid non-negative integer
  const stockValue = draft.stockQuantity;
  if (stockValue === undefined || stockValue === null || isNaN(stockValue) || !Number.isInteger(stockValue) || stockValue < 0) {
    errors.push({
      field: 'stockQuantity',
      message: 'Stock inventory quantity must be a non-negative whole number (0 or higher).',
      stepUrl: '/artisan/products/new/details',
      stepName: 'Product Details',
    });
  }

  return {
    isReady: errors.length === 0,
    errors,
  };
}
