import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CraftGalleryBanner } from '@/components/gallery/CraftGalleryBanner';

describe('CraftGalleryBanner — Seamless Compact Animated Craft Exhibition', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Mock IntersectionObserver
    window.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(() => {
        callback([{ isIntersecting: true }]);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

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

  const renderGallery = async () => {
    await act(async () => {
      root.render(<CraftGalleryBanner />);
    });
  };

  it('renders craft gallery with accessibility attributes, captions and zero controls overlay', async () => {
    await renderGallery();

    const section = container.querySelector('section[aria-roledescription="carousel"]');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('aria-label')).toContain('Artisan craft traditions');

    // Crafts rendered
    expect(container.textContent).toContain('Terracotta Pottery');
    expect(container.textContent).toContain('Handloom Silk Weaving');
    expect(container.textContent).toContain('Sheesham Wood Carving');
    expect(container.textContent).toContain('Cane & Bamboo Basketry');

    // Controls should not be present (clean uninterrupted presentation)
    const prevBtn = container.querySelector('button[aria-label="Previous craft image"]');
    const pauseBtn = container.querySelector('button[aria-label="Pause slideshow"]');
    expect(prevBtn).toBeNull();
    expect(pauseBtn).toBeNull();
  });

  it('handles keyboard navigation with ArrowRight and ArrowLeft', async () => {
    await renderGallery();

    const section = container.querySelector('section[aria-roledescription="carousel"]') as HTMLElement;
    expect(section).not.toBeNull();

    const track = section.querySelector('div.flex') as HTMLElement;
    expect(track.style.transform).toContain('translateX(-0%)');

    await act(async () => {
      section.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });

    expect(track.style.transform).not.toContain('translateX(-0%)');

    await act(async () => {
      section.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });

    expect(track.style.transform).toContain('translateX(-0%)');
  });

  it('handles touch swipe navigation', async () => {
    await renderGallery();

    const section = container.querySelector('section[aria-roledescription="carousel"]') as HTMLElement;
    expect(section).not.toBeNull();

    const track = section.querySelector('div.flex') as HTMLElement;

    // Simulate swipe left (next)
    await act(async () => {
      section.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 100 } as Touch],
          bubbles: true,
        })
      );
      section.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
          bubbles: true,
        })
      );
      section.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
    });

    expect(track.style.transform).not.toContain('translateX(-0%)');
  });

  it('moves automatically on interval', async () => {
    vi.useFakeTimers();

    await renderGallery();

    const section = container.querySelector('section[aria-roledescription="carousel"]') as HTMLElement;
    const track = section.querySelector('div.flex') as HTMLElement;
    expect(track.style.transform).toContain('translateX(-0%)');

    // Advance timer by 4500ms
    await act(async () => {
      vi.advanceTimersByTime(4500);
    });

    expect(track.style.transform).not.toContain('translateX(-0%)');

    vi.useRealTimers();
  });

  it('respects prefers-reduced-motion by disabling CSS transition animation', async () => {
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

    await renderGallery();

    const section = container.querySelector('section[aria-roledescription="carousel"]') as HTMLElement;
    const track = section.querySelector('div.flex') as HTMLElement;

    expect(track.style.transition).toBe('none');
  });
});
