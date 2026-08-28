/**
 * Privacy-Safe Coordinator & Cluster Helper Service for KarigarSaathi
 * Guarantees assignment-based isolation, privacy-safe aggregations,
 * and blocks unauthorized access to private artisan profiles, buyer details, and unassigned clusters.
 */

import {
  CoordinatorAssignment,
  CoordinatorArtisanProjection,
  CoordinatorExportProblem,
} from '@/types';
import { ICoordinatorRepository } from '@/repositories/interfaces/ICoordinatorRepository';
import { IArtisanProfileRepository } from '@/repositories/interfaces/IArtisanProfileRepository';
import { IProductRepository } from '@/repositories/interfaces/IProductRepository';
import { IPassportRepository } from '@/repositories/interfaces/IPassportRepository';
import { IEnquiryRepository } from '@/repositories/interfaces/IEnquiryRepository';
import { FirestoreCoordinatorRepository } from '@/repositories/firebase/FirestoreCoordinatorRepository';
import { FirestoreArtisanProfileRepository } from '@/repositories/firebase/FirestoreArtisanProfileRepository';
import { FirestoreProductRepository } from '@/repositories/firebase/FirestoreProductRepository';
import { FirestorePassportRepository } from '@/repositories/firebase/FirestorePassportRepository';
import { FirestoreEnquiryRepository } from '@/repositories/firebase/FirestoreEnquiryRepository';
import { MockCoordinatorRepository } from '@/repositories/mock/MockCoordinatorRepository';
import { MockArtisanProfileRepository } from '@/repositories/mock/MockArtisanProfileRepository';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { MockEnquiryRepository } from '@/repositories/mock/MockEnquiryRepository';
import { logger } from '@/services/logging/logger';

export class CoordinatorService {
  private coordRepo: ICoordinatorRepository;
  private profileRepo: IArtisanProfileRepository;
  private productRepo: IProductRepository;
  private passportRepo: IPassportRepository;
  private enquiryRepo: IEnquiryRepository;

  constructor(
    coordRepo?: ICoordinatorRepository,
    profileRepo?: IArtisanProfileRepository,
    productRepo?: IProductRepository,
    passportRepo?: IPassportRepository,
    enquiryRepo?: IEnquiryRepository
  ) {
    const isMock = process.env.NODE_ENV === 'test' && typeof window === 'undefined' && !process.env.FIREBASE_EMULATOR_HUB;
    this.coordRepo = coordRepo || (isMock ? new MockCoordinatorRepository() : new FirestoreCoordinatorRepository());
    this.profileRepo = profileRepo || (isMock ? new MockArtisanProfileRepository() : new FirestoreArtisanProfileRepository());
    this.productRepo = productRepo || (isMock ? new MockProductRepository() : new FirestoreProductRepository());
    this.passportRepo = passportRepo || (isMock ? new MockPassportRepository() : new FirestorePassportRepository());
    this.enquiryRepo = enquiryRepo || (isMock ? new MockEnquiryRepository() : new FirestoreEnquiryRepository());
  }

  /**
   * Retrieves a single privacy-safe projection for an artisan assigned to this coordinator.
   * Throws an error if the coordinator is not actively assigned to this artisan.
   */
  async getAssignedArtisanProjection(
    coordinatorUid: string,
    targetArtisanUid: string
  ): Promise<CoordinatorArtisanProjection> {
    if (!coordinatorUid || !targetArtisanUid) {
      throw new Error('Coordinator UID and target Artisan UID are required.');
    }

    // 1. Check Active Assignment
    const assignment = await this.coordRepo.getAssignment(coordinatorUid, targetArtisanUid);
    if (!assignment || !assignment.active) {
      logger.warn('COORDINATOR', 'Unauthorized access attempt: No active assignment', {
        coordinatorUid,
        targetArtisanUid,
      });
      throw new Error(`Access denied: Coordinator is not assigned to artisan ${targetArtisanUid}.`);
    }

    // Check expiration if set
    if (assignment.expiresAt && new Date(assignment.expiresAt).getTime() <= Date.now()) {
      logger.warn('COORDINATOR', 'Unauthorized access attempt: Assignment expired', {
        coordinatorUid,
        targetArtisanUid,
        expiresAt: assignment.expiresAt,
      });
      throw new Error('Access denied: Coordinator assignment has expired.');
    }

    return this.buildSafeProjection(assignment);
  }

