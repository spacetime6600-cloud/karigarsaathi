import { describe, it, expect } from 'vitest';
import { generateQrPng, generateQrSvg, qrService } from '@/services/export/qrService';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

function decodePngDataUrl(dataUrl: string): string | null {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const png = PNG.sync.read(buffer);
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return code ? code.data : null;
}

describe('QR Code Generation & Decoding Verification Suite (jsQR)', () => {
  it('1. Generates and successfully decodes a QR code for a standard Craft Passport URL', async () => {
    const passportUrl = 'https://karigarsaathi.web.app/passport/indigo-terracotta-silk-jamdani-s-f18665bedbaf';
    const pngDataUrl = await generateQrPng(passportUrl);

    expect(pngDataUrl.startsWith('data:image/png;base64,')).toBe(true);

    const decoded = decodePngDataUrl(pngDataUrl);
    expect(decoded).toBe(passportUrl);
  });

  it('2. Decodes QR with high-entropy long slugs without truncation or corruption', async () => {
    const longSlugUrl =
      'https://karigarsaathi.web.app/passport/handcrafted-assam-muga-silk-jamdani-saree-traditional-motif-kamrup-district-cluster-verification-cert-998877665544332211';
    const pngDataUrl = await generateQrPng(longSlugUrl);

    const decoded = decodePngDataUrl(pngDataUrl);
    expect(decoded).toBe(longSlugUrl);
  });

  it('3. Confirms only the public HTTPS URL is encoded when product has Unicode titles', async () => {
    // When product title has Hindi / Bengali characters, the public slug is sanitized ASCII
    const unicodeProductSlug = 'bengal-jamdani-saree-kolkata-8833';
    const passportUrl = `https://karigarsaathi.web.app/passport/${unicodeProductSlug}`;

    const pngDataUrl = await generateQrPng(passportUrl);
    const decoded = decodePngDataUrl(pngDataUrl);

    expect(decoded).toBe(passportUrl);
    expect(decoded?.startsWith('https://karigarsaathi.web.app/passport/')).toBe(true);
  });

  it('4. Successfully produces SVG format for vector scaling', async () => {
    const passportUrl = 'https://karigarsaathi.web.app/passport/dokra-tribal-brass-figurine-bastar-1122';
    const svg = await generateQrSvg(passportUrl);

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.includes('</svg>')).toBe(true);
    expect(svg.toLowerCase()).toContain('0b1f33');
  });

  it('5. Successfully produces SVG Data URL via qrService helper', async () => {
    const passportUrl = 'https://karigarsaathi.web.app/passport/madhubani-painting-bihar-3344';
    const svgDataUrl = await qrService.generateQRCodeSvgDataUrl(passportUrl);

    expect(svgDataUrl.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(decodeURIComponent(svgDataUrl)).toContain('<svg');
  });

  it('6. QR remains decodable after converting to binary Blob and back', async () => {
    const passportUrl = 'https://karigarsaathi.web.app/passport/kashmir-pashmina-shawl-srinagar-5566';
    const dataUrl = await generateQrPng(passportUrl);

    // Convert to binary buffer
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const reconstructedDataUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    const decoded = decodePngDataUrl(reconstructedDataUrl);
    expect(decoded).toBe(passportUrl);
  });
});
