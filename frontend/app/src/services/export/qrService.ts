/**
 * QR Code Generation Service for KarigarSaathi Craft Passport
 * Generates industry-standard, high-fidelity scannable QR codes using QRCode (Model 2, Error Correction Level H).
 * Produces crisp Canvas rendering, SVG, Data URLs, and high-DPI PNG downloads.
 */

import QRCode from 'qrcode';

export interface QROptions {
  scale?: number;
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
}

/**
 * Generates a PNG Data URL for the QR code encoding the exact public Craft Passport URL.
 */
export async function generateQrPng(
  passportUrl: string,
  options: QROptions = {}
): Promise<string> {
  const { margin = 4, foregroundColor = '#0B1F33', backgroundColor = '#FFFFFF' } = options;
  return QRCode.toDataURL(passportUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 512,
    margin,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
  });
}

/**
 * Generates a scalable vector SVG string for the QR code.
 */
export async function generateQrSvg(
  passportUrl: string,
  options: QROptions = {}
): Promise<string> {
  const { margin = 4, foregroundColor = '#0B1F33', backgroundColor = '#FFFFFF' } = options;
  return QRCode.toString(passportUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    width: 512,
    margin,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
  });
}

export const qrService = {
  /**
   * Generates a PNG Data URL encoding the specified URL.
   */
  generateQRCodeDataUrl: generateQrPng,

  /**
   * Generates an SVG Data URL representation of the QR code.
   */
  generateQRCodeSvgDataUrl: async (passportUrl: string, options: QROptions = {}): Promise<string> => {
    const svgStr = await generateQrSvg(passportUrl, options);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
  },

  /**
   * Generates a high-DPI PNG Blob suitable for downloading.
   */
  generateHighDpiQrBlob: async (passportUrl: string): Promise<Blob> => {
    const dataUrl = await generateQrPng(passportUrl);
    const res = await fetch(dataUrl);
    return res.blob();
  },

  /**
   * Triggers an immediate browser file download for the QR Code PNG.
   */
  downloadQRCodePng: async (passportUrl: string, filename = 'craft-passport-qr.png'): Promise<void> => {
    const dataUrl = await generateQrPng(passportUrl);
    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
};