  /**
   * Lists all privacy-safe artisan projections for this coordinator's approved assignments.
   */
  async listAssignedArtisans(coordinatorUid: string): Promise<CoordinatorArtisanProjection[]> {
    if (!coordinatorUid) return [];

    const assignments = await this.coordRepo.listCoordinatorAssignments(coordinatorUid);
    const projections: CoordinatorArtisanProjection[] = [];

    for (const assignment of assignments) {
      try {
        const proj = await this.buildSafeProjection(assignment);
        projections.push(proj);
      } catch (err) {
        logger.warn('COORDINATOR', 'Failed to build projection for assigned artisan', {
          artisanUid: assignment.artisanUid,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return projections;
  }

  /**
   * Helper: Builds a strictly privacy-safe projection from authorized data sources.
   * Never exposes raw profile phone, email, address, bank info, or unredacted buyer messages.
   */
  private async buildSafeProjection(
    assignment: CoordinatorAssignment
  ): Promise<CoordinatorArtisanProjection> {
    const artisanUid = assignment.artisanUid;

    // A. Read Public/Safe Artisan Profile Info
    let displayName = assignment.artisanName || 'Regional Artisan';
    let state = 'India';
    let clusterName = assignment.clusterName || 'Regional Cluster';

    try {
      const profile = await this.profileRepo.getCurrentProfile(artisanUid);
      if (profile) {
        displayName = profile.artisanName || displayName;
        state = profile.state || state;
        clusterName = profile.district || clusterName;
      }
    } catch {
      // Use assignment metadata fallback
    }

    // B. Calculate Product Counts by Lifecycle Status
    const productCounts = {
      draft: 0,
      ready: 0,
      shared: 0,
      enquiry_received: 0,
      archived: 0,
      total: 0,
    };

    try {
      const products = await this.productRepo.listAllArtisanProducts(artisanUid);
      productCounts.total = products.length;
      for (const prod of products) {
        const st = prod.status;
        if (st === 'draft') productCounts.draft++;
        else if (st === 'ready') productCounts.ready++;
        else if (st === 'shared' || st === 'published') productCounts.shared++;
        else if (st === 'enquiry_received') productCounts.enquiry_received++;
        else if (st === 'archived') productCounts.archived++;
        else productCounts.draft++;
      }
    } catch {
      // Defaults to 0
    }

    // C. Count New Enquiries
    let newEnquiryCount = 0;
    try {
      newEnquiryCount = await this.enquiryRepo.countNewEnquiries(artisanUid);
    } catch {
      newEnquiryCount = 0;
    }

    // D. Fetch Export Problems (Only if assistExports permission is granted)
    const exportProblems: CoordinatorExportProblem[] = [];
    if (assignment.permissions.assistExports) {
      try {
        const audits = await this.passportRepo.listAuditRecords(artisanUid);
        const failedAudits = audits.filter((a) => a.status === 'failed' || a.action === 'failed');
        for (const f of failedAudits.slice(0, 5)) {
          exportProblems.push({
            productId: f.productId,
            productTitle: `Craft Item (${f.productId.slice(0, 8)})`,
            format: f.format,
            channel: f.channel,
            errorMessage: f.errorMessage || 'Export generation failed',
            errorCode: f.errorCode,
            createdAt: f.createdAt,
          });
        }
      } catch {
        // Ignored
      }
    }

    return {
      artisanUid,
      artisanDisplayName: displayName,
      clusterName,
      state,
      productCounts,
      newEnquiryCount,
      exportProblemsCount: exportProblems.length,
      exportProblems: assignment.permissions.assistExports ? exportProblems : undefined,
      lastActivityAt: new Date().toISOString(),
      active: assignment.active,
      permissions: assignment.permissions,
    };
  }

  /**
   * Retrieves full authorized detail for an assigned artisan.
   * Throws if the coordinator is not actively assigned to this artisan.
   */
  async getAssignedArtisanDetail(
    coordinatorUid: string,
    targetArtisanUid: string
  ): Promise<{
    projection: CoordinatorArtisanProjection;
    profile: any;
    products: Array<any>;
    enquiries: any[];
    exportProblems: CoordinatorExportProblem[];
  }> {
    const projection = await this.getAssignedArtisanProjection(coordinatorUid, targetArtisanUid);

    let profile: any = null;
    try {
      profile = await this.profileRepo.getCurrentProfile(targetArtisanUid);
    } catch {
      profile = null;
    }

    let products: any[] = [];
    try {
      const prods = await this.productRepo.listAllArtisanProducts(targetArtisanUid);
      products = prods;
    } catch {
      products = [];
    }

    let enquiries: any[] = [];
    if (projection.permissions.viewEnquirySummary) {
      try {
        enquiries = await this.enquiryRepo.listArtisanEnquiries(targetArtisanUid);
      } catch {
        enquiries = [];
      }
    }

    return {
      projection,
      profile,
      products,
      enquiries,
      exportProblems: projection.exportProblems || [],
    };
  }

  /**
   * Lists all products across all artisans assigned to this coordinator.
   */
  async listAssignedProducts(
    coordinatorUid: string,
    statusFilter?: string
  ): Promise<Array<any & { artisanUid: string; artisanName: string; clusterName: string }>> {
    const projections = await this.listAssignedArtisans(coordinatorUid);
    const results: any[] = [];

    for (const proj of projections) {
      try {
        const prods = await this.productRepo.listAllArtisanProducts(proj.artisanUid);
        for (const p of prods) {
          if (!statusFilter || statusFilter === 'all' || p.status === statusFilter) {
            results.push({
              ...p,
              artisanUid: proj.artisanUid,
              artisanName: proj.artisanDisplayName,
              clusterName: proj.clusterName || 'Regional Cluster',
            });
          }
        }
      } catch {
        // Continue
      }
    }

    return results;
  }

  /**
   * Lists all buyer enquiries across all artisans assigned to this coordinator.
   */
  async listAssignedEnquiries(
    coordinatorUid: string,
    statusFilter?: string
  ): Promise<Array<any & { artisanUid: string; artisanName: string; clusterName: string }>> {
    const projections = await this.listAssignedArtisans(coordinatorUid);
    const results: any[] = [];

    for (const proj of projections) {
      if (!proj.permissions.viewEnquirySummary) continue;
      try {
        const enqs = await this.enquiryRepo.listArtisanEnquiries(proj.artisanUid);
        for (const e of enqs) {
          if (!statusFilter || statusFilter === 'all' || e.status === statusFilter) {
            results.push({
              ...e,
              artisanUid: proj.artisanUid,
              artisanName: proj.artisanDisplayName,
              clusterName: proj.clusterName || 'Regional Cluster',
            });
          }
        }
      } catch {
        // Continue
      }
    }

    return results;
  }

  /**
   * Computes aggregate metrics and the "Needs Attention" queue for the coordinator's scope.
   */
  async getAssignedMetrics(coordinatorUid: string, _dateRange: string = 'all'): Promise<{
    totalAssigned: number;
    totalProducts: number;
    productsNeedingReview: number;
    openEnquiries: number;
    confirmedSalesCount: number;
    confirmedSalesVolume: number;
    clusterBreakdown: Array<{
      clusterName: string;
      state: string;
      artisanCount: number;
      productCount: number;
      enquiryCount: number;
    }>;
    needsAttentionQueue: Array<{
      id: string;
      type: 'review' | 'enquiry' | 'export';
      title: string;
      subtitle: string;
      artisanUid: string;
      artisanName: string;
      status: string;
      updatedAt: string;
      actionLabel: string;
      targetRoute: string;
    }>;
  }> {
    const projections = await this.listAssignedArtisans(coordinatorUid);
    const totalAssigned = projections.length;

    let totalProducts = 0;
    let productsNeedingReview = 0;
    let openEnquiries = 0;
    let confirmedSalesCount = 0;
    let confirmedSalesVolume = 0;

    const clusterMap: Record<string, { clusterName: string; state: string; artisanCount: number; productCount: number; enquiryCount: number }> = {};
    const needsAttention: Array<any> = [];

    for (const p of projections) {
      totalProducts += p.productCounts.total;
      productsNeedingReview += p.productCounts.draft;
      openEnquiries += p.newEnquiryCount;

      const clusterKey = p.clusterName || 'Regional Cluster';
      if (!clusterMap[clusterKey]) {
        clusterMap[clusterKey] = {
          clusterName: clusterKey,
          state: p.state || 'India',
          artisanCount: 0,
          productCount: 0,
          enquiryCount: 0,
        };
      }
      clusterMap[clusterKey].artisanCount += 1;
      clusterMap[clusterKey].productCount += p.productCounts.total;
      clusterMap[clusterKey].enquiryCount += p.newEnquiryCount;

      // Check export problems for needs attention
      if (p.exportProblems && p.exportProblems.length > 0) {
        for (const ep of p.exportProblems) {
          needsAttention.push({
            id: `export_${ep.productId}`,
            type: 'export',
            title: `Export Error: ${ep.productTitle}`,
            subtitle: ep.errorMessage || 'Export channel validation failed',
            artisanUid: p.artisanUid,
            artisanName: p.artisanDisplayName,
            status: 'Export Blocked',
            updatedAt: ep.createdAt || new Date().toISOString(),
            actionLabel: 'Resolve Export',
            targetRoute: `/coordinator/sales?tab=exports`,
          });
        }
      }

      // Check draft products needing review
      if (p.productCounts.draft > 0) {
        needsAttention.push({
          id: `review_${p.artisanUid}`,
          type: 'review',
          title: `Catalog Incomplete: ${p.productCounts.draft} Draft(s)`,
          subtitle: 'Missing mandatory pricing, photos, or story fields',
          artisanUid: p.artisanUid,
          artisanName: p.artisanDisplayName,
          status: 'Needs Review',
          updatedAt: p.lastActivityAt || new Date().toISOString(),
          actionLabel: 'Review Drafts',
          targetRoute: `/coordinator/reviews?artisanId=${p.artisanUid}`,
        });
      }

      // Check enquiries
      if (p.newEnquiryCount > 0) {
        needsAttention.push({
          id: `enquiry_${p.artisanUid}`,
          type: 'enquiry',
          title: `${p.newEnquiryCount} New Buyer Enquiry`,
          subtitle: 'Awaiting verified quotation and dispatch details',
          artisanUid: p.artisanUid,
          artisanName: p.artisanDisplayName,
          status: 'New Enquiry',
          updatedAt: p.lastActivityAt || new Date().toISOString(),
          actionLabel: 'Assist Reply',
          targetRoute: `/coordinator/enquiries?artisanId=${p.artisanUid}`,
        });
      }

      // Check confirmed sales
      if (p.permissions.viewEnquirySummary) {
        try {
          const enqs = await this.enquiryRepo.listArtisanEnquiries(p.artisanUid);
          for (const eq of enqs) {
            if (eq.status === 'order_confirmed') {
              confirmedSalesCount += 1;
              const lastQuote = eq.replies?.find((r: { priceQuote?: number }) => r.priceQuote)?.priceQuote || 0;
              confirmedSalesVolume += (eq.quantityRequested || 1) * lastQuote;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    return {
      totalAssigned,
      totalProducts,
      productsNeedingReview,
      openEnquiries,
      confirmedSalesCount,
      confirmedSalesVolume,
      clusterBreakdown: Object.values(clusterMap),
      needsAttentionQueue: needsAttention.slice(0, 10),
    };
  }

  /**
   * Coordinator review feedback mutation.
   */
  async updateProductReview(
    coordinatorUid: string,
    artisanUid: string,
    productId: string,
    reviewAction: 'mark_ready' | 'request_changes',
    reviewNotes?: string
  ): Promise<any> {
    // 1. Verify assignment authorization
    await this.getAssignedArtisanProjection(coordinatorUid, artisanUid);

    const product = await this.productRepo.getOwnedProductById(artisanUid, productId);
    if (!product) {
      throw new Error(`Product ${productId} not found for artisan ${artisanUid}`);
    }

    const updatedProduct = {
      ...product,
      status: (reviewAction === 'mark_ready' ? 'ready' : 'draft') as any,
      shippingNotes: reviewNotes || product.shippingNotes,
      updatedAt: new Date().toISOString(),
    };

    await this.productRepo.updateProduct(artisanUid, productId, updatedProduct);
    logger.info('COORDINATOR', 'Product review updated by coordinator', {
      coordinatorUid,
      artisanUid,
      productId,
      reviewAction,
    });

    return updatedProduct;
  }

  /**
   * Generates sanitized aggregate cluster report data in CSV or JSON format.
   */
  async exportClusterReport(coordinatorUid: string, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const metrics = await this.getAssignedMetrics(coordinatorUid);
    const projections = await this.listAssignedArtisans(coordinatorUid);

    if (format === 'json') {
      return JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          coordinatorUid,
          summary: {
            totalAssigned: metrics.totalAssigned,
            totalProducts: metrics.totalProducts,
            productsNeedingReview: metrics.productsNeedingReview,
            openEnquiries: metrics.openEnquiries,
            confirmedSalesCount: metrics.confirmedSalesCount,
            confirmedSalesVolume: metrics.confirmedSalesVolume,
          },
          clusters: metrics.clusterBreakdown,
          artisans: projections.map((p) => ({
            artisanUid: p.artisanUid,
            displayName: p.artisanDisplayName,
            cluster: p.clusterName,
            state: p.state,
            products: p.productCounts,
            newEnquiries: p.newEnquiryCount,
          })),
        },
        null,
        2
      );
    }

    // CSV format
    const rows = [
      ['Artisan Name', 'Cluster', 'State', 'Total Products', 'Drafts', 'Ready', 'Enquiries', 'Export Issues'].join(','),
      ...projections.map((p) =>
        [
          `"${p.artisanDisplayName.replace(/"/g, '""')}"`,
          `"${(p.clusterName || 'Regional').replace(/"/g, '""')}"`,
          `"${(p.state || 'India').replace(/"/g, '""')}"`,
          p.productCounts.total,
          p.productCounts.draft,
          p.productCounts.ready,
          p.newEnquiryCount,
          p.exportProblemsCount,
        ].join(',')
      ),
    ];

    return rows.join('\n');
  }
}

export const coordinatorService = new CoordinatorService();

