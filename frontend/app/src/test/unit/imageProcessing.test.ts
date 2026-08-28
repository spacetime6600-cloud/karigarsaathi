import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  MAX_IMAGES_PER_PRODUCT,
} from '@/services/media/imageProcessor';

describe('Local Image Processing & Validation Tests', () => {
  it('validates a valid JPEG file', () => {
    const file = new File(['mock data'], 'sample.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(file, 0);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('validates a valid PNG file', () => {
    const file = new File(['mock data'], 'sample.png', { type: 'image/png' });
    const result = validateImageFile(file, 2);
    expect(result.valid).toBe(true);
  });

  it('validates a valid WebP file', () => {
    const file = new File(['mock data'], 'sample.webp', { type: 'image/webp' });
    const result = validateImageFile(file, 4);
    expect(result.valid).toBe(true);
  });

  it('rejects an empty 0-byte file', () => {
    const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(file, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('0 bytes');
  });

  it('rejects unsupported file formats like GIF, SVG, PDF, EXE', () => {
    const gifFile = new File(['gif data'], 'anim.gif', { type: 'image/gif' });
    expect(validateImageFile(gifFile, 0).valid).toBe(false);

    const svgFile = new File(['<svg></svg>'], 'vector.svg', { type: 'image/svg+xml' });
    expect(validateImageFile(svgFile, 0).valid).toBe(false);

    const pdfFile = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateImageFile(pdfFile, 0).valid).toBe(false);
  });

  it('rejects files exceeding 10 MB limit', () => {
    const largeBlob = new Blob([new Uint8Array(11 * 1024 * 1024)]);
    const largeFile = new File([largeBlob], 'huge.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(largeFile, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10 MB');
  });

  it('rejects adding images when maximum count is reached (6 images)', () => {
    const file = new File(['data'], 'photo7.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(file, MAX_IMAGES_PER_PRODUCT);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Maximum of 6');
  });
});
