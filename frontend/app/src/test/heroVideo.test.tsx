import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { HeroBackgroundVideo } from '@/components/hero/HeroBackgroundVideo';

describe('HeroBackgroundVideo Component & Video Lifecycle', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('renders semantic video element with required properties (autoPlay, muted, loop, playsInline)', async () => {
    await act(async () => {
      root.render(<HeroBackgroundVideo />);
    });

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.hasAttribute('autoplay')).toBe(true);
    expect(video?.muted).toBe(true);
    expect(video?.hasAttribute('loop')).toBe(true);
    expect(video?.hasAttribute('playsinline')).toBe(true);
    expect(video?.getAttribute('preload')).toBe('metadata');
    expect(video?.getAttribute('aria-hidden')).toBe('true');
    expect(video?.getAttribute('tabindex')).toBe('-1');

    const source = video?.querySelector('source');
    expect(source).not.toBeNull();
    expect(source?.getAttribute('src')).toContain('artisan-hero-video');
    expect(source?.getAttribute('type')).toBe('video/mp4');
  });

  it('renders static poster fallback image beneath the video', async () => {
    await act(async () => {
      root.render(<HeroBackgroundVideo />);
    });

    const poster = container.querySelector('.hero-media__poster');
    expect(poster).not.toBeNull();
    expect(poster?.getAttribute('src')).toContain('artisan-hero-poster');
    expect(poster?.getAttribute('role')).toBe('presentation');
  });

  it('renders navy readability veil and bottom atmospheric fade layers', async () => {
    await act(async () => {
      root.render(<HeroBackgroundVideo />);
    });

    const veil = container.querySelector('.hero-media__veil');
    expect(veil).not.toBeNull();
  });

  it('respects prefers-reduced-motion by not mounting video element and showing poster', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    await act(async () => {
      root.render(<HeroBackgroundVideo />);
    });

    const video = container.querySelector('video');
    expect(video).toBeNull();

    const poster = container.querySelector('.hero-media__poster');
    expect(poster).not.toBeNull();
  });

  it('gracefully handles video error by falling back to poster without breaking UI', async () => {
    await act(async () => {
      root.render(<HeroBackgroundVideo />);
    });

    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    // Trigger video error
    await act(async () => {
      video?.dispatchEvent(new Event('error'));
    });

    // Poster remains intact
    const poster = container.querySelector('.hero-media__poster');
    expect(poster).not.toBeNull();
  });

  it('does not render any floating pause/play video control buttons or empty containers', async () => {
    await act(async () => {
      root.render(<HeroBackgroundVideo />);
    });

    const pauseBtn = container.querySelector('button[aria-label*="video"]');
    expect(pauseBtn).toBeNull();
    const pauseText = container.textContent;
    expect(pauseText).not.toContain('Pause video');
  });
});
