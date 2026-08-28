import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ArtisanAppShell } from '@/layouts/ArtisanAppShell';
import { BuyerEnquiryPage } from '@/features/enquiries/BuyerEnquiryPage';
import { EnquiryReplyPage } from '@/features/enquiries/pages/EnquiryReplyPage';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AudioHelpProvider } from '@/app/providers/AudioHelpProvider';
import { SyncProvider } from '@/app/providers/SyncProvider';
import { ProductDraftProvider } from '@/app/providers/ProductDraftProvider';
import { storage } from '@/services/storage/localStorage';
import { enquiryService } from '@/services/api/enquiryService';

describe('Slim Centered Top Navigation & User Flows', () => {
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

  const renderFullShellWithRoutes = async (initialRoute = '/artisan/dashboard') => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider>
            <LanguageProvider>
              <AudioHelpProvider>
                <SyncProvider>
                  <ProductDraftProvider>
                    <Routes>
                      <Route path="/" element={<ArtisanAppShell />}>
                        <Route path="artisan/dashboard" element={<div>Dashboard Content</div>} />
                        <Route path="enquiries" element={<BuyerEnquiryPage />} />
                        <Route path="enquiries/:enquiryId/reply" element={<EnquiryReplyPage />} />
                        <Route path="enquiries/:enquiryId" element={<EnquiryReplyPage />} />
                      </Route>
                    </Routes>
                  </ProductDraftProvider>
                </SyncProvider>
              </AudioHelpProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });
  };

  it('renders slim 3-region header with left nav, centered brand, and right utilities', async () => {
    await renderFullShellWithRoutes('/artisan/dashboard');

    const header = container.querySelector('header');
    expect(header).not.toBeNull();

    // Centered brand identity
    expect(header?.textContent).toContain('KarigarSaathi');
    expect(header?.textContent).toContain('Artisan Workspace');

    // Left nav links
    expect(header?.textContent).toContain('Home');
    expect(header?.textContent).toContain('New Product');

    // Right utilities
    expect(header?.textContent).toContain('Listen');
    expect(header?.textContent).toContain('English');
    expect(header?.textContent).toMatch(/SAVED|SYNCED/);
  });

  it('verifies popup record and repository ID consistency', () => {
    const list = enquiryService.listEnquiries();
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.find((e) => e.id === 'enq_101')?.buyerName).toBe('Ananya Deshmukh');
    expect(list.find((e) => e.id === 'enq_102')?.buyerName).toBe('CraftBazaar Boutique (Kiran Sen)');
  });

  it('performs complete browser user flow: popup click -> CraftBazaar (enq_102) -> reply -> Ananya (enq_101) -> View all', async () => {
    await renderFullShellWithRoutes('/artisan/dashboard');

    // 1. Click message icon
    const messageButton = container.querySelector('button[aria-label="Open buyer enquiries"]') as HTMLButtonElement;
    expect(messageButton).not.toBeNull();

    await act(async () => {
      messageButton.click();
    });

    // 2. Confirm popover appears with 380px compact structure
    const popover = container.querySelector('#buyer-enquiries-popover');
    expect(popover).not.toBeNull();
    expect(popover?.textContent).toContain('Buyer Enquiries');
    expect(popover?.className).toContain('max-w-[390px]');

    // 3. Confirm CraftBazaar row is an anchor link with href="/enquiries/enq_102/reply"
    const enquiryLinks = Array.from(popover?.querySelectorAll('a') || []);
    const craftBazaarLink = enquiryLinks.find((l) => l.textContent?.includes('CraftBazaar Boutique'));
    expect(craftBazaarLink).toBeDefined();
    expect(craftBazaarLink?.getAttribute('href')).toBe('/enquiries/enq_102/reply');

    // 4. Click CraftBazaar row link
    await act(async () => {
      craftBazaarLink?.click();
    });

    // 5. Confirm popover closes and dedicated EnquiryReplyPage renders CraftBazaar's thread with Reference: enq_102
    expect(container.querySelector('#buyer-enquiries-popover')).toBeNull();
    expect(container.textContent).toContain('Buyer Enquiry');
    expect(container.textContent).toContain('Reference: enq_102');
    expect(container.textContent).toContain('CraftBazaar Boutique (Kiran Sen)');
    expect(container.textContent).toContain('Bengaluru, Karnataka');
    expect(container.textContent).toContain('Interested in wholesale bulk order of 25 basket sets');

    // 6. Type and send a reply on the dedicated page
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();

    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      nativeSetter?.call(textarea, 'We have confirmed the shipment schedule for 25 sets!');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const sendButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(sendButton).not.toBeNull();
    expect(sendButton.disabled).toBe(false);

    await act(async () => {
      sendButton.click();
    });

    // Verify reply rendered in the page's message thread
    expect(container.textContent).toContain('We have confirmed the shipment schedule for 25 sets!');
    expect(container.textContent).toContain('Reply sent successfully');

    // 7. Reopen popover and click Ananya Deshmukh (enq_101)
    await act(async () => {
      messageButton.click();
    });

    const popoverAgain = container.querySelector('#buyer-enquiries-popover');
    expect(popoverAgain).not.toBeNull();

    const enquiryLinksAgain = Array.from(popoverAgain?.querySelectorAll('a') || []);
    const ananyaLink = enquiryLinksAgain.find((l) => l.textContent?.includes('Ananya Deshmukh'));
    expect(ananyaLink).toBeDefined();
    expect(ananyaLink?.getAttribute('href')).toBe('/enquiries/enq_101/reply');

    await act(async () => {
      ananyaLink?.click();
    });

    // 8. Confirm Ananya conversation rendered on dedicated reply page with Reference: enq_101
    expect(container.querySelector('#buyer-enquiries-popover')).toBeNull();
    expect(container.textContent).toContain('Reference: enq_101');
    expect(container.textContent).toContain('Ananya Deshmukh');
    expect(container.textContent).toContain('Mumbai, Maharashtra');
    expect(container.textContent).toContain('Namaste Ravi ji! I saw your verified Craft Passport');

    // 9. Reopen popover and click View all enquiries
    await act(async () => {
      messageButton.click();
    });

    const popoverFinal = container.querySelector('#buyer-enquiries-popover');
    expect(popoverFinal).not.toBeNull();

    const viewAllLink = popoverFinal?.querySelector('a[href="/enquiries"]') as HTMLAnchorElement;
    expect(viewAllLink).not.toBeNull();
    expect(viewAllLink.textContent).toContain('View all enquiries');

    await act(async () => {
      viewAllLink.click();
    });

    expect(container.querySelector('#buyer-enquiries-popover')).toBeNull();
    expect(container.textContent).toContain('Buyer Enquiries & Orders');
  });

  it('renders safe not-found error state on dedicated page when invalid enquiry ID is accessed', async () => {
    await renderFullShellWithRoutes('/enquiries/invalid_random_999/reply');

    expect(container.textContent).toContain('Enquiry Not Found');
    expect(container.textContent).toContain('invalid_random_999');
    expect(container.textContent).toContain('Back to Enquiries');
  });

  it('toggles mobile menu and closes on Escape key', async () => {
    await renderFullShellWithRoutes('/artisan/dashboard');

    const menuButton = container.querySelector('button[aria-label="Open navigation menu"]') as HTMLButtonElement;
    expect(menuButton).not.toBeNull();

    // Open mobile menu
    await act(async () => {
      menuButton.click();
    });
    expect(container.querySelector('div[aria-label="Mobile Navigation Menu"]')).not.toBeNull();

    // Press Escape to close
    await act(async () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
      container.querySelector('header')?.dispatchEvent(escapeEvent);
    });
    expect(container.querySelector('div[aria-label="Mobile Navigation Menu"]')).toBeNull();
  });
});
