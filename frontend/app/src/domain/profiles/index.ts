export interface ArtisanProfileRecord {
  ownerId: string;
  artisanName: string;
  craftType: string;
  state: string;
  district: string;
  bio: string;
  languages: string[];
  profileImagePath?: string;
  phone?: string;
  workshopName?: string;
  joinedYear?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArtisanProfileInput {
  artisanName: string;
  craftType: string;
  state: string;
  district: string;
  bio: string;
  languages: string[];
  profileImagePath?: string;
  phone?: string;
  workshopName?: string;
  joinedYear?: number;
}

export interface UpdateArtisanProfileInput extends Partial<CreateArtisanProfileInput> {
  updatedAt?: string;
}
