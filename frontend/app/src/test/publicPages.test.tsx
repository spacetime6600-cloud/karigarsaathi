import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { AboutPage } from '@/features/about/AboutPage';
import { MarketplacePage } from '@/features/marketplace/MarketplacePage';
import { ProductDetailPage } from '@/features/marketplace/ProductDetailPage';
import { ReviewsPage } from '@/features/reviews/ReviewsPage';
import { SignInPage } from '@/features/authentication/SignInPage';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AudioHelpProvider } from '@/app/providers/AudioHelpProvider';
import { storage } from '@/services/storage/localStorage';

describe('Public Navigation & New Public Pages (About Us, Marketplace, Reviews)', () => {
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

  const renderAppAtRoute = async (initialRoute = '/') => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/marketplace/products/:productId" element={<ProductDetailPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/login" element={<SignInPage />} />
                </Routes>
              </AudioHelpProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });
  };

  it('verifies top header nav has About Us, Marketplace, Reviews and NOT old section links in header', async () => {
    await renderAppAtRoute('/');

    const header = container.querySelector('header');
    expect(header).not.toBeNull();

    const nav = header?.querySelector('nav[aria-label="Public Navigation"]');
    expect(nav).not.toBeNull();

    // Nav links must be About Us, Marketplace, Reviews
    expect(nav?.textContent).toContain('About Us');
    expect(nav?.textContent).toContain('Marketplace');
    expect(nav?.textContent).toContain('Reviews');

    // Header nav must NOT contain old section anchor links
    expect(nav?.textContent).not.toContain('How it works');
    expect(nav?.textContent).not.toContain('Features');
    expect(nav?.textContent).not.toContain('Craft map');

    // But the homepage sections themselves MUST still exist in the body!
    expect(container.querySelector('#how-it-works')).not.toBeNull();
    expect(container.querySelector('#features')).not.toBeNull();
    expect(container.querySelector('#craft-map-section')).not.toBeNull();
  });

  it('renders About Us page (/about) with core ethics, challenges, and toolkit sections', async () => {
    await renderAppAtRoute('/about');

    expect(container.textContent).toContain('Technology that works with artisans, not around them.');
    expect(container.textContent).toContain(
      'KarigarSaathi helps artisans transform handmade products into clear, market-ready digital catalogues'
    );
    expect(container.textContent).toContain('The challenge of handmade craft digitisation');
    expect(container.textContent).toContain('A complete toolkit built for authentic craft');
    expect(container.textContent).toContain('Designed for the entire craft ecosystem');
    expect(container.textContent).toContain('Artisans');
    expect(container.textContent).toContain('Coordinators');
    expect(container.textContent).toContain('Buyers');
    expect(container.textContent).toContain('The artisan retains complete ownership and approval.');
    expect(container.textContent).toContain('Explore the marketplace');

    // Verify active link state on /about
    const activeLink = container.querySelector('nav a[aria-current="page"]');
    expect(activeLink?.textContent).toContain('About Us');
  });

  it('renders Editorial Marketplace page (/marketplace) with hero, category row, featured spotlight, and product grid', async () => {
    await renderAppAtRoute('/marketplace');

    // Hero headline and copy
    expect(container.textContent).toContain('Made by hand.');
    expect(container.textContent).toContain('Shared with meaning.');
    expect(container.textContent).toContain('Discover handmade products, regional traditions');

    // Editorial sections
    expect(container.textContent).toContain('Explore by craft');
    expect(container.textContent).toContain('Featured craftsmanship');
    expect(container.textContent).toContain('Selected handmade pieces');
    expect(container.textContent).toContain('The story behind each piece');
    expect(container.textContent).toContain('Explore crafts across India');
    expect(container.textContent).toContain('What buyers are saying');

    // Products present
    expect(container.textContent).toContain('Indigo & Terracotta Silk Jamdani Saree');
    expect(container.textContent).toContain('Jaipur Blue Pottery');
    expect(container.textContent).toContain('Raghurajpur Pattachitra');

    // Active link state
    const activeLink = container.querySelector('nav a[aria-current="page"]');
    expect(activeLink?.textContent).toContain('Marketplace');

    // Test search filter
    const searchInput = container.querySelector('input[aria-label="Search products, crafts, artisans or regions"]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    await act(async () => {
      searchInput.value = 'Jamdani';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(container.textContent).toContain('Indigo & Terracotta Silk Jamdani Saree');
  });

  it('renders Reviews page (/reviews) with dynamic metrics summary and verified buyer reviews', async () => {
    await renderAppAtRoute('/reviews');

    expect(container.textContent).toContain('Stories from buyers and craft communities.');
    expect(container.textContent).toContain('Based on 4 verified experiences');
    expect(container.textContent).toContain('Product Quality');
    expect(container.textContent).toContain('Authenticity');
    expect(container.textContent).toContain('Communication');
    expect(container.textContent).toContain('Ananya Sharma');
    expect(container.textContent).toContain('Verified Buyer');

    // Verify active link state on /reviews
    const activeLink = container.querySelector('nav a[aria-current="page"]');
    expect(activeLink?.textContent).toContain('Reviews');
  });
});
