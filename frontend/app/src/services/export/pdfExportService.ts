/**
 * PDF Export Service for KarigarSaathi Bulk Buyer Spec Sheets & Catalogues
 * Generates beautifully formatted, printable single-product spec sheets and multi-product catalogues.
 */

import { SanitizedPassportData, ProductDraft } from '@/types';
import { qrService } from '@/services/export/qrService';

export interface PDFExportItem {
  draft: ProductDraft;
  publicData?: SanitizedPassportData;
  publicUrl?: string;
  qrDataUrl?: string;
}

export const pdfExportService = {
  /**
   * Generates the printable HTML container and triggers clean browser print-to-PDF.
   */
  async exportToPrintablePdf(items: PDFExportItem[], catalogueTitle = 'Craft Catalogue'): Promise<void> {
    if (typeof document === 'undefined') return;

    // Generate QR Data URLs if not present
    for (const item of items) {
      if (item.publicUrl && !item.qrDataUrl) {
        try {
          item.qrDataUrl = await qrService.generateQRCodeDataUrl(item.publicUrl, { scale: 6, margin: 2 });
        } catch {
          item.qrDataUrl = await qrService.generateQRCodeSvgDataUrl(item.publicUrl, { scale: 6, margin: 2 });
        }
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const now = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pagesHtml = items.map((item, idx) => {
      const { draft, publicData, publicUrl, qrDataUrl } = item;
      const title = publicData?.title || draft.title;
      const category = publicData?.category || draft.category || 'Handmade Craft';
      const technique = publicData?.technique || draft.technique || draft.craftType || 'Traditional Craft';
      const materials = (publicData?.materials || draft.materials || []).join(', ');
      const dimensions = publicData?.dimensions || draft.dimensions || 'Standard handloom dimension';
      const story = publicData?.description || draft.story || draft.description;
      const price = publicData?.price !== undefined ? publicData.price : draft.selectedPrice;
      const currency = publicData?.currency || draft.currency || 'INR';
      const artisanName = publicData?.artisanName;
      const location = [publicData?.district, publicData?.state || draft.origin].filter(Boolean).join(', ');
      const care = publicData?.careInstructions || draft.careInstructions || 'Handle with care. Dry clean or gentle hand wash.';
      const ref = draft.sku || draft.id;
      const coverPhoto = publicData?.photos?.[0] || draft.photos?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c';

      return `
        <div class="page-container ${idx > 0 ? 'page-break' : ''}">
          <!-- Header -->
          <div class="header">
            <div class="brand">
              <div class="logo-circle">KS</div>
              <div>
                <div class="brand-title">KarigarSaathi</div>
                <div class="brand-sub">Verified Indian Craft Heritage & Provenance</div>
              </div>
            </div>
            <div class="doc-meta">
              <div class="doc-badge">AUTHENTIC CRAFT SPECIFICATION</div>
              <div class="doc-date">Generated: ${now}</div>
            </div>
          </div>

          <!-- Product Main Showcase -->
          <div class="showcase-grid">
            <div class="image-column">
              <div class="image-wrapper">
                <img src="${coverPhoto}" alt="${title}" class="product-img" />
              </div>
              ${qrDataUrl ? `
                <div class="qr-box">
                  <img src="${qrDataUrl}" alt="Craft Passport QR" class="qr-img" />
                  <div class="qr-caption">
                    <strong>Scan for Live Passport</strong>
                    <span>${publicUrl || 'Verified Digital Authenticity'}</span>
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="details-column">
              <div class="category-tag">${category.toUpperCase()} • ${technique.toUpperCase()}</div>
              <h1 class="product-heading">${title}</h1>

              ${price !== undefined ? `
                <div class="price-box">
                  <span class="price-label">Fair Trade Wholesale / Retail Price:</span>
                  <span class="price-value">${currency} ${price.toLocaleString('en-IN')}</span>
                </div>
              ` : ''}

              <!-- Specs Table -->
              <table class="specs-table">
                <tbody>
                  <tr>
                    <th>Product Code</th>
                    <td><code>${ref}</code></td>
                  </tr>
                  ${artisanName ? `
                    <tr>
                      <th>Artisan / Cluster</th>
                      <td><strong>${artisanName}</strong> ${location ? `(${location})` : ''}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <th>Craft Technique</th>
                    <td>${technique}</td>
                  </tr>
                  <tr>
                    <th>Raw Materials</th>
                    <td>${materials || 'Natural Fibres / Traditional Materials'}</td>
                  </tr>
                  <tr>
                    <th>Dimensions</th>
                    <td>${dimensions}</td>
                  </tr>
                  <tr>
                    <th>Care Instructions</th>
                    <td>${care}</td>
                  </tr>
                </tbody>
              </table>

              ${story ? `
                <div class="story-box">
                  <div class="story-title">Craft Heritage & Provenance</div>
                  <div class="story-text">"${story}"</div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Footer & Disclaimer -->
          <div class="footer">
            <p><strong>Notice to Buyers:</strong> Each item is authentically handmade by rural master artisans. Natural variations in weave, dye, and texture are celebrated hallmarks of artisanal craft. Availability, lead times, and shipping terms must be confirmed directly with the artisan or verified coordinator.</p>
            <div class="footer-meta">
              <span>Passport Reference: ${draft.passportId || 'KP-VERIFIED'}</span>
              <span>Page ${idx + 1} of ${items.length}</span>
            </div>
          </div>
        </div>
      `;
    }).join('\n');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${catalogueTitle} - KarigarSaathi</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');
          
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1E1915;
            background: #FFFFFF;
            font-size: 11pt;
            line-height: 1.4;
          }
          .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 16mm 18mm;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
          }
          .page-break {
            page-break-before: always;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #E8E0D5;
            padding-bottom: 12px;
            margin-bottom: 18px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-circle {
            width: 38px;
            height: 38px;
            border-radius: 8px;
            background: #78350F;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14pt;
          }
          .brand-title {
            font-size: 14pt;
            font-weight: 800;
            color: #78350F;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 7.5pt;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-meta {
            text-align: right;
          }
          .doc-badge {
            font-size: 7pt;
            font-weight: 700;
            background: #FEF3C7;
            color: #92400E;
            padding: 3px 8px;
            border-radius: 4px;
            display: inline-block;
            margin-bottom: 4px;
            border: 1px solid #FDE68A;
          }
          .doc-date {
            font-size: 7.5pt;
            color: #6B7280;
          }
          .showcase-grid {
            display: grid;
            grid-template-columns: 75mm 1fr;
            gap: 16mm;
            align-items: start;
            flex: 1;
          }
          .image-column {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .image-wrapper {
            width: 100%;
            height: 80mm;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #E5E7EB;
            background: #F9FAFB;
          }
          .product-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .qr-box {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            background: #FDFBF7;
            border: 1px solid #E8E0D5;
            border-radius: 8px;
          }
          .qr-img {
            width: 50px;
            height: 50px;
            flex-shrink: 0;
          }
          .qr-caption {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .qr-caption strong {
            font-size: 8pt;
            color: #1E1915;
          }
          .qr-caption span {
            font-size: 6.5pt;
            color: #6B7280;
            word-break: break-all;
          }
          .category-tag {
            font-size: 8pt;
            font-weight: 700;
            color: #92400E;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .product-heading {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 18pt;
            font-weight: 700;
            color: #1E1915;
            line-height: 1.25;
            margin-bottom: 12px;
          }
          .price-box {
            display: flex;
            align-items: baseline;
            gap: 8px;
            padding: 8px 12px;
            background: #F3F4F6;
            border-radius: 6px;
            margin-bottom: 14px;
          }
          .price-label {
            font-size: 8pt;
            color: #4B5563;
          }
          .price-value {
            font-size: 13pt;
            font-weight: 800;
            color: #78350F;
          }
          .specs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-bottom: 14px;
          }
          .specs-table th {
            text-align: left;
            padding: 5px 0;
            color: #6B7280;
            font-weight: 600;
            width: 34%;
            vertical-align: top;
            border-bottom: 1px solid #F3F4F6;
          }
          .specs-table td {
            padding: 5px 0;
            color: #1E1915;
            vertical-align: top;
            border-bottom: 1px solid #F3F4F6;
          }
          .specs-table code {
            font-family: monospace;
            background: #E5E7EB;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 8pt;
          }
          .story-box {
            background: #FAF7F2;
            border-left: 3px solid #D97706;
            padding: 8px 12px;
            border-radius: 0 6px 6px 0;
            margin-top: 6px;
          }
          .story-title {
            font-size: 8pt;
            font-weight: 700;
            color: #92400E;
            margin-bottom: 3px;
          }
          .story-text {
            font-family: 'Playfair Display', Georgia, serif;
            font-style: italic;
            font-size: 8.5pt;
            color: #4B5563;
            line-height: 1.4;
          }
          .footer {
            border-top: 1px solid #E5E7EB;
            padding-top: 10px;
            margin-top: 16px;
          }
          .footer p {
            font-size: 6.8pt;
            color: #6B7280;
            line-height: 1.35;
          }
          .footer-meta {
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            color: #9CA3AF;
            margin-top: 6px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-container { margin: 0; padding: 12mm 14mm; }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  },
};
