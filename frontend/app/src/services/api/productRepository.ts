import { ProductDraft, FactField } from '@/types';
import { productRepository as appProductRepo } from '@/repositories';
import { draftToProductRecord, productRecordToDraft } from '@/domain/products';
import { storage } from '../storage/localStorage';
import { logger } from '@/services/logging/logger';

const DEFAULT_DRAFT: ProductDraft = {
  id: 'draft_default_01',
  artisanId: 'artisan_001',
  title: 'Indigo & Terracotta Silk Jamdani Saree',
  category: 'Handloom Textiles',
  technique: 'Traditional Handloom Jamdani Weaving',
  materials: ['Pure Mulberry Silk', 'Natural Vegetable Dyes', 'Zari Threads'],
  dimensions: '5.5 meters (Length) x 1.2 meters (Width)',
  origin: 'Assam & Pochampally, India',
  story: 'Woven completely on a traditional pit loom over 18 days. The terracotta and deep indigo geometric patterns celebrate regional river heritage.',
  photos: [
    {
      id: 'p1',
      url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      name: 'jamdani_saree_full.jpg',
      size: 2450000,
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      isCover: true,
    },
  ],
  coverPhotoIndex: 0,
  voiceNoteUrl: 'blob:simulated_audio_note_01',
  voiceTranscript: 'यह साड़ी शुद्ध शहतूत रेशम और प्राकृतिक टेराकोटा रंगों से 18 दिनों में हथकरघे पर बुनी गई है।',
  voiceConfidence: 0.94,
  confirmedFacts: [
    { key: 'category', label: 'Category', value: 'Handwoven Textiles', isConfirmed: true, confidenceScore: 0.98 },
    { key: 'origin', label: 'Origin', value: 'Assam, India', isConfirmed: true, confidenceScore: 0.95 },
    { key: 'technique', label: 'Primary Technique', value: 'Handloom Jamdani Weave', isConfirmed: true, confidenceScore: 0.94 },
  ],
  needsReviewFacts: [],
  costBreakdown: {
    rawMaterials: 3800,
    laborHours: 42,
    hourlyRate: 150,
    packagingAndLogistics: 450,
    totalCost: 10550,
  },
  selectedPrice: 14243,
  pricingStrategy: 'fair_trade',
  publicFields: {
    title: true,
    category: true,
    technique: true,
    materials: true,
    dimensions: true,
    origin: true,
    story: true,
    artisanName: true,
    workshopLocation: true,
    directContact: true,
    retailPrice: true,
    wholesaleAvailable: false,
  },
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SEED_PRODUCTS: ProductDraft[] = [
  DEFAULT_DRAFT,
  {
    ...DEFAULT_DRAFT,
    id: 'draft_default_02',
    title: 'Indigo & Terracotta Silk Jamdani Saree',
    selectedPrice: 14500,
  },
  {
    ...DEFAULT_DRAFT,
    id: 'draft_default_03',
    title: 'Handloom Silk Trousers & Stole Set',
    selectedPrice: 17408,
    photos: [
      {
        id: 'p4',
        url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
        name: 'handloom_pants.jpg',
        size: 2100000,
        type: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        isCover: true,
      },
    ],
  },
];

export const productRepository = {
  getDraft(): ProductDraft {
    return storage.get<ProductDraft>('currentDraft', DEFAULT_DRAFT);
  },

  saveDraft(draft: Partial<ProductDraft>): ProductDraft {
    const current = this.getDraft();
    const updated: ProductDraft = {
      ...current,
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    storage.set('currentDraft', updated);
    return updated;
  },

  resetDraft(): ProductDraft {
    const newDraft: ProductDraft = {
      ...DEFAULT_DRAFT,
      id: `draft_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.set('currentDraft', newDraft);
    return newDraft;
  },

  listProducts(): ProductDraft[] {
    return storage.get<ProductDraft[]>('productsList', SEED_PRODUCTS);
  },

  async saveProduct(product: ProductDraft, ownerId?: string): Promise<void> {
    const list = this.listProducts();
    const index = list.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      list[index] = product;
    } else {
      list.unshift(product);
    }
    storage.set('productsList', list);

    if (ownerId) {
      try {
        const record = draftToProductRecord(product, ownerId);
        await appProductRepo.updateProduct(ownerId, product.id, record);
      } catch (err) {
        logger.warn('FIRESTORE', 'Fallback repository write to Firestore', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  },

  archiveProduct(productId: string): void {
    const list = this.listProducts();
    const index = list.findIndex((p) => p.id === productId);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        status: 'archived',
        updatedAt: new Date().toISOString(),
      };
      storage.set('productsList', list);
    }
  },

  restoreProduct(productId: string): void {
    const list = this.listProducts();
    const index = list.findIndex((p) => p.id === productId);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };
      storage.set('productsList', list);
    }
  },

  deleteProduct(productId: string): void {
    const list = this.listProducts();
    const filtered = list.filter((p) => p.id !== productId);
    storage.set('productsList', filtered);
  },

  async fetchArtisanProductsFromFirebase(ownerId: string): Promise<ProductDraft[]> {
    try {
      const records = await appProductRepo.listCurrentArtisanProducts(ownerId);
      return records.map(productRecordToDraft);
    } catch (err) {
      logger.warn('FIRESTORE', 'Failed to fetch products via repository adapter', {
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
      return this.listProducts();
    }
  },

  extractFactsFromInput(_transcriptOrText: string): { confirmed: FactField[]; needsReview: FactField[] } {
    return {
      confirmed: [
        { key: 'category', label: 'Craft Category', value: 'Handloom Silk Textile', isConfirmed: true, confidenceScore: 0.96 },
        { key: 'origin', label: 'Artisan Region', value: 'Assam & Pochampally, India', isConfirmed: true, confidenceScore: 0.94 },
        { key: 'technique', label: 'Weaving Technique', value: 'Traditional Jamdani Weave', isConfirmed: true, confidenceScore: 0.92 },
      ],
      needsReview: [
        {
          key: 'materials',
          label: 'Material Composition',
          value: 'Pure Mulberry Silk & Vegetable Dyes',
          isConfirmed: false,
          confidenceScore: 0.74,
          needsReviewReason: 'Confirm whether metallic zari threads were used.',
        },
        {
          key: 'dimensions',
          label: 'Product Dimensions',
          value: '5.5 x 1.2 meters',
          isConfirmed: false,
          confidenceScore: 0.81,
          needsReviewReason: 'Confirm if standard border dimensions apply.',
        },
      ],
    };
  },
};
