import { describe, it, expect, beforeEach } from 'vitest';
import { CoordinatorService } from '@/services/coordinator/coordinatorService';
import { MockCoordinatorRepository } from '@/repositories/mock/MockCoordinatorRepository';
import { MockArtisanProfileRepository } from '@/repositories/mock/MockArtisanProfileRepository';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { MockEnquiryRepository } from '@/repositories/mock/MockEnquiryRepository';

describe('Coordinator Authorization & Privacy-Safe Projection Suite', () => {
  let coordRepo: MockCoordinatorRepository;
  let profileRepo: MockArtisanProfileRepository;
  let productRepo: MockProductRepository;
  let passportRepo: MockPassportRepository;
  let enquiryRepo: MockEnquiryRepository;
  let service: CoordinatorService;

  const coordinatorA = 'coord_user_001';
  const artisanA = 'artisan_user_A';
  const artisanB = 'artisan_user_B';

  beforeEach(async () => {
    coordRepo = new MockCoordinatorRepository();
    profileRepo = new MockArtisanProfileRepository();
    productRepo = new MockProductRepository();
    passportRepo = new MockPassportRepository();
    enquiryRepo = new MockEnquiryRepository();

    // 1. Assign Coordinator A to Artisan A only
    await coordRepo.createAssignment({
      id: `coord_${coordinatorA}_${artisanA}`,
      coordinatorUid: coordinatorA,
      artisanUid: artisanA,
      artisanName: 'Ravi Kumar',
      clusterName: 'Kamrup Silk Cluster',
      active: true,
      approvedAt: '2026-08-27T10:00:00Z',
      approvedBy: 'admin_root',
      permissions: {
        viewStatus: true,
        viewEnquirySummary: true,
        assistExports: true,
      },
      createdAt: '2026-08-27T10:00:00Z',
      updatedAt: '2026-08-27T10:00:00Z',
    });

    // 2. Setup Artisan A Profile
    await profileRepo.createProfile(artisanA, {
      artisanName: 'Ravi Kumar',
      craftType: 'Silk Weaving',
      state: 'Assam',
      district: 'Kamrup',
      bio: 'Master weaver',
      languages: ['en', 'hi', 'as'],
      workshopName: "Ravi's Loom",
      joinedYear: 2020,
    });

    // 3. Setup Artisan A Products
    await productRepo.createProduct(artisanA, {
      id: 'prod_a_1',
      title: 'Muga Saree',
      description: 'Authentic pure silk saree',
      category: 'Textiles',
      craftType: 'Weaving',
      state: 'Assam',
      price: 12000,
      currency: 'INR',
      stockQuantity: 2,
      status: 'ready',
      photoPaths: ['p1.jpg'],
    });

    await productRepo.createProduct(artisanA, {
      id: 'prod_a_2',
      title: 'Silk Scarf',
      description: 'Handwoven silk scarf',
      category: 'Textiles',
      craftType: 'Weaving',
      state: 'Assam',
      price: 3000,
      currency: 'INR',
      stockQuantity: 5,
      status: 'enquiry_received',
      photoPaths: ['p2.jpg'],
    });

    // 4. Setup Artisan A Export Failure
    await passportRepo.recordAudit({
      id: 'audit_fail_1',
      ownerId: artisanA,
      productId: 'prod_a_1',
      format: 'pdf',
      action: 'export',
      status: 'failed',
      errorMessage: 'Export template rendering timeout',
      createdAt: '2026-08-27T11:00:00Z',
    });

    service = new CoordinatorService(
      coordRepo,
      profileRepo,
      productRepo,
      passportRepo,
      enquiryRepo
    );
  });

  it('1. Authorised Coordinator A can access Artisan A privacy-safe projection', async () => {
    const projection = await service.getAssignedArtisanProjection(coordinatorA, artisanA);

    expect(projection).toBeDefined();
    expect(projection.artisanDisplayName).toBe('Ravi Kumar');
    expect(projection.clusterName).toBe('Kamrup');
    expect(projection.productCounts.ready).toBe(1);
    expect(projection.productCounts.enquiry_received).toBe(1);
    expect(projection.productCounts.total).toBe(2);
    expect(projection.exportProblemsCount).toBe(1);
    expect(projection.exportProblems?.[0].errorMessage).toBe('Export template rendering timeout');
  });

  it('2. Coordinator A is strictly REJECTED when attempting to access unassigned Artisan B', async () => {
    await expect(
      service.getAssignedArtisanProjection(coordinatorA, artisanB)
    ).rejects.toThrow('Access denied: Coordinator is not assigned');
  });

  it('3. Unauthorized coordinator without assignments receives empty projection list', async () => {
    const unauthorizedCoord = 'coord_stranger_999';
    const list = await service.listAssignedArtisans(unauthorizedCoord);
    expect(list).toEqual([]);
  });

  it('4. Rejects coordinator access when assignment is marked revoked/inactive', async () => {
    await coordRepo.revokeAssignment(`coord_${coordinatorA}_${artisanA}`);

    await expect(
      service.getAssignedArtisanProjection(coordinatorA, artisanA)
    ).rejects.toThrow('Access denied: Coordinator is not assigned');
  });

  it('5. Verifies projection contains zero private profile details or raw sensitive data', async () => {
    const projection = await service.getAssignedArtisanProjection(coordinatorA, artisanA);

    // Verify projection schema does NOT include private profile fields
    const untyped = projection as unknown as Record<string, unknown>;
    expect(untyped.bio).toBeUndefined();
    expect(untyped.phone).toBeUndefined();
    expect(untyped.email).toBeUndefined();
    expect(untyped.bankAccount).toBeUndefined();
    expect(untyped.consentRecords).toBeUndefined();
    expect(untyped.buyerMessages).toBeUndefined();
  });
});
