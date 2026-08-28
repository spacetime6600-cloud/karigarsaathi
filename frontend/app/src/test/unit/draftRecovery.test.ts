import { describe, it, expect, beforeEach } from 'vitest';
import { draftRecoveryService } from '@/services/storage/draftRecoveryService';
import { ProductDraft } from '@/types';

describe('Draft Recovery & Local Conflict Resolution', () => {
  const OWNER_ID = 'artisan_test_uid';
  const DRAFT_ID = 'draft_test_101';

  const mockDraft: ProductDraft = {
    id: DRAFT_ID,
    artisanId: OWNER_ID,
    title: 'Original Cloud Title',
    category: 'Handloom Textiles',
    technique: 'Jamdani',
    materials: ['Silk'],
    dimensions: '5m x 1m',
    origin: 'Assam',
    story: 'Woven over 10 days.',
    photos: [],
    coverPhotoIndex: 0,
    confirmedFacts: [],
    needsReviewFacts: [],
    costBreakdown: { rawMaterials: 2000, laborHours: 10, hourlyRate: 150, packagingAndLogistics: 200, totalCost: 3700 },
    selectedPrice: 5000,
    pricingStrategy: 'fair_trade',
    publicFields: {
      title: true, category: true, technique: true, materials: true,
      dimensions: true, origin: true, story: true, artisanName: true,
      workshopLocation: true, directContact: true, retailPrice: true, wholesaleAvailable: false,
    },
    status: 'draft',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves local recovery draft', () => {
    draftRecoveryService.saveLocalRecovery(OWNER_ID, mockDraft);
    const recovered = draftRecoveryService.getLocalRecovery(OWNER_ID, DRAFT_ID);

    expect(recovered).not.toBeNull();
    expect(recovered?.draft.title).toBe('Original Cloud Title');
    expect(recovered?.ownerId).toBe(OWNER_ID);
    expect(recovered?.savedAt).toBeDefined();
  });

  it('clears local recovery draft cleanly', () => {
    draftRecoveryService.saveLocalRecovery(OWNER_ID, mockDraft);
    expect(draftRecoveryService.getLocalRecovery(OWNER_ID, DRAFT_ID)).not.toBeNull();

    draftRecoveryService.clearLocalRecovery(OWNER_ID, DRAFT_ID);
    expect(draftRecoveryService.getLocalRecovery(OWNER_ID, DRAFT_ID)).toBeNull();
  });

  it('detects no conflict when local copy matches cloud timestamp', () => {
    const conflict = draftRecoveryService.detectConflict(mockDraft, null);
    expect(conflict.hasConflict).toBe(false);
  });

  it('detects a conflict when local draft is significantly newer and has modifications', () => {
    const localDraftRecord = {
      draft: {
        ...mockDraft,
        title: 'Newer Unsaved Device Title',
      },
      savedAt: '2026-08-27T10:05:00.000Z', // 5 mins newer
      ownerId: OWNER_ID,
      revision: 2,
    };

    const conflict = draftRecoveryService.detectConflict(mockDraft, localDraftRecord);
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.localIsNewer).toBe(true);
    expect(conflict.timeDiffSeconds).toBe(300);
  });

  it('sanitizes draft payload to prevent storing huge base64 strings in localStorage', () => {
    const draftWithBase64: ProductDraft = {
      ...mockDraft,
      photos: [
        {
          id: 'p_heavy',
          name: 'heavy.jpg',
          size: 50000,
          type: 'image/jpeg',
          url: 'data:image/jpeg;base64,' + 'A'.repeat(2000),
          uploadedAt: '2026-08-27T10:00:00.000Z',
        },
      ],
    };

    draftRecoveryService.saveLocalRecovery(OWNER_ID, draftWithBase64);
    const recovered = draftRecoveryService.getLocalRecovery(OWNER_ID, DRAFT_ID);

    expect(recovered).not.toBeNull();
    // Raw Base64 should be stripped to empty string
    expect(recovered?.draft.photos[0].url).toBe('');
    const rawStored = localStorage.getItem('karigar_saathi_karigar_draft_recovery_' + OWNER_ID + '_' + DRAFT_ID) || '';
    expect(rawStored).not.toContain('AAAAAAA');
  });
});
