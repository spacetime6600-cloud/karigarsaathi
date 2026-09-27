import { IAuthRepository } from '@/repositories/interfaces/IAuthRepository';
import { UserAccount, RegisterArtisanInput, RegisterCoordinatorInput, SignInInput } from '@/domain/auth';
import { storage } from '@/services/storage/localStorage';
import { coordinatorApprovalService, CoordinatorRegistrationRecord } from '@/services/coordinator/coordinatorApprovalService';

export class MockAuthRepository implements IAuthRepository {
  private listeners: Array<(user: UserAccount | null) => void> = [];

  async register(input: RegisterArtisanInput): Promise<UserAccount> {
    const user: UserAccount = {
      uid: `mock_${Date.now()}`,
      role: 'artisan',
      displayName: input.displayName,
      email: input.email,
      phone: input.phone,
      preferredLanguage: input.preferredLanguage || 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.set('mock_currentUser', user);
    this.notify(user);
    return user;
  }

  async registerCoordinator(input: RegisterCoordinatorInput): Promise<CoordinatorRegistrationRecord> {
    return await coordinatorApprovalService.registerCoordinator(input);
  }

  async signIn(input: SignInInput): Promise<UserAccount> {
    const emailLower = input.email.toLowerCase().trim();
    const isApprovedCoord = coordinatorApprovalService.isApproved(emailLower);

    let uid = 'demo_artisan_ravi';
    let role: 'artisan' | 'coordinator' = 'artisan';
    let displayName = 'Ravi Kumar';

    if (isApprovedCoord) {
      role = 'coordinator';
      if (emailLower.includes('vikram')) {
        uid = 'demo_coord_vikram';
        displayName = 'Vikramaditya Rathore';
      } else {
        uid = 'demo_coord_priya';
        displayName = 'Priya Sharma';
      }
    } else if (emailLower.includes('ravi')) {
      uid = 'demo_artisan_ravi';
      role = 'artisan';
      displayName = 'Ravi Kumar';
    }

    const user: UserAccount = {
      uid,
      role,
      displayName,
      email: input.email,
      phone: '9876543210',
      preferredLanguage: 'en',
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    };
    storage.set('mock_currentUser', user);
    this.notify(user);
    return user;
  }

  async signOut(): Promise<void> {
    storage.remove('mock_currentUser');
    this.notify(null);
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    return storage.get<UserAccount | null>('mock_currentUser', null);
  }

  observeAuthState(callback: (user: UserAccount | null) => void): () => void {
    this.listeners.push(callback);
    callback(storage.get<UserAccount | null>('mock_currentUser', null));
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(user: UserAccount | null) {
    this.listeners.forEach((l) => l(user));
  }
}
