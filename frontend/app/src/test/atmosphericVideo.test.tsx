import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AtmosphericVideo } from '@/components/media/AtmosphericVideo';
import { MarketplacePage } from '@/features/marketplace/MarketplacePage';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AudioHelpProvider } from '@/app/providers/AudioHelpProvider';
import { storage } from '@/services/storage/localStorage';

describe('AtmosphericVideo Component & Marketplace Video Integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    storage.clearAll();
    storage.set('selectedLanguage', 'en');
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it('renders semantic video element with required attributes and source elements', async () => {
    await act(async () => {
      root.render(
        <AtmosphericVideo
          desktopWebm="/assets/video.webm"
          desktopMp4="/assets/video.mp4"
          mobileMp4="/assets/video-mobile.mp4"
          poster="/assets/poster.webp"
          veilVariant="marketplace"
          fadeBottom
          priority
        />
      );
    });

    // Poster is present
    const posterImg = container.querySelector('img.marketplace-hero__poster') as HTMLImageElement;
    expect(posterImg).not.toBeNull();
    expect(posterImg.src).toContain('poster.webp');

    // Video element has semantic accessibility & playback attributes
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video.hasAttribute('autoplay')).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('aria-hidden')).toBe('true');
    expect(video.getAttribute('tabindex')).toBe('-1');
    expect(video.getAttribute('disablepictureinpicture')).not.toBeNull();

    // Source tags: WebM preferred, Mobile media query, Desktop MP4 fallback
    const sources = video.querySelectorAll('source');
    expect(sources.length).toBe(3);

    expect(sources[0].getAttribute('type')).toBe('video/webm');
    expect(sources[0].getAttribute('src')).toBe('/assets/video.webm');

    expect(sources[1].getAttribute('type')).toBe('video/mp4');
    expect(sources[1].getAttribute('src')).toBe('/assets/video-mobile.mp4');
    expect(sources[1].getAttribute('media')).toBe('(max-width: 768px)');

    expect(sources[2].getAttribute('type')).toBe('video/mp4');
    expect(sources[2].getAttribute('src')).toBe('/assets/video.mp4');

    // Marketplace veil is present
    expect(container.querySelector('.marketplace-hero__video-veil')).not.toBeNull();
  });

  it('respects prefers-reduced-motion by omitting video and displaying only poster', async () => {
    // Mock prefers-reduced-motion: reduce
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    await act(async () => {
      root.render(
        <AtmosphericVideo
          desktopMp4="/assets/video.mp4"
          poster="/assets/poster.webp"
          veilVariant="marketplace"
        />
      );
    });

    // Video should NOT be rendered in reduced motion mode
    expect(container.querySelector('video')).toBeNull();

    // Poster remains visible
    const poster = container.querySelector('img.marketplace-hero__poster') as HTMLImageElement;
    expect(poster).not.toBeNull();
    expect(poster.className).toContain('opacity-100');
  });

  it('respects data-saving connections by suppressing video download', async () => {
    // Mock navigator.connection.saveData = true
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
    });

    await act(async () => {
      root.render(
        <AtmosphericVideo
          desktopMp4="/assets/video.mp4"
          poster="/assets/poster.webp"
          veilVariant="marketplace"
        />
      );
    });

    // Video should NOT be rendered for data-saving users
    expect(container.querySelector('video')).toBeNull();

    const poster = container.querySelector('img.marketplace-hero__poster');
    expect(poster).not.toBeNull();
  });

  it('renders AtmosphericVideo inside MarketplacePage with centered hero hierarchy and interactive actions', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/marketplace']}>
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <Routes>
                  <Route path="/marketplace" element={<MarketplacePage />} />
                </Routes>
              </AudioHelpProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    // 1. Hero container & Atmospheric Video
    const hero = container.querySelector('.marketplace-hero');
    expect(hero).not.toBeNull();

    const atmosphericContainer = hero?.querySelector('.atmospheric-video-container');
    expect(atmosphericContainer).not.toBeNull();

    const video = hero?.querySelector('video');
    expect(video).not.toBeNull();

    // 2. Centered Editorial Content
    const content = hero?.querySelector('.marketplace-hero__content');
    expect(content).not.toBeNull();
    expect(content?.textContent).toContain('THE KARIGARSAATHI MARKETPLACE');
    expect(content?.textContent).toContain('Made by hand.');
    expect(content?.textContent).toContain('Shared with meaning.');
    expect(content?.textContent).toContain('Explore the collection');
    expect(content?.textContent).toContain('Browse by craft');

    // 3. Interactive buttons
    const primaryBtn = content?.querySelector('.marketplace-hero__btn--primary') as HTMLButtonElement;
    expect(primaryBtn).not.toBeNull();
    await act(async () => {
      primaryBtn.click();
    });
  });
});
