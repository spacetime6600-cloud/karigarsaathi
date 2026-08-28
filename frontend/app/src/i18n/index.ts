import { en } from './locales/en';
import { hi } from './locales/hi';
import { or } from './locales/or';
import { bn } from './locales/bn';
import { te } from './locales/te';
import { LanguageOption, SupportedLanguage } from '@/types';
export type { SupportedLanguage };

export const supportedLanguages: LanguageOption[] = [
  { code: 'hi', name: 'हिंदी', englishName: 'Hindi', script: 'Devanagari', badge: 'लोकप्रिय' },
  { code: 'en', name: 'English', englishName: 'English', script: 'Latin' },
  { code: 'or', name: 'ଓଡ଼ିଆ', englishName: 'Odia', script: 'Odia' },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali', script: 'Bengali' },
  { code: 'te', name: 'తెలుగు', englishName: 'Telugu', script: 'Telugu' },
];

export const dictionaries = { en, hi, or, bn, te };

export type TranslationKey = keyof typeof en;

export function getNestedTranslation(
  obj: Record<string, unknown>,
  path: string,
  params?: Record<string, string | number>
): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  if (typeof current === 'string') {
    if (!params) return current;
    return current.replace(/\{\{(\w+)\}\}/g, (_: string, match: string) => {
      return params[match] !== undefined ? String(params[match]) : `{{${match}}}`;
    });
  }

  return path;
}
