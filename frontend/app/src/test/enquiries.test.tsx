import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BuyerEnquiryPage } from '@/features/enquiries/BuyerEnquiryPage';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { SyncProvider } from '@/app/providers/SyncProvider';
import { enquiryService } from '@/services/api/enquiryService';
import { syncService } from '@/services/storage/syncService';
import { storage } from '@/services/storage/localStorage';

describe('Buyer Enquiries & Reply Workspace', () => {
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

  it('loads seed buyer enquiries with proper message history', () => {
    const list = enquiryService.listEnquiries();
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].buyerName).toBeDefined();
    expect(list[0].initialMessage).toBeDefined();
  });

  it('adds reply to existing enquiry without creating duplicate thread', () => {
    const enquiry = enquiryService.listEnquiries()[0];
    const initialCount = enquiry.replies.length;

    const updated = enquiryService.addReply(enquiry.id, 'Thank you for your interest! We can fulfill this.', 14500);

    expect(updated).not.toBeNull();
    expect(updated?.replies).toHaveLength(initialCount + 1);
    expect(updated?.status).toBe('replied');
  });

  it('queues offline replies without duplication and clears on sync', () => {
    syncService.clearQueue();
    expect(syncService.getQueue()).toHaveLength(0);

    syncService.addToQueue('enquiry_reply', { enquiryId: 'enq_101', text: 'Offline reply' });
    expect(syncService.getQueue()).toHaveLength(1);

    syncService.clearQueue();
    expect(syncService.getQueue()).toHaveLength(0);
  });

  it('renders BuyerEnquiryPage with message thread, reply form and enquiry switcher', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/artisan/enquiries/enq_101']}>
          <AuthProvider>
            <LanguageProvider>
              <SyncProvider>
                <Routes>
                  <Route path="/artisan/enquiries/:enquiryId" element={<BuyerEnquiryPage />} />
                </Routes>
              </SyncProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Buyer Enquiries & Orders');
    expect(container.textContent).toContain('Ananya Deshmukh');
    expect(container.textContent).toContain('Send Message & Price Quote');
    expect(container.querySelector('textarea')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it('renders safe not-found error state when invalid enquiry ID is accessed', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/artisan/enquiries/invalid_999']}>
          <AuthProvider>
            <LanguageProvider>
              <SyncProvider>
                <Routes>
                  <Route path="/artisan/enquiries/:enquiryId" element={<BuyerEnquiryPage />} />
                </Routes>
              </SyncProvider>
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(container.textContent).toContain('Enquiry Not Found');
    expect(container.textContent).toContain('invalid_999');
    expect(container.textContent).toContain('View All Enquiries');
  });
});
