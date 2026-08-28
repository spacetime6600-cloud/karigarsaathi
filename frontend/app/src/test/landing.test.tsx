import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { SignInPage } from '@/features/authentication/SignInPage';
import { INDIA_CRAFT_REGIONS } from '@/data/indiaCraftMapData';
import { VERIFIED_INDIA_MAP_PATHS } from '@/data/indiaMapPaths';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AudioHelpProvider } from '@/app/providers/AudioHelpProvider';
import { storage } from '@/services/storage/localStorage';

describe('Public KarigarSaathi Landing Homepage, Visual Ecosystem & Accurate India Craft Map', () => {
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

  const renderLandingApp = async (initialRoute = '/') => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<SignInPage />} />
                </Routes>
              </AudioHelpProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });
  };

  it('renders full-bleed ecosystem panoramic craft hero with exact copy and no blurred placeholder', async () => {
    await renderLandingApp('/');

    // Public header & page links
    expect(container.textContent).toContain('KarigarSaathi');
    expect(container.textContent).toContain('About Us');
    expect(container.textContent).toContain('Marketplace');
    expect(container.textContent).toContain('Reviews');
    expect(container.textContent).toContain('How it works');
    expect(container.textContent).toContain('Features');
    expect(container.textContent).toContain('Craft map');

    // Hero section
    expect(container.textContent).toContain('Built for India’s artisans');
    expect(container.textContent).toContain('From handmade craft to a market-ready catalogue.');
    expect(container.textContent).toContain(
      'Photograph products, describe the craft, understand fair pricing, create a Craft Passport and respond to buyer enquiries.'
    );

    // Verify picture and ecosystem panoramic image are present
    const pictures = container.querySelectorAll('picture');
    expect(pictures.length).toBeGreaterThan(0);
    const heroImg = pictures[0]?.querySelector('img');
    expect(heroImg).not.toBeNull();
    const src = heroImg?.getAttribute('src') || '';
    expect(src.includes('craft-hero-panorama') || src.includes('artisan-hero-poster')).toBe(true);

    // Verify no LANDING text or placeholder
    expect(container.textContent).not.toContain('LANDING');

    // Trust indicators
    expect(container.textContent).toContain('Voice-first');
    expect(container.textContent).toContain('Editable at every step');
    expect(container.textContent).toContain('Low-connectivity aware');
    expect(container.textContent).toContain('Artisan stays in control');
  });

  it('verifies 1:1 bidirectional integrity and cultural thumbnail metadata for all 36 entities', () => {
    expect(VERIFIED_INDIA_MAP_PATHS.length).toBe(36);
    expect(INDIA_CRAFT_REGIONS.length).toBe(36);

    const geoCodes = new Set(VERIFIED_INDIA_MAP_PATHS.map((p) => p.code));
    const dataCodes = new Set(INDIA_CRAFT_REGIONS.map((d) => d.code));

    // Every geometry feature must have matching cultural record
    for (const code of geoCodes) {
      expect(dataCodes.has(code)).toBe(true);
    }

    // Every cultural record must have matching geometry feature
    for (const code of dataCodes) {
      expect(geoCodes.has(code)).toBe(true);
    }

    const states = INDIA_CRAFT_REGIONS.filter((r) => r.type === 'state');
    const unionTerritories = INDIA_CRAFT_REGIONS.filter((r) => r.type === 'union-territory');

    expect(states.length).toBe(28);
    expect(unionTerritories.length).toBe(8);

    // Verify heroImage and featuredCrafts exist for every state and UT
    for (const r of INDIA_CRAFT_REGIONS) {
      expect(r.heroImage.src.length).toBeGreaterThan(3);
      expect(r.heroImage.alt.length).toBeGreaterThan(5);
      expect(r.featuredCrafts).toHaveLength(3);
    }
  });

  it('renders initial Craft Map in collapsed state without preselection or permanent details panel', async () => {
    await renderLandingApp('/');

    const mapSection = container.querySelector('#craft-map');
    expect(mapSection).not.toBeNull();
    expect(container.textContent).toContain('Choose a state or union territory to explore its craft traditions.');

    // Initial state must NOT show deep dive details panel or "Back to India" button
    expect(container.textContent).not.toContain('Back to India');
    expect(container.textContent).not.toContain('Featured crafts');
  });

  it('expands side-by-side details on clicking Rajasthan and collapses back on clicking Back to India', async () => {
    await renderLandingApp('/');

    // Find Rajasthan path element
    const rjPath = container.querySelector('[data-state-code="RJ"]') as SVGPathElement;
    expect(rjPath).not.toBeNull();

    // Click Rajasthan
    await act(async () => {
      rjPath.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Panel should now be expanded with Rajasthan details
    expect(container.textContent).toContain('Rajasthan');
    expect(container.textContent).toContain('Jaipur Blue Pottery');
    expect(container.textContent).toContain('Bagru & Sanganeri Block Print');
    expect(container.textContent).toContain('Back to India');

    // Click "Back to India" button
    const backBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Back to India')
    );
    expect(backBtn).toBeDefined();

    await act(async () => {
      backBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Details panel should be dismissed and map restored to centered state
    expect(container.textContent).not.toContain('Back to India');
    expect(container.textContent).not.toContain('Featured crafts');
  });

  it('updates small glass hover card exclusively for the currently hovered or focused region', async () => {
    await renderLandingApp('/');

    const mnPath = container.querySelector('[data-state-code="MN"]') as SVGPathElement;
    expect(mnPath).not.toBeNull();

    // Focus/Hover on Manipur
    await act(async () => {
      mnPath.dispatchEvent(new Event('focusin', { bubbles: true }));
      mnPath.dispatchEvent(new Event('focus', { bubbles: true }));
      mnPath.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      mnPath.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));
    });

    expect(container.textContent).toContain('Manipur');

    // Blur / leave Manipur
    await act(async () => {
      mnPath.dispatchEvent(new Event('focusout', { bubbles: true }));
      mnPath.dispatchEvent(new Event('blur', { bubbles: true }));
      mnPath.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    });

    // Tooltip should clear
    expect(container.textContent).not.toContain('North-Eastern India');
  });

  it('triggers expanded layout and updates selection when choosing through accessible select dropdown', async () => {
    await renderLandingApp('/');

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();

    // Select Assam via dropdown
    await act(async () => {
      select.value = 'AS';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(container.textContent).toContain('Assam');
    expect(container.textContent).toContain('Muga & Eri Silk Weaving');
    expect(container.textContent).toContain('Back to India');

    // Switch selection to Odisha
    await act(async () => {
      select.value = 'OD';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(container.textContent).toContain('Odisha');
    expect(container.textContent).toContain('Raghurajpur Pattachitra');
    expect(container.textContent).toContain('Cuttack Silver Filigree');
  });
});
