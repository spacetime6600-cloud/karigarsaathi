/**
 * Marketplace Preparation Adapters for KarigarSaathi
 * Provides preparation, schema validation, preview, and structured artifact export
 * for external e-commerce and government handloom channels (ONDC, Indiahandmade, GeM/ODOP).
 *
 * CRITICAL RULE: These adapters prepare export payloads honestly. They never claim or simulate
 * direct external submission without official, verified credentials and endpoints.
 */

import {
  MarketplaceChannel,
  AdapterCapability,
  AdapterValidationResult,
  PreparedChannelPayload,
  ExportArtifact,
  SubmissionResult,
  ProductDraft,
  SanitizedPassportData,
} from '@/types';

export interface MarketplaceAdapter {
  readonly id: string;
  readonly channel: MarketplaceChannel;
  readonly displayName: string;
  readonly channelDescription: string;
  getCapabilities(): AdapterCapability[];
  validate(draft: ProductDraft, publicData?: SanitizedPassportData): Promise<AdapterValidationResult>;
  prepare(draft: ProductDraft, publicData?: SanitizedPassportData, passportUrl?: string): Promise<PreparedChannelPayload>;
  export(payload: PreparedChannelPayload, fileName?: string): Promise<ExportArtifact>;
  redirectUrl?(payload: PreparedChannelPayload): string | null;
  submit?(payload: PreparedChannelPayload): Promise<SubmissionResult>;
  getConnectionStatus(): Promise<'not_configured' | 'configured' | 'verified'>;
}

// 1. ONDC Protocol Seller Adapter (Beckn Protocol v1.2.0)
export class ONDCAdapter implements MarketplaceAdapter {
  readonly id = 'adapter_ondc_v1';
  readonly channel: MarketplaceChannel = 'ondc';
  readonly displayName = 'ONDC Beckn Retail Protocol';
  readonly channelDescription = 'Open Network for Digital Commerce standardized retail catalog item schema.';

  getCapabilities(): AdapterCapability[] {
    return ['preview', 'validate', 'export'];
  }

  async validate(draft: ProductDraft, publicData?: SanitizedPassportData): Promise<AdapterValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const title = publicData?.title || draft.title;
    if (!title || title.trim().length < 3) errors.push('ONDC requires a title of at least 3 characters.');
    if (!draft.sku && !draft.id) errors.push('ONDC requires a unique item SKU/ID.');

    const price = publicData?.price !== undefined ? publicData.price : draft.selectedPrice;
    if (price === undefined || price <= 0) errors.push('ONDC requires a positive retail price (INR).');

    const photos = publicData?.photos || (draft.photos || []).map((p) => p.url);
    if (photos.length === 0) errors.push('ONDC requires at least one product image URL.');

    if (!draft.dimensions) warnings.push('Providing packaged dimensions improves ONDC logistics estimation.');

