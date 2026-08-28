import { describe, it, expect } from 'vitest';
import { qrService } from '@/services/export/qrService';
import { whatsappService } from '@/services/export/whatsappService';
import { csvExportService, sanitizeCsvCell, CSV_SCHEMA_VERSION } from '@/services/export/csvExportService';
import { jsonExportService, JSON_SCHEMA_NAME, JSON_SCHEMA_VERSION } from '@/services/export/jsonExportService';
import { exportAuditService } from '@/services/audit/exportAuditService';
import { ProductDraft } from '@/types';

describe('Phase 10 — Export Formats & Sharing Integrity', () => {
  const sampleDraft: ProductDraft = {
    id: 'prod_test_export_01',
    artisanId: 'artisan_001',
    ownerId: 'artisan_001',
    title: 'Madhubani Handpainted Silk Stole',
    category: 'Handloom Textiles',
    technique: 'Madhubani Painting',
    materials: ['Tussar Silk', 'Natural Mineral Dyes'],
    dimensions: '2m x 0.5m',
    origin: 'Madhubani, Bihar',
    story: 'Traditional Kohbar motif painted with bamboo twigs.',
    photos: [
      { id: 'p1', name: 'photo1.jpg', size: 2048, type: 'image/jpeg', url: 'https://example.com/stole.jpg', uploadedAt: '2026-08-27T10:00:00.000Z' },
    ],
    coverPhotoIndex: 0,
    stockQuantity: 4,
    sku: 'MAD-STOLE-001',
    selectedPrice: 4200,
    currency: 'INR',
    pricingStrategy: 'fair_trade',
    publicFields: {
      title: true, category: true, technique: true, materials: true,
      dimensions: true, origin: true, story: true, artisanName: true,
      workshopLocation: true, directContact: true, retailPrice: true, wholesaleAvailable: false,
    },
    confirmedFacts: [],
    needsReviewFacts: [],
    costBreakdown: { rawMaterials: 1200, laborHours: 10, hourlyRate: 200, packagingAndLogistics: 200, totalCost: 3400 },
    status: 'ready',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
  };

  it('1. QR Code generator produces clean data URL encoding public HTTPS URL', async () => {
    const publicUrl = 'https://karigarsaathi.web.app/passport/madhubani-stole-77a1';
    const dataUrl = await qrService.generateQRCodeDataUrl(publicUrl);

    expect(dataUrl).toMatch(/^data:image\/(png|svg\+xml)/);
    // Verifies SVG fallback or PNG base64 exists
    expect(dataUrl.length).toBeGreaterThan(50);
  });

  it('2. WhatsApp share payload is correctly formatted with approved fields only', () => {
    const message = whatsappService.formatShareMessage({
      productTitle: 'Madhubani Handpainted Silk Stole',
      artisanName: 'Baua Devi',
      location: 'Madhubani, Bihar',
      publicPassportUrl: 'https://karigarsaathi.web.app/passport/madhubani-stole-77a1',
    });

    expect(message).toBe(
      'Discover Madhubani Handpainted Silk Stole, handcrafted by Baua Devi from Madhubani, Bihar. View its Craft Passport and send an enquiry: https://karigarsaathi.web.app/passport/madhubani-stole-77a1'
    );

    const shareUrl = whatsappService.getWhatsAppShareUrl({
      productTitle: 'Madhubani Handpainted Silk Stole',
      publicPassportUrl: 'https://karigarsaathi.web.app/passport/madhubani-stole-77a1',
    });

    expect(shareUrl).toContain('https://wa.me/?text=');
    expect(shareUrl).toContain(encodeURIComponent('https://karigarsaathi.web.app/passport/madhubani-stole-77a1'));
  });

  it('3. CSV cell sanitizer neutralizes dangerous formula injection characters', () => {
    // Formula triggers: =, +, -, @, tab, newline
    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvCell('+cmd|/c calc')).toBe("'+cmd|/c calc");
    expect(sanitizeCsvCell('-10+20')).toBe("'-10+20");
    expect(sanitizeCsvCell('@IMPORTXML("http://evil.com")')).toBe('"\'@IMPORTXML(""http://evil.com"")"');
  });

  it('4. CSV cell sanitizer properly escapes commas and double quotes', () => {
    expect(sanitizeCsvCell('Silk, Cotton & Zari')).toBe('"Silk, Cotton & Zari"');
    expect(sanitizeCsvCell('Traditional "Kohbar" Motif')).toBe('"Traditional ""Kohbar"" Motif"');
  });

  it('5. Full CSV export includes schema version and expected columns', () => {
    const row = csvExportService.draftToCsvRow(sampleDraft, undefined, 'https://karigarsaathi.web.app/passport/sample');
    const csv = csvExportService.generateCsvContent([row]);

    expect(csv).toContain('product_reference,title,description,category');
    expect(csv).toContain(CSV_SCHEMA_VERSION);
    expect(csv).toContain('Madhubani Handpainted Silk Stole');
    expect(csv).toContain('4200');
    expect(csv.startsWith('\uFEFF')).toBe(true); // UTF-8 BOM present
  });

  it('6. Structured JSON matches versioned schema and claims prepared_only', () => {
    const exportObj = jsonExportService.generateStructuredExport([sampleDraft]);

    expect(exportObj.schema).toBe(JSON_SCHEMA_NAME);
    expect(exportObj.version).toBe(JSON_SCHEMA_VERSION);
    expect(exportObj.source.platform).toBe('KarigarSaathi');
    expect(exportObj.source.publicationClaim).toBe('prepared_only');
    expect(exportObj.products).toHaveLength(1);
    expect(exportObj.products[0].title).toBe('Madhubani Handpainted Silk Stole');
    expect(exportObj.products[0].pricing?.price).toBe(4200);
  });

  it('7. Idempotency service prevents duplicate audit logs in rapid succession', () => {
    const key = exportAuditService.getIdempotencyKey('user_1', 'prod_1', 'csv', 'downloaded');

    const firstCall = exportAuditService.isDuplicate(key);
    expect(firstCall).toBe(false);

    // Immediate second call should be recognized as duplicate
    const secondCall = exportAuditService.isDuplicate(key);
    expect(secondCall).toBe(true);
  });
});
