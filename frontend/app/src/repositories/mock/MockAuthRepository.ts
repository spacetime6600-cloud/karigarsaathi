import { IAuthRepository } from '@/repositories/interfaces/IAuthRepository';
import { UserAccount, RegisterArtisanInput, SignInInput } from '@/domain/auth';
import { storage } from '@/services/storage/localStorage';

const DEFAULT_USER: UserAccount = {
  uid: 'artisan_demo_01',
  role: 'artisan',
  displayName: 'Ravi Kumar',
  email: 'ravi@example.com',
  phone: '9876543210',
  preferredLanguage: 'en',
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
};

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

  async signIn(input: SignInInput): Promise<UserAccount> {
    const user: UserAccount = {
      ...DEFAULT_USER,
      email: input.email,
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
    return storage.get<UserAccount | null>('mock_currentUser', DEFAULT_USER);
  }

  observeAuthState(callback: (user: UserAccount | null) => void): () => void {
    this.listeners.push(callback);
    callback(storage.get<UserAccount | null>('mock_currentUser', DEFAULT_USER));
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(user: UserAccount | null) {
    this.listeners.forEach((l) => l(user));
  }
}