    return {
      valid: errors.length === 0,
      channel: 'ondc',
      errors,
      warnings,
      readyForExport: errors.length === 0,
    };
  }

  async prepare(draft: ProductDraft, publicData?: SanitizedPassportData, passportUrl?: string): Promise<PreparedChannelPayload> {
    const title = publicData?.title || draft.title;
    const description = publicData?.description || draft.story || draft.description;
    const price = publicData?.price !== undefined ? publicData.price : draft.selectedPrice;
    const photos = publicData?.photos || (draft.photos || []).map((p) => p.url);

    const ondcItem = {
      context: {
        domain: 'nic2004:52110', // Retail Handloom / Handicrafts
        action: 'on_search',
        version: '1.2.0',
        bap_id: 'buyer-app-preview.karigarsaathi.local',
        bpp_id: 'seller-adapter.karigarsaathi.local',
        timestamp: new Date().toISOString(),
      },
      message: {
        catalog: {
          'bpp/descriptor': {
            name: publicData?.workshopName || 'KarigarSaathi Certified Artisan Workshop',
            short_desc: 'Authentic Indian Handcrafted Products',
          },
          'bpp/providers': [
            {
              id: draft.artisanId || draft.ownerId || 'artisan_provider',
              descriptor: {
                name: publicData?.artisanName || 'Master Artisan',
              },
              items: [
                {
                  id: draft.sku || draft.id,
                  descriptor: {
                    name: title,
                    short_desc: description?.slice(0, 100) || '',
                    long_desc: description || '',
                    images: photos,
                  },
                  price: {
                    currency: 'INR',
                    value: String(price),
                  },
                  category_id: publicData?.category || draft.category || 'Handloom Textiles',
                  fulfillment_id: 'fulfilment-standard-craft',
                  tags: [
                    {
                      code: 'origin',
                      list: [
                        { code: 'state', value: publicData?.state || draft.origin || 'India' },
                        { code: 'craft_type', value: publicData?.technique || draft.craftType || 'Handmade' },
                      ],
                    },
                    {
                      code: 'provenance',
                      list: [
                        { code: 'craft_passport_url', value: passportUrl || '' },
                        { code: 'verified_handcrafted', value: 'true' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };

    return {
      channel: 'ondc',
      schemaVersion: 'beckn.retail/1.2.0',
      payload: ondcItem,
      generatedAt: new Date().toISOString(),
    };
  }

  async export(payload: PreparedChannelPayload, fileName = 'ondc-catalog-item.json'): Promise<ExportArtifact> {
    const data = JSON.stringify(payload, null, 2);
    return {
      format: 'json',
      fileName,
      mimeType: 'application/json',
      data,
    };
  }

  async submit(): Promise<SubmissionResult> {
    return {
      success: false,
      channel: 'ondc',
      status: 'not_configured',
      message: 'Export prepared — external submission not connected. ONDC BAP/BPP gateway connection is not live.',
    };
  }

  async getConnectionStatus(): Promise<'not_configured'> {
    return 'not_configured';
  }
}

// 2. Indiahandmade Portal Adapter (Ministry of Textiles)
export class IndiahandmadeAdapter implements MarketplaceAdapter {
  readonly id = 'adapter_indiahandmade_v1';
  readonly channel: MarketplaceChannel = 'indiahandmade';
  readonly displayName = 'Indiahandmade (Ministry of Textiles)';
  readonly channelDescription = 'Official e-commerce portal format for Indian Artisans and Weavers.';

  getCapabilities(): AdapterCapability[] {
    return ['preview', 'validate', 'export', 'redirect'];
  }

  async validate(draft: ProductDraft, publicData?: SanitizedPassportData): Promise<AdapterValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!publicData?.title && !draft.title) errors.push('Product name is mandatory.');
    if (!publicData?.technique && !draft.technique && !draft.craftType) errors.push('Craft cluster or technique is required.');
    if (!publicData?.materials && (!draft.materials || draft.materials.length === 0)) errors.push('Raw materials specification is mandatory.');

    const price = publicData?.price !== undefined ? publicData.price : draft.selectedPrice;
    if (price === undefined || price <= 0) errors.push('Valid Indian Rupee price is required.');

    return {
      valid: errors.length === 0,
      channel: 'indiahandmade',
      errors,
      warnings,
      readyForExport: errors.length === 0,
    };
  }

  async prepare(draft: ProductDraft, publicData?: SanitizedPassportData, passportUrl?: string): Promise<PreparedChannelPayload> {
    const item = {
      portal: 'Indiahandmade.com - Ministry of Textiles & Handicrafts',
      submissionType: 'Artisan Batch Preparation',
      productDetails: {
        artisanName: publicData?.artisanName || 'Registered Artisan',
        craftType: publicData?.technique || draft.technique || draft.craftType,
        productName: publicData?.title || draft.title,
        productNameHindi: publicData?.titleHindi || draft.titleHindi,
        story: publicData?.description || draft.story || draft.description,
        materials: publicData?.materials || draft.materials,
        originState: publicData?.state || draft.origin,
        priceInr: publicData?.price !== undefined ? publicData.price : draft.selectedPrice,
        careInstructions: publicData?.careInstructions || draft.careInstructions,
        passportVerificationUrl: passportUrl || '',
      },
      exportTimestamp: new Date().toISOString(),
      disclaimer: 'Prepared for artisan portal upload. Direct API submission requires official Ministry authentication.',
    };

    return {
      channel: 'indiahandmade',
      schemaVersion: 'indiahandmade.spec/1.0',
      payload: item,
      generatedAt: new Date().toISOString(),
    };
  }

  async export(payload: PreparedChannelPayload, fileName = 'indiahandmade-submission.json'): Promise<ExportArtifact> {
    return {
      format: 'json',
      fileName,
      mimeType: 'application/json',
      data: JSON.stringify(payload, null, 2),
    };
  }

  redirectUrl(): string {
    return 'https://indiahandmade.com/artisan-login';
  }

  async submit(): Promise<SubmissionResult> {
    return {
      success: false,
      channel: 'indiahandmade',
      status: 'not_configured',
      message: 'Export prepared — external submission not connected. Please upload the prepared export file via the Indiahandmade artisan portal.',
    };
  }

  async getConnectionStatus(): Promise<'not_configured'> {
    return 'not_configured';
  }
}

// 3. GeM / ODOP Adapter (Government e-Marketplace One District One Product)
export class GeMODOPAdapter implements MarketplaceAdapter {
  readonly id = 'adapter_gem_odop_v1';
  readonly channel: MarketplaceChannel = 'gem_odop';
  readonly displayName = 'GeM ODOP Handloom Category';
  readonly channelDescription = 'Government e-Marketplace ODOP standardized catalogue specification.';

  getCapabilities(): AdapterCapability[] {
    return ['preview', 'validate', 'export'];
  }

  async validate(draft: ProductDraft, publicData?: SanitizedPassportData): Promise<AdapterValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!publicData?.title && !draft.title) errors.push('GeM listing requires standardized title.');
    if (!publicData?.district && !draft.origin) errors.push('GeM ODOP requires district and state identification.');
    if (!draft.sku) warnings.push('Government procurement recommends HSN / SKU tagging.');

    return {
      valid: errors.length === 0,
      channel: 'gem_odop',
      errors,
      warnings,
      readyForExport: errors.length === 0,
    };
  }

  async prepare(draft: ProductDraft, publicData?: SanitizedPassportData, passportUrl?: string): Promise<PreparedChannelPayload> {
    const gemSpec = {
      governmentPortal: 'GeM - One District One Product (ODOP)',
      category: 'Handicrafts & Handlooms',
      productName: publicData?.title || draft.title,
      district: publicData?.district || 'Kamrup',
      state: publicData?.state || draft.origin || 'Assam',
      craftTradition: publicData?.technique || draft.technique || draft.craftType,
      unitPriceInr: publicData?.price !== undefined ? publicData.price : draft.selectedPrice,
      dimensions: publicData?.dimensions || draft.dimensions,
      rawMaterialOrigin: (publicData?.materials || draft.materials || []).join(', '),
      craftPassportProof: passportUrl || '',
      submissionStatus: 'PREPARATION_ONLY',
    };

    return {
      channel: 'gem_odop',
      schemaVersion: 'gem.odop.handloom/2.0',
      payload: gemSpec,
      generatedAt: new Date().toISOString(),
    };
  }

  async export(payload: PreparedChannelPayload, fileName = 'gem-odop-product-spec.json'): Promise<ExportArtifact> {
    return {
      format: 'json',
      fileName,
      mimeType: 'application/json',
      data: JSON.stringify(payload, null, 2),
    };
  }

  async submit(): Promise<SubmissionResult> {
    return {
      success: false,
      channel: 'gem_odop',
      status: 'not_configured',
      message: 'Export prepared — external submission not connected. GeM seller portal integration requires authenticated departmental credentials.',
    };
  }

  async getConnectionStatus(): Promise<'not_configured'> {
    return 'not_configured';
  }
}

// 4. Generic Marketplace JSON-LD Adapter
export class GenericMarketplaceAdapter implements MarketplaceAdapter {
  readonly id = 'adapter_generic_jsonld';
  readonly channel: MarketplaceChannel = 'generic';
  readonly displayName = 'Schema.org JSON-LD (Search & E-commerce)';
  readonly channelDescription = 'Standard Schema.org Product markup suitable for any modern e-commerce platform and search crawlers.';

  getCapabilities(): AdapterCapability[] {
    return ['preview', 'validate', 'export'];
  }

  async validate(draft: ProductDraft): Promise<AdapterValidationResult> {
    return {
      valid: Boolean(draft.title),
      channel: 'generic',
      errors: draft.title ? [] : ['Product title required for Schema.org markup.'],
      warnings: [],
      readyForExport: Boolean(draft.title),
    };
  }

  async prepare(draft: ProductDraft, publicData?: SanitizedPassportData, passportUrl?: string): Promise<PreparedChannelPayload> {
    const title = publicData?.title || draft.title;
    const description = publicData?.description || draft.story || draft.description;
    const price = publicData?.price !== undefined ? publicData.price : draft.selectedPrice;
    const photos = publicData?.photos || (draft.photos || []).map((p) => p.url);

    const schemaOrgJsonLd = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: title,
      image: photos,
      description: description,
      sku: draft.sku || draft.id,
      brand: {
        '@type': 'Brand',
        name: publicData?.workshopName || 'KarigarSaathi Handcrafted',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: publicData?.currency || draft.currency || 'INR',
        price: price,
        availability: 'https://schema.org/InStock',
        url: passportUrl,
      },
      material: (publicData?.materials || draft.materials || []).join(', '),
      productionDate: draft.createdAt,
    };

    return {
      channel: 'generic',
      schemaVersion: 'schema.org/Product/1.0',
      payload: schemaOrgJsonLd,
      generatedAt: new Date().toISOString(),
    };
  }

  async export(payload: PreparedChannelPayload, fileName = 'schema-org-product.json'): Promise<ExportArtifact> {
    return {
      format: 'json',
      fileName,
      mimeType: 'application/ld+json',
      data: JSON.stringify(payload, null, 2),
    };
  }

  async submit(): Promise<SubmissionResult> {
    return {
      success: false,
      channel: 'generic',
      status: 'unsupported_capability',
      message: 'Schema.org JSON-LD is a standard data format for embedding and does not support direct submission.',
    };
  }

  async getConnectionStatus(): Promise<'not_configured'> {
    return 'not_configured';
  }
}

export const marketplaceAdapters: Record<MarketplaceChannel, MarketplaceAdapter> = {
  ondc: new ONDCAdapter(),
  indiahandmade: new IndiahandmadeAdapter(),
  gem_odop: new GeMODOPAdapter(),
  generic: new GenericMarketplaceAdapter(),
};
