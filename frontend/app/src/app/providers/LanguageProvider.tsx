import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '@/types';
import { dictionaries, getNestedTranslation, supportedLanguages } from '@/i18n';
import { storage } from '@/services/storage/localStorage';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  currentLanguageMeta: (typeof supportedLanguages)[number];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    return storage.get<SupportedLanguage>('selectedLanguage', 'hi');
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    storage.set('selectedLanguage', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[language] || dictionaries.en;
    let res = getNestedTranslation(dict, path, params);
    if (res === path && language !== 'en') {
      // Fallback to English dictionary if translation key is missing in chosen language
      res = getNestedTranslation(dictionaries.en, path, params);
    }
    return res;
  };

  const currentLanguageMeta =
    supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLanguageMeta }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
