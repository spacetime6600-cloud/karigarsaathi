import { PhotographItem } from '@/types';

const SAMPLE_CRAFT_PHOTOS = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
];

export const mediaService = {
  createMockPhoto(index = 0): PhotographItem {
    const url = SAMPLE_CRAFT_PHOTOS[index % SAMPLE_CRAFT_PHOTOS.length];
    return {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url,
      name: `craft_photo_${index + 1}.jpg`,
      size: 2100000 + Math.floor(Math.random() * 500000),
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
    };
  },

  processFileUpload(file: File): Promise<PhotographItem> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: `photo_${Date.now()}`,
          url: reader.result as string,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    });
  },
};
