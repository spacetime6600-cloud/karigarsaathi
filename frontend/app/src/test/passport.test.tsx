import { describe, it, expect } from 'vitest';
import { passportService } from '@/services/api/passportService';
import { ProductDraft, ArtisanProfile } from '@/types';

describe('Craft Passport Generation & Privacy Filtering', () => {
  const mockArtisan: ArtisanProfile = {
    id: 'art_test_1',
    name: 'Ravi Kumar',
    phone: '9876543210',
    role: 'artisan',
    craftType: 'Handloom Jamdani',
    location: 'Assam, India',
    avatarUrl: 'https://test.com/avatar.jpg',
    workshopName: 'Ravi Weaves',
    bio: 'Master artisan test bio',
    joinedYear: 2021,
  };

  const mockDraft: ProductDraft = {
    id: 'draft_test_101',
    artisanId: 'art_test_1',
    title: 'Pure Mulberry Silk Jamdani',
    category: 'Handloom Textiles',
    technique: 'Traditional Jamdani Weave',
    materials: ['Silk', 'Vegetable Dyes'],
    dimensions: '5.5m x 1.2m',
    origin: 'Assam, India',
    story: 'Heritage test story for artisan provenance.',
    photos: [{ id: 'p1', url: 'https://test.com/photo.jpg', name: 'p1.jpg', size: 1000, type: 'image/jpeg', uploadedAt: new Date().toISOString() }],
    coverPhotoIndex: 0,
    confirmedFacts: [],
    needsReviewFacts: [],
    costBreakdown: { rawMaterials: 3000, laborHours: 40, hourlyRate: 150, packagingAndLogistics: 500, totalCost: 9500 },
    selectedPrice: 14500,
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

  it('creates a verified craft passport with cryptographic verification hash', () => {
    const passport = passportService.createPassport(mockDraft, mockArtisan);

    expect(passport.id).toContain('KP_');
    expect(passport.verificationHash).toContain('SHA256:KGS-');
    expect(passport.productTitle).toBe(mockDraft.title);
    expect(passport.artisanName).toBe(mockArtisan.name);
    expect(passport.publicPrice).toBe(14500);
  });

  it('anonymizes artisan name and hides price when toggled private', () => {
    const privateDraft: ProductDraft = {
      ...mockDraft,
      publicFields: {
        ...mockDraft.publicFields,
        artisanName: false,
        retailPrice: false,
        story: false,
      },
    };

    const passport = passportService.createPassport(privateDraft, mockArtisan);

    expect(passport.artisanName).toBe('Verified Master Artisan');
    expect(passport.publicPrice).toBeUndefined();
    expect(passport.story).toBe('');
  });
});
