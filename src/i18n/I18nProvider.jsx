import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALES, detectLocale, isLocale, translate } from './index.js';

const STORAGE_KEY = 'crs-locale';
const I18nContext = createContext(null);

function initialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch { /* storage unavailable */ }
  return detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(initialLocale);

  const t = useCallback((key, vars) => translate(locale, key, vars), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('app.docTitle');
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* ignore */ }
  }, [locale, t]);

  const value = useMemo(() => ({ locale, setLocale, t, locales: LOCALES }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
