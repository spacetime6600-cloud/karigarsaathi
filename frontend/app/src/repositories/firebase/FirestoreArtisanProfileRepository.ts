import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { IArtisanProfileRepository } from '@/repositories/interfaces/IArtisanProfileRepository';
import {
  ArtisanProfileRecord,
  CreateArtisanProfileInput,
  UpdateArtisanProfileInput,
} from '@/domain/profiles';
import { logger } from '@/services/logging/logger';
import { removeUndefinedDeep } from '@/utils/firestore';
import { storage } from '@/services/storage/localStorage';
import { DEMO_ARTISANS, DEMO_COORDINATORS } from '@/services/demo/demoDataService';

export class FirestoreArtisanProfileRepository implements IArtisanProfileRepository {
  async createProfile(uid: string, input: CreateArtisanProfileInput): Promise<ArtisanProfileRecord> {
    try {
      const now = new Date().toISOString();
      const profile: ArtisanProfileRecord = {
        ownerId: uid,
        artisanName: input.artisanName,
        craftType: input.craftType,
        state: input.state,
        district: input.district,
        bio: input.bio,
        languages: input.languages || ['en'],
        profileImagePath: input.profileImagePath,
        phone: input.phone,
        workshopName: input.workshopName,
        joinedYear: input.joinedYear || new Date().getFullYear(),
        createdAt: now,
        updatedAt: now,
      };

      const safeProfile = removeUndefinedDeep(profile);
      const docRef = doc(db, 'artisanProfiles', uid);
      await setDoc(docRef, safeProfile);
      logger.info('FIRESTORE', 'Created artisan profile', { uid });
      return safeProfile;
    } catch (err) {
      logger.error('FIRESTORE', 'Failed to create artisan profile', err, { uid });
      throw this.normalizeError(err);
    }
  }

  async getCurrentProfile(uid: string): Promise<ArtisanProfileRecord | null> {
    try {
      const docRef = doc(db, 'artisanProfiles', uid);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        const local = storage.get<ArtisanProfileRecord | null>(`mock_profile_${uid}`, null);
        if (local) return local;
        const demo = DEMO_ARTISANS.find((a) => a.id === uid) || DEMO_COORDINATORS.find((c) => c.id === uid);
        if (demo) {
          return {
            ownerId: demo.id,
            artisanName: demo.name,
            craftType: demo.craftType,
            state: demo.location,
            district: demo.location.split(',')[0],
            bio: demo.bio,
            languages: ['en', 'hi'],
            profileImagePath: demo.avatarUrl,
            phone: demo.phone,
            workshopName: demo.workshopName,
            joinedYear: demo.joinedYear,
            createdAt: '2026-06-01T10:00:00Z',
            updatedAt: '2026-08-20T10:00:00Z',
          };
        }
        return null;
      }

      return snap.data() as ArtisanProfileRecord;
    } catch (err) {
      logger.error('FIRESTORE', 'Failed to read artisan profile', err, { uid });
      const local = storage.get<ArtisanProfileRecord | null>(`mock_profile_${uid}`, null);
      if (local) return local;
      const demo = DEMO_ARTISANS.find((a) => a.id === uid) || DEMO_COORDINATORS.find((c) => c.id === uid);
      if (demo) {
        return {
          ownerId: demo.id,
          artisanName: demo.name,
          craftType: demo.craftType,
          state: demo.location,
          district: demo.location.split(',')[0],
          bio: demo.bio,
          languages: ['en', 'hi'],
          profileImagePath: demo.avatarUrl,
          phone: demo.phone,
          workshopName: demo.workshopName,
          joinedYear: demo.joinedYear,
          createdAt: '2026-06-01T10:00:00Z',
          updatedAt: '2026-08-20T10:00:00Z',
        };
      }
      return null;
    }
  }

  async updateCurrentProfile(uid: string, input: UpdateArtisanProfileInput): Promise<ArtisanProfileRecord> {
    try {
      const docRef = doc(db, 'artisanProfiles', uid);
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = {
        ...input,
        updatedAt: now,
      };

      // Ensure ownerId and createdAt are not mutated
      delete updateData.ownerId;
      delete updateData.createdAt;

      const safeUpdate = removeUndefinedDeep(updateData);
      await updateDoc(docRef, safeUpdate);

      const updatedSnap = await getDoc(docRef);
      logger.info('FIRESTORE', 'Updated artisan profile', { uid });
      return updatedSnap.data() as ArtisanProfileRecord;
    } catch (err) {
      logger.error('FIRESTORE', 'Failed to update artisan profile', err, { uid });
      throw this.normalizeError(err);
    }
  }

  private normalizeError(err: unknown): Error {
    if (err instanceof Error) {
      if (err.message.includes('permission-denied') || (err as { code?: string }).code === 'permission-denied') {
        return new Error('Access denied: You are not authorized to view or edit this profile.');
      }
      return err;
    }
    return new Error('An error occurred while accessing your artisan profile.');
  }
}
