/**
 * CSV Export Service for KarigarSaathi Catalogue
 * Generates standards-compliant UTF-8 CSV with Formula Injection Defense.
 */

import { SanitizedPassportData, ProductDraft, ProductLifecycleStatus } from '@/types';

export const CSV_SCHEMA_VERSION = 'karigarsaathi.catalogue-csv/v1.0.0';

export interface CSVProductRowInput {
  productReference: string;
  title: string;
  description?: string;
  category?: string;
  materials?: string[];
  dimensions?: string;
  craftProcess?: string;
  careInstructions?: string;
  tags?: string[];
  price?: number;
  currency?: string;
  artisanDisplayName?: string;
  district?: string;
  state?: string;
  passportUrl?: string;
  imageUrls?: string[];
  lifecycleStatus?: ProductLifecycleStatus;
  exportedAt?: string;
}

/**
 * Sanitizes and neutralizes CSV cell values to prevent CSV Formula Injection (CWE-1236).
 * Prepends single quote (') if the cell value starts with dangerous prefix characters.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Strip carriage returns
  str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Neutralize formula injection triggers: =, +, -, @, tab, or newline
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\n'];
  const trimmed = str.trimStart();
  if (dangerousPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
    str = `'${str}`;
  }

  // If contains delimiter, quote, or newline, escape and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export const csvExportService = {
  /**
   * Generates CSV content string from an array of product inputs.
   */
  generateCsvContent(rows: CSVProductRowInput[]): string {
    const headers = [
      'product_reference',
      'title',
      'description',
      'category',
      'materials',
      'dimensions',
      'craft_process',
      'care_instructions',
      'tags',
      'price',
      'currency',
      'artisan_display_name',
      'district',
      'state',
      'passport_url',
      'image_urls',
      'lifecycle_status',
      'exported_at',
      'schema_version',
    ];

    const now = new Date().toISOString();

    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const line = [
        sanitizeCsvCell(row.productReference),
        sanitizeCsvCell(row.title),
        sanitizeCsvCell(row.description || ''),
        sanitizeCsvCell(row.category || ''),
        sanitizeCsvCell((row.materials || []).join('; ')),
        sanitizeCsvCell(row.dimensions || ''),
        sanitizeCsvCell(row.craftProcess || ''),
        sanitizeCsvCell(row.careInstructions || ''),
        sanitizeCsvCell((row.tags || []).join('; ')),
        sanitizeCsvCell(typeof row.price === 'number' ? row.price : ''),
        sanitizeCsvCell(row.currency || 'INR'),
        sanitizeCsvCell(row.artisanDisplayName || ''),
        sanitizeCsvCell(row.district || ''),
        sanitizeCsvCell(row.state || ''),
        sanitizeCsvCell(row.passportUrl || ''),
        sanitizeCsvCell((row.imageUrls || []).join('; ')),
        sanitizeCsvCell(row.lifecycleStatus || 'ready'),
        sanitizeCsvCell(row.exportedAt || now),
        sanitizeCsvCell(CSV_SCHEMA_VERSION),
      ];
      csvLines.push(line.join(','));
    }

    // Return with UTF-8 Byte Order Mark (BOM) for correct Excel encoding
    return '\uFEFF' + csvLines.join('\n');
  },

  /**
   * Converts a product draft and its public data into CSV row input.
   */
  draftToCsvRow(draft: ProductDraft, publicData?: SanitizedPassportData, publicUrl?: string): CSVProductRowInput {
    return {
      productReference: draft.sku || draft.id,
      title: publicData?.title || draft.title,
      description: publicData?.description || draft.story || draft.description,
      category: publicData?.category || draft.category,
      materials: publicData?.materials || draft.materials,
      dimensions: publicData?.dimensions || draft.dimensions,
      craftProcess: publicData?.technique || draft.technique || draft.craftType,
      careInstructions: publicData?.careInstructions || draft.careInstructions,
      tags: publicData?.tags || draft.tags,
      price: publicData?.price !== undefined ? publicData.price : draft.selectedPrice,
      currency: publicData?.currency || draft.currency || 'INR',
      artisanDisplayName: publicData?.artisanName,
      district: publicData?.district,
      state: publicData?.state || draft.origin,
      passportUrl: publicUrl,
      imageUrls: publicData?.photos || (draft.photos || []).map((p) => p.url),
      lifecycleStatus: draft.lifecycleStatus || 'ready',
      exportedAt: new Date().toISOString(),
    };
  },

  /**
   * Triggers a browser download of the CSV file.
   */
  downloadCsv(csvContent: string, fileName: string): void {
    const cleanName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

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
