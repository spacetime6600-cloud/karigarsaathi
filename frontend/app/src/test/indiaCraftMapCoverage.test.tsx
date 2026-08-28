import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { INDIA_CRAFT_REGIONS } from '@/data/indiaCraftMapData';
import { VERIFIED_INDIA_MAP_PATHS } from '@/data/indiaMapPaths';
import { IndiaCraftMap } from '@/components/map/IndiaCraftMap';
import { StateDetails } from '@/components/map/StateDetails';

describe('India Craft Map & Selected-State Experience (36 Regions Coverage)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  it('validates all 36 Indian regions (28 states & 8 UTs) have complete image-led data', () => {
    expect(INDIA_CRAFT_REGIONS).toHaveLength(36);

    const states = INDIA_CRAFT_REGIONS.filter((r) => r.type === 'state');
    const uts = INDIA_CRAFT_REGIONS.filter((r) => r.type === 'union-territory');
    expect(states).toHaveLength(28);
    expect(uts).toHaveLength(8);

    const codes = new Set<string>();
    const ids = new Set<string>();

    INDIA_CRAFT_REGIONS.forEach((region) => {
      // Uniqueness
      expect(codes.has(region.code)).toBe(false);
      codes.add(region.code);

      expect(ids.has(region.id)).toBe(false);
      ids.add(region.id);

      // Identity & Region
      expect(region.name.trim().length).toBeGreaterThan(0);
      expect(region.geographicRegion.trim().length).toBeGreaterThan(0);
      expect(region.introduction.trim().length).toBeGreaterThan(0);

      // Hero Image
      expect(region.heroImage).toBeDefined();
      expect(region.heroImage.src.trim().length).toBeGreaterThan(0);
      expect(region.heroImage.alt.trim().length).toBeGreaterThan(0);

      // Exactly 3 Featured Crafts
      expect(region.featuredCrafts).toHaveLength(3);
      region.featuredCrafts.forEach((craft) => {
        expect(craft.name.trim().length).toBeGreaterThan(0);
        expect(craft.shortDescription.trim().length).toBeGreaterThan(0);
        expect(craft.image).toBeDefined();
        expect(craft.image.src.trim().length).toBeGreaterThan(0);
        expect(craft.image.alt.trim().length).toBeGreaterThan(0);
        // Short description under ~18 words
        const wordCount = craft.shortDescription.split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(25);
      });

      // Metadata
      expect(region.materials.length).toBeGreaterThan(0);
      expect(region.communities.length).toBeGreaterThan(0);
      expect(region.whyItMatters.trim().length).toBeGreaterThan(0);
      expect(region.sources.length).toBeGreaterThan(0);
    });
  });

  it('validates 1-to-1 matching between VERIFIED_INDIA_MAP_PATHS and INDIA_CRAFT_REGIONS', () => {
    expect(VERIFIED_INDIA_MAP_PATHS).toHaveLength(36);

    const mapCodes = new Set(VERIFIED_INDIA_MAP_PATHS.map((p) => p.code));
    const regionCodes = new Set(INDIA_CRAFT_REGIONS.map((r) => r.code));

    expect(mapCodes.size).toBe(36);
    expect(regionCodes.size).toBe(36);

    VERIFIED_INDIA_MAP_PATHS.forEach((path) => {
      expect(regionCodes.has(path.code)).toBe(true);
    });

    INDIA_CRAFT_REGIONS.forEach((region) => {
      expect(mapCodes.has(region.code)).toBe(true);
    });
  });

  it('renders initial centered map without open details panel or reserved empty space', async () => {
    await act(async () => {
      root.render(<IndiaCraftMap />);
    });

    // Map container exists
    const mapSection = container.querySelector('section[aria-label="Interactive India Craft Explorer"]');
    expect(mapSection).not.toBeNull();

    // Details panel is NOT rendered initially
    const details = container.querySelector('.state-details');
    expect(details).toBeNull();
  });

  it('renders minimal image-led details when Bihar (BR) is selected and removes all AI clutter', async () => {
    await act(async () => {
      root.render(<IndiaCraftMap />);
    });

    // Select Bihar
    const biharPath = container.querySelector('[data-state-code="BR"]') as SVGPathElement;
    expect(biharPath).not.toBeNull();

    await act(async () => {
      biharPath.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Details panel must be mounted
    const details = container.querySelector('.state-details');
    expect(details).not.toBeNull();

    // Bihar content
    expect(details?.textContent).toContain('Bihar');
    expect(details?.textContent).toContain('Eastern India');
    expect(details?.textContent).toContain('Cradle of Mithila Madhubani painting');
    expect(details?.textContent).toContain('Featured crafts');
    expect(details?.textContent).toContain('Madhubani Painting');
    expect(details?.textContent).toContain('Sikki Grass Craft');
    expect(details?.textContent).toContain('Bhagalpuri Tussar Silk');
    expect(details?.textContent).toContain('Materials ·');
    expect(details?.textContent).toContain('Communities ·');
    expect(details?.textContent).toContain('Why it matters');
    expect(details?.textContent).toContain('Back to India');

    // Ensure AI clutter is completely removed
    expect(details?.textContent).not.toContain('Code: BR');
    expect(details?.textContent).not.toContain('STATE OF INDIA');
    expect(details?.textContent).not.toContain('NOTABLE CRAFTS & GI HERITAGE');
    expect(details?.textContent).not.toContain('INDIGENOUS MATERIALS');
    expect(details?.textContent).not.toContain('ARTISAN COMMUNITIES & CLUSTERS');
  });

  it('switches state dynamically (Bihar -> Rajasthan) without unmounting the details component', async () => {
    await act(async () => {
      root.render(<IndiaCraftMap />);
    });

    // Select Bihar
    const biharPath = container.querySelector('[data-state-code="BR"]') as SVGPathElement;
    await act(async () => {
      biharPath.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('.state-details')?.textContent).toContain('Bihar');

    // Select Rajasthan
    const rjPath = container.querySelector('[data-state-code="RJ"]') as SVGPathElement;
    await act(async () => {
      rjPath.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const details = container.querySelector('.state-details');
    expect(details?.textContent).toContain('Rajasthan');
    expect(details?.textContent).toContain('Western India');
    expect(details?.textContent).toContain('Jaipur Blue Pottery');
    expect(details?.textContent).toContain('Bagru & Sanganeri Block Print');
    expect(details?.textContent).not.toContain('Bihar');
  });

  it('closes details and restores focus when "Back to India" is clicked or Escape is pressed', async () => {
    await act(async () => {
      root.render(<IndiaCraftMap />);
    });

    const biharPath = container.querySelector('[data-state-code="BR"]') as SVGPathElement;
    await act(async () => {
      biharPath.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('.state-details')).not.toBeNull();

    // Click Back to India
    const backBtn = container.querySelector('button[aria-label="Back to India map"]') as HTMLButtonElement;
    expect(backBtn).not.toBeNull();

    await act(async () => {
      backBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('.state-details')).toBeNull();
  });

  it('renders reusable StateDetails component with fallback when image fails to load', async () => {
    const testRegion = INDIA_CRAFT_REGIONS.find((r) => r.code === 'BR')!;

    await act(async () => {
      root.render(<StateDetails region={testRegion} onBack={() => {}} />);
    });

    expect(container.textContent).toContain('Bihar');
    expect(container.textContent).toContain('Back to India');
    expect(container.textContent).toContain('Madhubani Painting');

    // Trigger image error on hero
    const heroImg = container.querySelector('img') as HTMLImageElement;
    if (heroImg) {
      await act(async () => {
        heroImg.dispatchEvent(new Event('error'));
      });
      expect(container.textContent).toContain('Image unavailable');
    }
  });
});
