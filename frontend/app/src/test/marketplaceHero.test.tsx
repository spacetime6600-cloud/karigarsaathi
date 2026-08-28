import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MarketplacePage } from '@/features/marketplace/MarketplacePage';
import { LandingPage } from '@/features/landing/LandingPage';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AudioHelpProvider } from '@/app/providers/AudioHelpProvider';
import { storage } from '@/services/storage/localStorage';

describe('Marketplace Hero Redesign: Centred Typography, Fluid Alignment & Entrance Animation', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    storage.clearAll();
    storage.set('selectedLanguage', 'en');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const renderMarketplace = async () => {
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
  };

  it('renders the complete centred editorial hero with exact typographic hierarchy', async () => {
    await renderMarketplace();

    // 1. Hero container & Centred Content Wrapper
    const heroSection = container.querySelector('section[aria-label="The KarigarSaathi Marketplace"]');
    expect(heroSection).not.toBeNull();
    expect(heroSection?.classList.contains('marketplace-hero')).toBe(true);

    const heroContent = heroSection?.querySelector('.marketplace-hero__content');
    expect(heroContent).not.toBeNull();

    // 2. Central veil for text contrast
    const veil = heroSection?.querySelector('.marketplace-hero__veil');
    expect(veil).not.toBeNull();

    // 3. Eyebrow
    const eyebrow = heroContent?.querySelector('.marketplace-hero__eyebrow');
    expect(eyebrow).not.toBeNull();
    expect(eyebrow?.textContent?.trim()).toBe('THE KARIGARSAATHI MARKETPLACE');

    // 4. Single accessible h1 with primary & accent lines
    const h1 = heroContent?.querySelector('h1.marketplace-hero__title');
    expect(h1).not.toBeNull();

    const primaryLine = h1?.querySelector('.marketplace-hero__line--primary');
    expect(primaryLine).not.toBeNull();
    expect(primaryLine?.textContent?.trim()).toBe('Made by hand.');

    const accentLine = h1?.querySelector('.marketplace-hero__line--accent');
    expect(accentLine).not.toBeNull();
    expect(accentLine?.textContent?.trim()).toBe('Shared with meaning.');

    // Reading sequence is natural for screen readers
    expect(h1?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Made by hand. Shared with meaning.');

    // 5. Description
    const description = heroContent?.querySelector('.marketplace-hero__description');
    expect(description).not.toBeNull();
    expect(description?.textContent?.trim()).toBe(
      'Discover handmade products, regional traditions and the people who keep them alive.'
    );

    // 6. Centred Actions
    const actions = heroContent?.querySelector('.marketplace-hero__actions');
    expect(actions).not.toBeNull();

    const primaryBtn = actions?.querySelector('.marketplace-hero__btn--primary');
    expect(primaryBtn).not.toBeNull();
    expect(primaryBtn?.textContent?.trim()).toBe('Explore the collection');

    const secondaryBtn = actions?.querySelector('.marketplace-hero__btn--secondary');
    expect(secondaryBtn).not.toBeNull();
    expect(secondaryBtn?.textContent?.trim()).toBe('Browse by craft');
  });

  it('verifies structural visual distinction between Marketplace hero and Homepage hero', async () => {
    // Render Homepage first
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                </Routes>
              </AudioHelpProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    // Homepage hero is left-aligned functional intro
    expect(container.textContent).toContain('Built for India’s artisans');
    expect(container.textContent).toContain('From handmade craft to a market-ready catalogue.');
    expect(container.querySelector('.marketplace-hero')).toBeNull();

    // Cleanly unmount and remount for Marketplace
    await act(async () => {
      root.unmount();
    });
    root = createRoot(container);

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

    // Marketplace hero is centred editorial craft discovery
    expect(container.querySelector('.marketplace-hero')).not.toBeNull();
    expect(container.querySelector('.marketplace-hero__content')).not.toBeNull();
    expect(container.textContent).toContain('Made by hand.');
    expect(container.textContent).toContain('Shared with meaning.');
  });

  it('keeps hero actions interactive and triggers scroll handlers without errors', async () => {
    await renderMarketplace();

    const primaryBtn = container.querySelector('.marketplace-hero__btn--primary') as HTMLButtonElement;
    const secondaryBtn = container.querySelector('.marketplace-hero__btn--secondary') as HTMLButtonElement;

    expect(primaryBtn).not.toBeNull();
    expect(secondaryBtn).not.toBeNull();

    // Trigger clicks
    await act(async () => {
      primaryBtn.click();
      secondaryBtn.click();
    });

    expect(container.textContent).toContain('Explore by craft');
    expect(container.textContent).toContain('Selected handmade pieces');
  });
});
