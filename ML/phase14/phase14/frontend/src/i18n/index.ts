import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import or from './locales/or.json';
import bn from './locales/bn.json';
import te from './locales/te.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  or: { translation: or },
  bn: { translation: bn },
  te: { translation: te },
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  or: 'ଓଡ଼ିଆ',
  bn: 'বাংলা',
  te: 'తెలుగు',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: LANGUAGE_LABELS.en },
  { code: 'hi', label: LANGUAGE_LABELS.hi },
  { code: 'or', label: LANGUAGE_LABELS.or },
  { code: 'bn', label: LANGUAGE_LABELS.bn },
  { code: 'te', label: LANGUAGE_LABELS.te },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export const getLanguageLabel = (code: string): string => {
  return LANGUAGE_LABELS[code] || code;
};

export default i18n;