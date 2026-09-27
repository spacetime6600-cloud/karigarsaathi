import { UserAccount, RegisterArtisanInput, RegisterCoordinatorInput, SignInInput } from '@/domain/auth';
import { CoordinatorRegistrationRecord } from '@/services/coordinator/coordinatorApprovalService';

export interface IAuthRepository {
  register(input: RegisterArtisanInput): Promise<UserAccount>;
  registerCoordinator?(input: RegisterCoordinatorInput): Promise<CoordinatorRegistrationRecord>;
  signIn(input: SignInInput): Promise<UserAccount>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<UserAccount | null>;
  observeAuthState(callback: (user: UserAccount | null) => void): () => void;
}
