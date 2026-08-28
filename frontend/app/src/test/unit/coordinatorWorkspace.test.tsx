import { describe, it, expect, beforeEach } from 'vitest';
import { CoordinatorService } from '@/services/coordinator/coordinatorService';
import { MockCoordinatorRepository } from '@/repositories/mock/MockCoordinatorRepository';
import { MockArtisanProfileRepository } from '@/repositories/mock/MockArtisanProfileRepository';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { MockEnquiryRepository } from '@/repositories/mock/MockEnquiryRepository';
import { validateProductForReadiness } from '@/domain/products/validation';

describe('Coordinator Workspace & Cluster Intelligence Suite', () => {
  let coordRepo: MockCoordinatorRepository;
  let profileRepo: MockArtisanProfileRepository;
  let productRepo: MockProductRepository;
  let passportRepo: MockPassportRepository;
  let enquiryRepo: MockEnquiryRepository;
  let service: CoordinatorService;

  const coordinatorUid = 'coord_test_lead';
  const artisanA = 'artisan_kamrup_01';
  const artisanB = 'artisan_kamrup_02';
  const artisanC = 'artisan_unassigned_03';

  beforeEach(async () => {
    localStorage.clear();
    coordRepo = new MockCoordinatorRepository();
    profileRepo = new MockArtisanProfileRepository();
    productRepo = new MockProductRepository();
    passportRepo = new MockPassportRepository();
    enquiryRepo = new MockEnquiryRepository();

    // 1. Create active coordinator assignments for artisan A & B
    await coordRepo.createAssignment({
      id: `coord_${coordinatorUid}_${artisanA}`,
      coordinatorUid,
      artisanUid: artisanA,
      artisanName: 'Ravi Kumar',
      clusterName: 'Kamrup Silk Cluster',
      active: true,
      approvedAt: '2026-08-20T10:00:00Z',
      approvedBy: 'admin_root',
      permissions: {
        viewStatus: true,
        viewEnquirySummary: true,
        assistExports: true,
      },
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-20T10:00:00Z',
    });

    await coordRepo.createAssignment({
      id: `coord_${coordinatorUid}_${artisanB}`,
      coordinatorUid,
      artisanUid: artisanB,
      artisanName: 'Meera Devi',
      clusterName: 'Madhubani Painting Cluster',
      active: true,
      approvedAt: '2026-08-21T10:00:00Z',
      approvedBy: 'admin_root',
      permissions: {
        viewStatus: true,
        viewEnquirySummary: true,
        assistExports: false,
      },
      createdAt: '2026-08-21T10:00:00Z',
      updatedAt: '2026-08-21T10:00:00Z',
    });

    // 2. Setup artisan profiles
    await profileRepo.createProfile(artisanA, {
      artisanName: 'Ravi Kumar',
      craftType: 'Silk Weaving',
      district: 'Kamrup',
      state: 'Assam',
      bio: 'Master silk weaver',
      languages: ['en', 'hi'],
    });

    await profileRepo.createProfile(artisanB, {
      artisanName: 'Meera Devi',
      craftType: 'Madhubani Painting',
      district: 'Madhubani',
      state: 'Bihar',
      bio: 'Folk painting artist',
      languages: ['en', 'hi'],
    });

    // 3. Setup artisan products
    await productRepo.createProduct(artisanA, {
      id: 'prod_kamrup_1',
      title: 'Muga Silk Saree',
      description: 'Handwoven natural golden silk saree',
      category: 'Textiles',
      craftType: 'Weaving',
      state: 'Assam',
      price: 18000,
      currency: 'INR',
      stockQuantity: 3,
      status: 'ready',
      photoPaths: ['photo_1.jpg'],
    });

    await productRepo.createProduct(artisanA, {
      id: 'prod_kamrup_2',
      title: 'Incomplete Jamdani Stole',
      description: '',
      category: '',
      craftType: 'Weaving',
      state: 'Assam',
      price: 0,
      currency: 'INR',
      stockQuantity: 1,
      status: 'draft',
      photoPaths: [],
    });

    service = new CoordinatorService(
      coordRepo,
      profileRepo,
      productRepo,
      passportRepo,
      enquiryRepo
    );
  });

  it('1. Scopes artisan listings strictly to approved assignments', async () => {
    const list = await service.listAssignedArtisans(coordinatorUid);
    expect(list).toHaveLength(2);
    expect(list.map((a) => a.artisanUid)).toEqual(
      expect.arrayContaining([artisanA, artisanB])
    );
    expect(list.map((a) => a.artisanUid)).not.toContain(artisanC);
  });

  it('2. Denies access when requesting unassigned artisan detail projection', async () => {
    await expect(
      service.getAssignedArtisanProjection(coordinatorUid, artisanC)
    ).rejects.toThrow(/Access denied/);
  });

  it('3. Validates listing readiness gate and identifies missing fields', async () => {
    const detail = await service.getAssignedArtisanDetail(coordinatorUid, artisanA);
    expect(detail.products).toHaveLength(2);

    const draftProduct = detail.products.find((p) => p.id === 'prod_kamrup_2');

    const draftValidation = validateProductForReadiness(draftProduct);
    expect(draftValidation.isReady).toBe(false);
    expect(draftValidation.errors.length).toBeGreaterThan(0);

    const errorFields = draftValidation.errors.map((e) => e.field);
    expect(errorFields).toContain('photos');
    expect(errorFields).toContain('description');
    expect(errorFields).toContain('category');
  });

  it('4. Updates product review and records coordinator feedback safely', async () => {
    const updated = await service.updateProductReview(
      coordinatorUid,
      artisanA,
      'prod_kamrup_2',
      'request_changes',
      'Please add high-resolution photos and craft category'
    );

    expect(updated.status).toBe('draft');
    expect(updated.shippingNotes).toContain('Please add high-resolution photos');
  });

  it('5. Computes cluster metrics and creates sanitized CSV export', async () => {
    const metrics = await service.getAssignedMetrics(coordinatorUid);
    expect(metrics.totalAssigned).toBe(2);
    expect(metrics.totalProducts).toBe(2);
    expect(metrics.productsNeedingReview).toBe(1);

    const csvReport = await service.exportClusterReport(coordinatorUid, 'csv');
    expect(csvReport).toContain('Artisan Name,Cluster,State');
    expect(csvReport).toContain('Ravi Kumar');
    expect(csvReport).toContain('Meera Devi');
  });
});
