export type UserRole = 'artisan' | 'buyer' | 'coordinator';

export interface UserAccount {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
  phone?: string;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterArtisanInput {
  email: string;
  password: string;
  displayName: string;
  preferredLanguage?: string;
  phone?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthState {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  profileIncomplete?: boolean;
}
