/**
 * Structured JSON Export Service for KarigarSaathi Catalogue
 * Generates versioned, marketplace-neutral JSON with publicationClaim: "prepared_only".
 */

import { SanitizedPassportData, ProductDraft } from '@/types';

export const JSON_SCHEMA_NAME = 'karigarsaathi.catalogue-export';
export const JSON_SCHEMA_VERSION = '1.0.0';

export interface StructuredExportProduct {
  exportReference: string;
  title: string;
  titleHindi?: string;
  description?: string;
  descriptionHindi?: string;
  category?: string;
  subcategory?: string;
  craftTechnique?: string;
  materials?: string[];
  dimensions?: {
    raw?: string;
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  weight?: {
    value?: number;
    unit?: string;
  };
  careInstructions?: string;
  tags?: string[];
  pricing?: {
    price?: number;
    currency: string;
    pricingStrategy?: string;
  };
  inventory?: {
    stockQuantity?: number;
    sku?: string;
    customisationAvailable?: boolean;
    makingTime?: string;
  };
  images: Array<{
    url: string;
    isCover: boolean;
    altText: string;
  }>;
  artisanProvenance?: {
    artisanName?: string;
    story?: string;
    district?: string;
    state?: string;
    workshopName?: string;
    contactOption?: boolean;
  };
  craftPassport?: {
    passportId?: string;
    publicUrl?: string;
    slug?: string;
    verificationHash?: string;
  };
  consentSnapshotVersion?: number;
}

export interface StructuredCatalogueExport {
  schema: string;
  version: string;
  generatedAt: string;
  source: {
    platform: 'KarigarSaathi';
    publicationClaim: 'prepared_only';
    note: 'Prepared export only. Direct external publication requires authorized channel verification.';
  };
  products: StructuredExportProduct[];
}

// Deep clean object to remove undefined and null properties
function removeUndefinedAndNull<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedAndNull(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = removeUndefinedAndNull(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export const jsonExportService = {
  /**
   * Builds the versioned structured JSON payload.
   */
  generateStructuredExport(
    drafts: ProductDraft[],
    passportsData?: Record<string, { publicData?: SanitizedPassportData; publicUrl?: string; slug?: string; passportId?: string; snapshotVersion?: number }>
  ): StructuredCatalogueExport {
    const products: StructuredExportProduct[] = drafts.map((draft) => {
      const pData = passportsData ? passportsData[draft.id] : undefined;
      const publicData = pData?.publicData;

      const photos = publicData?.photos || (draft.photos || []).map((p) => p.url);
      const images = photos.map((url, idx) => ({
        url,
        isCover: idx === (draft.coverPhotoIndex || 0),
        altText: `${draft.title} - View ${idx + 1}`,
      }));

      const exportProduct: StructuredExportProduct = {
        exportReference: draft.sku || draft.id,
        title: publicData?.title || draft.title,
        titleHindi: publicData?.titleHindi || draft.titleHindi,
        description: publicData?.description || draft.story || draft.description,
        descriptionHindi: publicData?.descriptionHindi || draft.descriptionHindi,
        category: publicData?.category || draft.category,
        subcategory: publicData?.subcategory || draft.subcategory,
        craftTechnique: publicData?.technique || draft.technique || draft.craftType,
        materials: publicData?.materials || draft.materials,
        dimensions: {
          raw: publicData?.dimensions || draft.dimensions,
          length: draft.dimensionsObj?.length,
          width: draft.dimensionsObj?.width,
          height: draft.dimensionsObj?.height,
          unit: draft.dimensionsObj?.unit || 'cm',
        },
        weight: draft.weightObj ? { value: draft.weightObj.value, unit: draft.weightObj.unit } : undefined,
        careInstructions: publicData?.careInstructions || draft.careInstructions,
        tags: publicData?.tags || draft.tags,
        pricing: {
          price: publicData?.price !== undefined ? publicData.price : draft.selectedPrice,
          currency: publicData?.currency || draft.currency || 'INR',
          pricingStrategy: draft.pricingStrategy,
        },
        inventory: {
          stockQuantity: draft.stockQuantity,
          sku: draft.sku,
          customisationAvailable: draft.customisationAvailable,
          makingTime: draft.makingTime,
        },
        images,
        artisanProvenance: {
          artisanName: publicData?.artisanName,
          story: publicData?.artisanStory,
          district: publicData?.district,
          state: publicData?.state || draft.origin,
          workshopName: publicData?.workshopName,
          contactOption: publicData?.contactOption,
        },
        craftPassport: pData?.publicUrl ? {
          passportId: pData.passportId || draft.passportId,
          publicUrl: pData.publicUrl,
          slug: pData.slug,
          verificationHash: publicData?.verificationHash,
        } : undefined,
        consentSnapshotVersion: pData?.snapshotVersion || 1,
      };

      return removeUndefinedAndNull(exportProduct);
    });

    const exportData: StructuredCatalogueExport = {
      schema: JSON_SCHEMA_NAME,
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      source: {
        platform: 'KarigarSaathi',
        publicationClaim: 'prepared_only',
        note: 'Prepared export only. Direct external publication requires authorized channel verification.',
      },
      products,
    };

    return removeUndefinedAndNull(exportData);
  },

  /**
   * Formats JSON as pretty string and validates schema.
   */
  exportToJsonString(
    drafts: ProductDraft[],
    passportsData?: Record<string, { publicData?: SanitizedPassportData; publicUrl?: string; slug?: string; passportId?: string; snapshotVersion?: number }>
  ): string {
    const payload = this.generateStructuredExport(drafts, passportsData);
    return JSON.stringify(payload, null, 2);
  },

  /**
   * Triggers browser download of JSON file.
   */
  downloadJson(jsonString: string, fileName: string): void {
    const cleanName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });

    if (typeof document !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', cleanName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  },
};
