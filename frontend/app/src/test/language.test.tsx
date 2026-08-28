import { describe, it, expect } from 'vitest';
import { supportedLanguages, dictionaries, getNestedTranslation } from '@/i18n';

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
  });

  it('provides Hindi localized strings for key CTAs', () => {
    expect(dictionaries.hi.common.continue).toBe('आगे बढ़ें');
    expect(dictionaries.hi.common.appName).toBe('कारीगर साथी');
    expect(dictionaries.hi.dashboard.addNewProduct).toBe('नया उत्पाद जोड़ें');
  });
});
