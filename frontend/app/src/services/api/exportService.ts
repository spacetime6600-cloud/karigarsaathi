import { CraftPassport } from '@/types';

export interface ExportOption {
  id: 'whatsapp' | 'pdf_tags' | 'copy_link' | 'instagram';
  title: string;
  description: string;
  iconName: string;
}

export const exportService = {
  getExportOptions(): ExportOption[] {
    return [
      {
        id: 'whatsapp',
        title: 'Share WhatsApp Product Card',
        description: 'Send high-res photo, verified price, and direct Craft Passport link to buyer contacts.',
        iconName: 'share',
      },
      {
        id: 'pdf_tags',
        title: 'Printable QR Craft Tags (PDF)',
        description: 'Download print-ready tag sheets with QR codes for attaching to physical craft items.',
        iconName: 'picture_as_pdf',
      },
      {
        id: 'copy_link',
        title: 'Copy Public Passport Link',
        description: 'Get verified web link to paste in emails, catalogs, or messaging apps.',
        iconName: 'link',
      },
      {
        id: 'instagram',
        title: 'Social Story Asset',
        description: 'Download optimized 9:16 story image featuring artisan provenance and QR badge.',
        iconName: 'photo_camera',
      },
    ];
  },

  formatWhatsAppMessage(passport: CraftPassport): string {
    return encodeURIComponent(
      `🙏 Namaste!\n\nCheck out this handcrafted *${passport.productTitle}* made by *${passport.artisanName}*.\n\n` +
      `✨ *Craft Heritage:* ${passport.technique}\n` +
      `📍 *Origin:* ${passport.origin}\n` +
      (passport.publicPrice ? `💰 *Price:* ₹${passport.publicPrice.toLocaleString('en-IN')}\n\n` : '\n') +
      `🔍 *Verify Digital Craft Passport:* ${passport.publicUrl}\n\n` +
      `Directly supported through KarigarSaathi.`
    );
  },
};
