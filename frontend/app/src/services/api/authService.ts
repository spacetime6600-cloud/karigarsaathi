import { ArtisanProfile } from '@/types';
import { storage } from '../storage/localStorage';

const DEFAULT_ARTISAN: ArtisanProfile = {
  id: 'artisan_001',
  name: 'Ravi Kumar',
  phone: '9876543210',
  role: 'artisan',
  craftType: 'Handloom Silk Weaving & Jamdani',
  location: 'Assam & Pochampally, India',
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  workshopName: 'Ravi Handlooms & Heritage Crafts',
  bio: 'Master weaver with 24 years of experience preserving traditional mulberry silk and natural terracotta-dyed Jamdani motifs.',
  joinedYear: 2021,
};

const DEFAULT_COORDINATOR: ArtisanProfile = {
  id: 'coord_001',
  name: 'Priya Sharma',
  phone: '9123456780',
  role: 'coordinator',
  craftType: 'Regional Craft Documentation & Export Coordinator',
  location: 'Guwahati Cluster, Assam',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  workshopName: 'Assam State Craft Linkage Mission',
  bio: 'Field coordinator facilitating digitization, fair pricing certification, and export logistics for over 45 handloom clusters.',
  joinedYear: 2020,
};

export const authService = {
  getCurrentUser(): ArtisanProfile | null {
    const raw = storage.get<ArtisanProfile | null | undefined>('currentUser', DEFAULT_ARTISAN);
    return raw ?? null;
  },

  signIn(phone: string, _otp: string, asRole: 'artisan' | 'coordinator' = 'artisan'): Promise<ArtisanProfile> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = asRole === 'coordinator' ? { ...DEFAULT_COORDINATOR, phone } : { ...DEFAULT_ARTISAN, phone };
        storage.set('currentUser', user);
        resolve(user);
      }, 300);
    });
  },

  signOut(): Promise<void> {
    return new Promise((resolve) => {
      storage.set('currentUser', null);
      resolve();
    });
  },

  switchRole(role: 'artisan' | 'coordinator'): ArtisanProfile {
    const user = role === 'coordinator' ? DEFAULT_COORDINATOR : DEFAULT_ARTISAN;
    storage.set('currentUser', user);
    return user;
  },
};
