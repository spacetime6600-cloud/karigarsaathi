import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { KarigarIntro, INTRO_SESSION_KEY } from '@/components/loading/KarigarIntro';
import { InitialAppLoader } from '@/components/loading/InitialAppLoader';
import * as AuthProviderModule from '@/app/providers/AuthProvider';

describe('KarigarIntro Opening Animation & InitialAppLoader Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    vi.spyOn(AuthProviderModule, 'useOptionalAuth').mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      userAccount: null,
      isSigningOut: false,
      profileIncomplete: false,
      signIn: vi.fn(),
      signInWithEmail: vi.fn(),
      registerArtisan: vi.fn(),
      registerCoordinator: vi.fn(),
      signOut: vi.fn(),
      switchRole: vi.fn(),
      retryProfileInit: vi.fn(),
      error: null,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. KarigarIntro Component Rendering & Sequencing', () => {
    it('renders initial brand typography and accessible attributes', () => {
      render(<KarigarIntro appReady={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'KarigarSaathi is preparing');
      expect(screen.getByText('KarigarSaathi')).toBeInTheDocument();
      expect(screen.getByText('ARTISAN DIGITISATION')).toBeInTheDocument();
      expect(screen.getByText('Crafted by hand. Carried forward digitally.')).toBeInTheDocument();
    });

    it('progresses through drawing, settling, brand reveal, and completes with onComplete', () => {
      const handleComplete = vi.fn();
      const { container } = render(<KarigarIntro appReady={true} onComplete={handleComplete} />);

      const introEl = container.querySelector('.karigar-intro');
      expect(introEl).toHaveAttribute('data-intro-stage', 'init');

      // 100ms: drawing stage
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(introEl).toHaveAttribute('data-intro-stage', 'drawing');

      // 1050ms: settling stage
      act(() => {
        vi.advanceTimersByTime(950);
      });
      expect(introEl).toHaveAttribute('data-intro-stage', 'settling');

      // 1350ms: brand reveal stage
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(introEl).toHaveAttribute('data-intro-stage', 'brand');

      // 2050ms: checking appReady -> revealing stage
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(introEl).toHaveAttribute('data-intro-stage', 'revealing');

      // 750ms reveal mask duration -> completed
      act(() => {
        vi.advanceTimersByTime(750);
      });
      expect(handleComplete).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(INTRO_SESSION_KEY)).toBe('true');
    });

    it('waits in settled state if appReady is false, then triggers reveal once appReady turns true', () => {
      const handleComplete = vi.fn();
      const { container, rerender } = render(
        <KarigarIntro appReady={false} onComplete={handleComplete} />
      );

      const introEl = container.querySelector('.karigar-intro');

      // Advance past brand stage (2050ms)
      act(() => {
        vi.advanceTimersByTime(2100);
      });

      // App is not ready, should remain in settled state
      expect(introEl).toHaveAttribute('data-intro-stage', 'settled');
      expect(screen.getByText('Preparing your experience…')).toBeInTheDocument();
      expect(handleComplete).not.toHaveBeenCalled();

      // Now set appReady = true
      act(() => {
        rerender(<KarigarIntro appReady={true} onComplete={handleComplete} />);
      });

      // Should transition to revealing
      expect(introEl).toHaveAttribute('data-intro-stage', 'revealing');

      act(() => {
        vi.advanceTimersByTime(750);
      });

      expect(handleComplete).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(INTRO_SESSION_KEY)).toBe('true');
    });

    it('displays recovery actions when loading exceeds 8.5s timeout', () => {
      const handleComplete = vi.fn();
      render(<KarigarIntro appReady={false} onComplete={handleComplete} />);

      act(() => {
        vi.advanceTimersByTime(8600);
      });

      expect(
        screen.getByText('Connecting to the workshop is taking longer than usual')
      ).toBeInTheDocument();

      const enterSiteBtn = screen.getByRole('button', { name: /enter site/i });
      expect(enterSiteBtn).toBeInTheDocument();

      fireEvent.click(enterSiteBtn);
      expect(handleComplete).toHaveBeenCalledTimes(1);
    });

    it('supports skip button when forceShow is enabled', () => {
      const handleComplete = vi.fn();
      render(<KarigarIntro forceShow={true} onComplete={handleComplete} />);

      const skipBtn = screen.getByRole('button', { name: /skip intro/i });
      expect(skipBtn).toBeInTheDocument();

      fireEvent.click(skipBtn);
      expect(handleComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. InitialAppLoader Integration', () => {
    it('shows KarigarIntro on first session visit and reveals children once ready', () => {
      vi.spyOn(AuthProviderModule, 'useOptionalAuth').mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        userAccount: null,
        isSigningOut: false,
        profileIncomplete: false,
        signIn: vi.fn(),
        signInWithEmail: vi.fn(),
        registerArtisan: vi.fn(),
        registerCoordinator: vi.fn(),
        signOut: vi.fn(),
        switchRole: vi.fn(),
        retryProfileInit: vi.fn(),
        error: null,
      });

      const { container } = render(
        <InitialAppLoader>
          <div data-testid="app-content">KarigarSaathi Application</div>
        </InitialAppLoader>
      );

      // Both content and intro should be in DOM during transition
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      expect(container.querySelector('.karigar-intro')).toBeInTheDocument();

      // Complete the animation stages
      act(() => {
        vi.advanceTimersByTime(2100);
      });
      // Complete the reveal transition
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // After complete, intro unmounts
      expect(container.querySelector('.karigar-intro')).not.toBeInTheDocument();
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });

    it('bypasses KarigarIntro on repeat visits within the same session', () => {
      sessionStorage.setItem(INTRO_SESSION_KEY, 'true');

      vi.spyOn(AuthProviderModule, 'useOptionalAuth').mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        userAccount: null,
        isSigningOut: false,
        profileIncomplete: false,
        signIn: vi.fn(),
        signInWithEmail: vi.fn(),
        registerArtisan: vi.fn(),
        registerCoordinator: vi.fn(),
        signOut: vi.fn(),
        switchRole: vi.fn(),
        retryProfileInit: vi.fn(),
        error: null,
      });

      const { container } = render(
        <InitialAppLoader>
          <div data-testid="app-content">KarigarSaathi Application</div>
        </InitialAppLoader>
      );

      // Intro is bypassed immediately
      expect(container.querySelector('.karigar-intro')).not.toBeInTheDocument();
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });
  });
});
