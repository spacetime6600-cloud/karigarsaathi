import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '@/services/api/authService';
import { storage } from '@/services/storage/localStorage';

describe('Auth Service & Role Permissions', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('returns null when user is unauthenticated', () => {
    const user = authService.getCurrentUser();
    expect(user).toBeNull();
  });

  it('authenticates user and persists profile in local storage', async () => {
    const user = await authService.signIn('9876543210', '123456', 'artisan');
    expect(user.phone).toBe('9876543210');
    expect(authService.getCurrentUser()?.phone).toBe('9876543210');
  });

  it('switches to coordinator profile when user is signed in', async () => {
    await authService.signIn('9876543210', '123456', 'artisan');
    const coord = authService.switchRole('coordinator');
    expect(coord).not.toBeNull();
    expect(coord?.role).toBe('coordinator');
    expect(coord?.name).toBe('Priya Sharma');
  });

  it('clears session on signOut', async () => {
    await authService.signIn('9876543210', '123456', 'artisan');
    expect(authService.getCurrentUser()).not.toBeNull();
    await authService.signOut();
    expect(authService.getCurrentUser()).toBeNull();
  });
});
