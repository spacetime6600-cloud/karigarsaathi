import { UserAccount, RegisterArtisanInput, SignInInput } from '@/domain/auth';

export interface IAuthRepository {
  register(input: RegisterArtisanInput): Promise<UserAccount>;
  signIn(input: SignInInput): Promise<UserAccount>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<UserAccount | null>;
  observeAuthState(callback: (user: UserAccount | null) => void): () => void;
}
