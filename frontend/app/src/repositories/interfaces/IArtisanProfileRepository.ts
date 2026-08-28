import { ArtisanProfileRecord, CreateArtisanProfileInput, UpdateArtisanProfileInput } from '@/domain/profiles';

export interface IArtisanProfileRepository {
  createProfile(uid: string, input: CreateArtisanProfileInput): Promise<ArtisanProfileRecord>;
  getCurrentProfile(uid: string): Promise<ArtisanProfileRecord | null>;
  updateCurrentProfile(uid: string, input: UpdateArtisanProfileInput): Promise<ArtisanProfileRecord>;
}
