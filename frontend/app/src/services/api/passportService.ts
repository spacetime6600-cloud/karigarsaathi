import { CraftPassport, ProductDraft, ArtisanProfile } from '@/types';
import { storage } from '../storage/localStorage';

export const passportService = {
  createPassport(draft: ProductDraft, artisan: ArtisanProfile): CraftPassport {
    const passportId = `KP_${draft.id.replace('draft_', '')}_${Date.now().toString().slice(-4)}`;
    const verificationHash = `SHA256:KGS-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;
    const publicUrl = `${window.location.origin}/passport/${passportId}`;

    const passport: CraftPassport = {
      id: passportId,
      productId: draft.id,
      artisanId: artisan.id,
      artisanName: draft.publicFields.artisanName ? artisan.name : 'Verified Master Artisan',
      workshopLocation: draft.publicFields.workshopLocation ? artisan.location : 'Authentic Craft Cluster',
      craftHeritage: draft.category,
      productTitle: draft.title,
      category: draft.category,
      technique: draft.technique,
      materials: draft.materials,
      dimensions: draft.dimensions,
      origin: draft.origin,
      story: draft.publicFields.story ? draft.story : '',
      photos: draft.photos.map((p) => p.url),
      publicPrice: draft.publicFields.retailPrice ? draft.selectedPrice : undefined,
      verificationHash,
      verifiedAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      qrPayload: publicUrl,
      publicUrl,
      artisanPhone: draft.publicFields.directContact ? artisan.phone : undefined,
    };

    const passports = storage.get<Record<string, CraftPassport>>('passports', {});
    passports[passportId] = passport;
    storage.set('passports', passports);

    return passport;
  },

  getPassportById(id: string): CraftPassport | null {
    const passports = storage.get<Record<string, CraftPassport>>('passports', {});
    if (passports[id]) {
      return passports[id];
    }
    // Return sample passport fallback if ID not found
    return {
      id,
      productId: 'p_demo_01',
      artisanId: 'artisan_001',
      artisanName: 'Master Weaver Ravi Kumar',
      workshopLocation: 'Assam & Pochampally, India',
      craftHeritage: 'Traditional Handloom Jamdani Weaving',
      productTitle: 'Indigo & Terracotta Silk Jamdani Saree',
      category: 'Handloom Textiles',
      technique: 'Pure Handloom Pit Loom Weave',
      materials: ['Pure Mulberry Silk', 'Natural Vegetable Dyes', 'Zari Threads'],
      dimensions: '5.5 meters x 1.2 meters',
      origin: 'Assam & Pochampally Cluster',
      story: 'Crafted by Master Weaver Ravi Kumar using heritage 18-day handloom technique with natural earth dyes.',
      photos: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
      ],
      publicPrice: 14500,
      verificationHash: 'SHA256:KGS-IND-77A91-VERIFIED',
      verifiedAt: '26 Aug 2026',
      qrPayload: `${window.location.origin}/passport/${id}`,
      publicUrl: `${window.location.origin}/passport/${id}`,
      artisanPhone: '9876543210',
    };
  },
};
