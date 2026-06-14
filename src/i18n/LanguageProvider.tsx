import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { STORAGE_KEYS } from '@common/constants';

import { en } from './en';
import { translate } from './translate';
import type { Language, TranslateParams } from './types';
import { uk } from './uk';

const DICTIONARIES = { en, uk } as const;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslateParams) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

const readInitialLanguage = (): Language => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.language);
    if (stored === 'en' || stored === 'uk') {
      return stored;
    }
  } catch {
    // fall through to navigator/default
  }
  return navigator.language.toLowerCase().startsWith('uk') ? 'uk' : 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEYS.language, next);
    } catch {
      // Persistence is best-effort; the session still switches in memory.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) => translate(DICTIONARIES[language], key, params),
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
