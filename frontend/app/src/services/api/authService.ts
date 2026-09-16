import { ArtisanProfile } from '@/types';
import { storage } from '../storage/localStorage';

import { DEMO_ARTISANS, DEMO_COORDINATORS } from '@/services/demo/demoDataService';

const DEFAULT_ARTISAN: ArtisanProfile = DEMO_ARTISANS[0];
const DEFAULT_COORDINATOR: ArtisanProfile = DEMO_COORDINATORS[0];

export const authService = {
  getCurrentUser(): ArtisanProfile | null {
    const raw = storage.get<ArtisanProfile | null>('currentUser', null);
    return raw ?? null;
  },

  signIn(phone: string, _otp: string, asRole: 'artisan' | 'coordinator' = 'artisan'): Promise<ArtisanProfile> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if phone matches any known demo artisan or coordinator
        const matchedArtisan = DEMO_ARTISANS.find((a) => a.phone === phone);
        const matchedCoord = DEMO_COORDINATORS.find((c) => c.phone === phone);

        let user: ArtisanProfile;
        if (asRole === 'coordinator') {
          user = matchedCoord || { ...DEFAULT_COORDINATOR, phone };
        } else {
          user = matchedArtisan || { ...DEFAULT_ARTISAN, phone };
        }

        storage.set('currentUser', user);
        resolve(user);
      }, 300);
    });
  },

  signOut(): Promise<void> {
    return new Promise((resolve) => {
      storage.remove('currentUser');
      storage.set('currentUser', null);
      resolve();
    });
  },

  switchRole(role: 'artisan' | 'coordinator', currentUid?: string): ArtisanProfile | null {
    const current = this.getCurrentUser();
    if (!current && !currentUid) return null;

    let user: ArtisanProfile;
    if (role === 'coordinator') {
      const match = DEMO_COORDINATORS.find((c) => c.id === currentUid || c.phone === current?.phone);
      user = match || DEFAULT_COORDINATOR;
    } else {
      const match = DEMO_ARTISANS.find((a) => a.id === currentUid || a.phone === current?.phone);
      user = match || DEFAULT_ARTISAN;
    }
    storage.set('currentUser', user);
    return user;
  },
};
