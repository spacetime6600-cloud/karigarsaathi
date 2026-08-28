/**
 * WhatsApp Sharing Service for KarigarSaathi Craft Passport
 * Generates properly formatted, URL-encoded sharing payloads exposing only approved fields.
 */

import { SanitizedPassportData } from '@/types';

export interface WhatsAppShareParams {
  productTitle: string;
  artisanName?: string;
  location?: string;
  publicPassportUrl: string;
  sanitizedData?: SanitizedPassportData;
}

export const whatsappService = {
  /**
   * Constructs the approved WhatsApp share message text.
   */
  formatShareMessage(params: WhatsAppShareParams): string {
    const { productTitle, artisanName, location, publicPassportUrl } = params;

    let provenancePart = 'handcrafted with certified heritage origin';
    if (artisanName && location) {
      provenancePart = `handcrafted by ${artisanName} from ${location}`;
    } else if (artisanName) {
      provenancePart = `handcrafted by ${artisanName}`;
    } else if (location) {
      provenancePart = `handcrafted in ${location}`;
    }

    return `Discover ${productTitle}, ${provenancePart}. View its Craft Passport and send an enquiry: ${publicPassportUrl}`;
  },

  /**
   * Generates the encoded WhatsApp link.
   */
  getWhatsAppShareUrl(params: WhatsAppShareParams, recipientPhone?: string): string {
    const message = this.formatShareMessage(params);
    const encoded = encodeURIComponent(message);
    const cleanPhone = recipientPhone ? recipientPhone.replace(/[^0-9]/g, '') : '';

    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  },

  /**
   * Triggers native Web Share if available, otherwise opens WhatsApp deep link.
   */
  async shareOrRedirect(params: WhatsAppShareParams): Promise<'shared' | 'redirected' | 'copied'> {
    const message = this.formatShareMessage(params);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: params.productTitle,
          text: message,
          url: params.publicPassportUrl,
        });
        return 'shared';
      } catch {
        // User cancelled or share failed, fallback to deep link
      }
    }

    // Fallback: Open WhatsApp web / mobile
    const url = this.getWhatsAppShareUrl(params);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return 'redirected';
  },

  /**
   * Copies the share message text to clipboard.
   */
  async copyShareMessage(params: WhatsAppShareParams): Promise<boolean> {
    const message = this.formatShareMessage(params);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(message);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Copies the pure public Passport URL to clipboard.
   */
  async copyPublicUrl(publicUrl: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(publicUrl);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
};
