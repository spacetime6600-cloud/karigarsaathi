import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '@/services/api/authService';
import { storage } from '@/services/storage/localStorage';

describe('Auth Service & Role Permissions', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('provides default artisan session for offline resilience', () => {
    const user = authService.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.role).toBe('artisan');
    expect(user?.name).toBe('Ravi Kumar');
  });

  it('authenticates user and persists profile in local storage', async () => {
    const user = await authService.signIn('9876543210', '123456', 'artisan');
    expect(user.phone).toBe('9876543210');
    expect(authService.getCurrentUser()?.phone).toBe('9876543210');
  });

  it('switches to coordinator profile with distinct role attributes', () => {
    const coord = authService.switchRole('coordinator');
    expect(coord.role).toBe('coordinator');
    expect(coord.name).toBe('Priya Sharma');
  });
});
