import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { supportedLanguages, dictionaries, getNestedTranslation } from '@/i18n';
import { LanguageProvider, useLanguage } from '@/app/providers/LanguageProvider';
import { storage } from '@/services/storage/localStorage';

describe('Internationalization & Multi-Script Catalog', () => {
  it('supports 5 vernacular Indian languages with native scripts', () => {
    expect(supportedLanguages).toHaveLength(5);
    const codes = supportedLanguages.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('or');
    expect(codes).toContain('bn');
    expect(codes).toContain('te');
  });

  it('interpolates dynamic placeholders in translations correctly', () => {
    const translation = getNestedTranslation(dictionaries.en, 'dashboard.greeting', { name: 'Ravi' });
    expect(translation).toBe('Namaste, Ravi');

    const hiGreeting = getNestedTranslation(dictionaries.hi, 'dashboard.greeting', { name: 'रवि' });
    expect(hiGreeting).toBe('नमस्ते, रवि');
  });

  it('provides Hindi localized strings for key CTAs and top navigation', () => {
    expect(dictionaries.hi.common.continue).toBe('आगे बढ़ें');
    expect(dictionaries.hi.common.appName).toBe('कारीगर साथी');
    expect(dictionaries.hi.dashboard.addNewProduct).toBe('नया उत्पाद जोड़ें');
    expect(dictionaries.hi.nav.home).toBe('होम');
    expect(dictionaries.hi.nav.inventory).toBe('इन्वेंटरी');
    expect(dictionaries.hi.nav.newProduct).toBe('नया उत्पाद');
    expect(dictionaries.hi.nav.language).toBe('भाषा');
  });

  it('provides full Hindi dashboard vocabulary for workspace and tables', () => {
    expect(dictionaries.hi.dashboard.salesOverview).toBe('बिक्री विवरण');
    expect(dictionaries.hi.dashboard.unitsSold).toBe('बेची गई इकाइयां');
    expect(dictionaries.hi.dashboard.recordedSalesValue).toBe('दर्ज बिक्री मूल्य');
    expect(dictionaries.hi.dashboard.liveProducts).toBe('लाइव उत्पाद');
    expect(dictionaries.hi.dashboard.yourProducts).toBe('आपके उत्पाद');
    expect(dictionaries.hi.dashboard.viewInventory).toBe('इन्वेंटरी देखें');
    expect(dictionaries.hi.dashboard.colProduct).toBe('उत्पाद');
    expect(dictionaries.hi.dashboard.colPrice).toBe('मूल्य');
    expect(dictionaries.hi.dashboard.colStock).toBe('स्टॉक');
    expect(dictionaries.hi.dashboard.colStatus).toBe('स्थिति');
    expect(dictionaries.hi.dashboard.colAction).toBe('कार्रवाई');
    expect(dictionaries.hi.dashboard.statusReady).toBe('तैयार');
    expect(dictionaries.hi.dashboard.statusPublished).toBe('प्रकाशित');
    expect(dictionaries.hi.dashboard.statusDraft).toBe('ड्राफ्ट');
  });

  it('provides Bengali, Odia, and Telugu translations for top navigation and dashboard', () => {
    expect(dictionaries.bn.nav.home).toBe('হোম');
    expect(dictionaries.bn.dashboard.salesOverview).toBe('বিক্রয় বিবরণ');

    expect(dictionaries.or.nav.home).toBe('ହୋମ୍');
    expect(dictionaries.or.dashboard.salesOverview).toBe('ବିକ୍ରୟ ବିବରଣୀ');

    expect(dictionaries.te.nav.home).toBe('హోమ్');
    expect(dictionaries.te.dashboard.salesOverview).toBe('అమ్మకాల అవలోకనం');
  });

  it('reactively switches language and re-renders components using useLanguage', async () => {
    storage.clearAll();
    storage.set('selectedLanguage', 'en');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const TestComponent = () => {
      const { t, language, setLanguage } = useLanguage();
      return (
        <div>
          <span data-testid="lang">{language}</span>
          <span data-testid="greeting">{t('dashboard.greeting', { name: 'Ravi' })}</span>
          <span data-testid="salesOverview">{t('dashboard.salesOverview')}</span>
          <span data-testid="colProduct">{t('dashboard.colProduct')}</span>
          <button data-testid="btn-hi" onClick={() => setLanguage('hi')}>Switch to Hindi</button>
          <button data-testid="btn-bn" onClick={() => setLanguage('bn')}>Switch to Bengali</button>
        </div>
      );
    };

    await act(async () => {
      root.render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
    });

    expect(container.querySelector('[data-testid="lang"]')?.textContent).toBe('en');
    expect(container.querySelector('[data-testid="greeting"]')?.textContent).toBe('Namaste, Ravi');
    expect(container.querySelector('[data-testid="salesOverview"]')?.textContent).toBe('Sales overview');
    expect(container.querySelector('[data-testid="colProduct"]')?.textContent).toBe('Product');

    // Switch to Hindi
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="btn-hi"]')?.click();
    });

    expect(container.querySelector('[data-testid="lang"]')?.textContent).toBe('hi');
    expect(container.querySelector('[data-testid="greeting"]')?.textContent).toBe('नमस्ते, Ravi');
    expect(container.querySelector('[data-testid="salesOverview"]')?.textContent).toBe('बिक्री विवरण');
    expect(container.querySelector('[data-testid="colProduct"]')?.textContent).toBe('उत्पाद');
    expect(storage.get('selectedLanguage', 'en')).toBe('hi');

    // Switch to Bengali
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="btn-bn"]')?.click();
    });

    expect(container.querySelector('[data-testid="lang"]')?.textContent).toBe('bn');
    expect(container.querySelector('[data-testid="salesOverview"]')?.textContent).toBe('বিক্রয় বিবরণ');
    expect(container.querySelector('[data-testid="colProduct"]')?.textContent).toBe('পণ্য');
    expect(storage.get('selectedLanguage', 'en')).toBe('bn');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});

