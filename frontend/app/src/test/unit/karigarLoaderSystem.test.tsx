import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  KarigarLoader,
  CraftThreadMark,
  SuspenseRouteLoader,
  RouteErrorBoundary,
  useLoaderFlicker,
} from '@/components/loading';
import { resolveDestinationKey } from '@/components/loading/KarigarLoader';
import { PageTransition } from '@/components/layout/PageTransition';

describe('KarigarLoader System & Visual Transition Infrastructure', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('1. KarigarLoader Visual Component & Contextual Messaging', () => {
    it('renders the brand title, artisan digitisation subtitle, and animated thread mark', () => {
      render(
        <MemoryRouter>
          <KarigarLoader visible={true} destination="/" variant="initial" />
        </MemoryRouter>
      );

      expect(screen.getByText('KarigarSaathi')).toBeInTheDocument();
      expect(screen.getByText('ARTISAN DIGITISATION')).toBeInTheDocument();
      expect(screen.getByText('Returning to the workshop')).toBeInTheDocument();
    });

    it('resolves correct contextual loading messages for each public and workspace destination', () => {
      expect(resolveDestinationKey('/')).toBe('home');
      expect(resolveDestinationKey('/about')).toBe('about');
      expect(resolveDestinationKey('/marketplace')).toBe('marketplace');
      expect(resolveDestinationKey('/marketplace/products/prod_123')).toBe('product');
      expect(resolveDestinationKey('/reviews')).toBe('reviews');
      expect(resolveDestinationKey('/login')).toBe('login');
      expect(resolveDestinationKey('/sign-in')).toBe('login');
      expect(resolveDestinationKey('/passport/pass_456')).toBe('passport');
      expect(resolveDestinationKey('/artisan/dashboard')).toBe('artisan');
      expect(resolveDestinationKey('/coordinator/artisans')).toBe('coordinator');
      expect(resolveDestinationKey('/unknown')).toBe('default');
    });

    it('renders contextual route messages correctly for marketplace and login', () => {
      const { rerender } = render(
        <MemoryRouter>
          <KarigarLoader visible={true} destination="/marketplace" variant="route" />
        </MemoryRouter>
      );

      expect(screen.getByText('Curating artisan work')).toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <KarigarLoader visible={true} destination="/login" variant="route" />
        </MemoryRouter>
      );

      expect(screen.getByText('Preparing secure sign-in')).toBeInTheDocument();
    });

    it('renders auth variant for authentication verification', () => {
      render(
        <MemoryRouter>
          <KarigarLoader visible={true} variant="auth" destination="/artisan/dashboard" />
        </MemoryRouter>
      );

      expect(screen.getByText('Preparing your artisan workspace')).toBeInTheDocument();
      const statusEl = screen.getByRole('status');
      expect(statusEl).toHaveAttribute('data-variant', 'auth');
      expect(statusEl).toHaveAttribute('aria-busy', 'true');
    });

    it('supports custom override message', () => {
      render(
        <MemoryRouter>
          <KarigarLoader visible={true} message="Signing out securely..." variant="auth" />
        </MemoryRouter>
      );

      expect(screen.getByText('Signing out securely...')).toBeInTheDocument();
    });
  });

  describe('2. Accessibility & Status Regions', () => {
    it('provides role="status", aria-live="polite", aria-busy, and hidden assistive text', () => {
      render(
        <MemoryRouter>
          <KarigarLoader visible={true} destination="/about" />
        </MemoryRouter>
      );

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveAttribute('aria-busy', 'true');

      // Decorative SVG should be aria-hidden
      const svgs = statusRegion.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg.closest('[aria-hidden="true"]')).toBeTruthy();
      });
    });

    it('returns null when visible is false and no error is present', () => {
      const { container } = render(
        <MemoryRouter>
          <KarigarLoader visible={false} destination="/about" />
        </MemoryRouter>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('3. CraftThreadMark Artisan Animation', () => {
    it('renders continuous artisan thread SVG with central terracotta focal point', () => {
      const { container } = render(<CraftThreadMark size="md" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg).toHaveAttribute('viewBox', '0 0 100 48');

      const circle = container.querySelector('circle');
      expect(circle).toBeTruthy();
      expect(circle).toHaveAttribute('cx', '50');
      expect(circle).toHaveAttribute('cy', '24');
      expect(circle).toHaveAttribute('fill', '#A13F1C');
    });

    it('respects paused state', () => {
      const { container } = render(<CraftThreadMark isPaused={true} />);
      const svg = container.querySelector('.craft-thread--paused');
      expect(svg).toBeTruthy();
    });
  });

  describe('4. Anti-Flicker Threshold & Duration Enforcement (useLoaderFlicker)', () => {
    const TestFlickerComponent: React.FC<{ isPending: boolean }> = ({ isPending }) => {
      const isVisible = useLoaderFlicker({
        isPending,
        displayThresholdMs: 150,
        minVisibleDurationMs: 380,
      });
      return <div data-testid="flicker-status">{isVisible ? 'VISIBLE' : 'HIDDEN'}</div>;
    };

    it('does NOT display loader if fast operation completes before threshold (< 150ms)', () => {
      const { rerender } = render(<TestFlickerComponent isPending={true} />);
      expect(screen.getByTestId('flicker-status').textContent).toBe('HIDDEN');

      // Advance by 80ms (less than 150ms threshold)
      act(() => {
        vi.advanceTimersByTime(80);
      });
      expect(screen.getByTestId('flicker-status').textContent).toBe('HIDDEN');

      // Finish operation
      rerender(<TestFlickerComponent isPending={false} />);
      expect(screen.getByTestId('flicker-status').textContent).toBe('HIDDEN');

      // Advance beyond 150ms: loader should STILL never have shown
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByTestId('flicker-status').textContent).toBe('HIDDEN');
    });

    it('shows loader when operation exceeds 150ms and maintains visibility for at least 380ms', () => {
      const { rerender } = render(<TestFlickerComponent isPending={true} />);

      // Advance past threshold
      act(() => {
        vi.advanceTimersByTime(160);
      });
      expect(screen.getByTestId('flicker-status').textContent).toBe('VISIBLE');

      // Operation finishes 40ms later (total active 200ms)
      act(() => {
        vi.advanceTimersByTime(40);
      });
      rerender(<TestFlickerComponent isPending={false} />);

      // Loader must REMAIN visible to satisfy minVisibleDuration (380ms)
      expect(screen.getByTestId('flicker-status').textContent).toBe('VISIBLE');

      // Advance 200ms (elapsed is 240ms < 380ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByTestId('flicker-status').textContent).toBe('VISIBLE');

      // Advance past remaining time (150ms more = total 390ms)
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByTestId('flicker-status').textContent).toBe('HIDDEN');
    });
  });

  describe('5. SuspenseRouteLoader Integration', () => {
    it('renders zero-height placeholder initially until threshold is met', () => {
      render(
        <MemoryRouter>
          <SuspenseRouteLoader destination="/marketplace" displayThresholdMs={150} />
        </MemoryRouter>
      );

      // Initially hidden placeholder
      expect(screen.queryByText('Curating artisan work')).not.toBeInTheDocument();

      // After threshold elapses, renders KarigarLoader
      act(() => {
        vi.advanceTimersByTime(160);
      });

      expect(screen.getByText('Curating artisan work')).toBeInTheDocument();
    });
  });

  describe('6. Error Recovery & Loading Failure Protection', () => {
    it('displays error recovery screen and retry action on failure', () => {
      const handleRetry = vi.fn();
      render(
        <MemoryRouter>
          <KarigarLoader
            visible={true}
            destination="/marketplace"
            error="Network request failed"
            onRetry={handleRetry}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Unable to load this section')).toBeInTheDocument();
      expect(screen.queryByText('Curating artisan work')).not.toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);

      expect(screen.getByRole('link', { name: /return home/i })).toBeInTheDocument();
    });

    it('renders RouteErrorBoundary with sanitized error message', () => {
      const testError = new Error('Failed to fetch dynamically imported module /src/features/AboutPage.tsx');
      render(
        <MemoryRouter>
          <RouteErrorBoundary error={testError} />
        </MemoryRouter>
      );

      expect(screen.getByText('Unable to load this section')).toBeInTheDocument();
      expect(
        screen.getByText(/A network issue prevented loading this section/i)
      ).toBeInTheDocument();
    });
  });

  describe('7. PageTransition Wrapper', () => {
    it('renders children with page-transition-enter animation class', () => {
      const { container } = render(
        <MemoryRouter>
          <PageTransition transitionKey="/test-route">
            <div data-testid="page-content">Handcrafted Content</div>
          </PageTransition>
        </MemoryRouter>
      );

      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      const transitionDiv = container.querySelector('.page-transition-enter');
      expect(transitionDiv).toBeTruthy();
    });
  });
});
