import { IArtisanProfileRepository } from '@/repositories/interfaces/IArtisanProfileRepository';
import {
  ArtisanProfileRecord,
  CreateArtisanProfileInput,
  UpdateArtisanProfileInput,
} from '@/domain/profiles';
import { storage } from '@/services/storage/localStorage';

const DEFAULT_PROFILE: ArtisanProfileRecord = {
  ownerId: 'artisan_demo_01',
  artisanName: 'Ravi Kumar',
  craftType: 'Handloom Silk Weaving & Jamdani',
  state: 'Assam & Pochampally, India',
  district: 'Guwahati Cluster',
  bio: 'Master weaver with 24 years of experience preserving traditional mulberry silk.',
  languages: ['en', 'hi'],
  profileImagePath: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  phone: '9876543210',
  workshopName: 'Ravi Handlooms & Heritage Crafts',
  joinedYear: 2021,
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
};

export class MockArtisanProfileRepository implements IArtisanProfileRepository {
  async createProfile(uid: string, input: CreateArtisanProfileInput): Promise<ArtisanProfileRecord> {
    const profile: ArtisanProfileRecord = {
      ownerId: uid,
      ...input,
      languages: input.languages || ['en'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.set(`mock_profile_${uid}`, profile);
    return profile;
  }

  async getCurrentProfile(uid: string): Promise<ArtisanProfileRecord | null> {
    return storage.get<ArtisanProfileRecord>(`mock_profile_${uid}`, { ...DEFAULT_PROFILE, ownerId: uid });
  }

  async updateCurrentProfile(uid: string, input: UpdateArtisanProfileInput): Promise<ArtisanProfileRecord> {
    const current = (await this.getCurrentProfile(uid)) || { ...DEFAULT_PROFILE, ownerId: uid };
    const updated: ArtisanProfileRecord = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    storage.set(`mock_profile_${uid}`, updated);
    return updated;
  }
}
