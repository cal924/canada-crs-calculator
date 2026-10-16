import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALES, LOCALE_PARAM, chooseLocale, localeFromSearch, translate, urlWithLocale } from './index.js';

const STORAGE_KEY = 'crs-locale';
const I18nContext = createContext(null);

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

// Starting language: ?lang= → last language picked in the menu → browser languages → English.
function initialLocale() {
  return chooseLocale({
    search: window.location.search,
    stored: readStored(),
    languages: navigator.languages?.length ? navigator.languages : [navigator.language],
  });
}

const replaceUrl = (href) => {
  if (href !== window.location.href) window.history.replaceState(window.history.state, '', href);
};

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(initialLocale);

  // Picking from the menu is remembered for future visits and written to ?lang= so the address can be shared.
  // A ?lang= link on its own only applies to that visit.
  const setLocale = useCallback((next) => {
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
    replaceUrl(urlWithLocale(window.location.href, next));
    setLocaleState(next);
  }, []);

  const t = useCallback((key, vars) => translate(locale, key, vars), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('app.docTitle');
  }, [locale, t]);

  useEffect(() => {
    // Drop an unsupported ?lang= value (e.g. ?lang=de) from the address.
    const params = new URLSearchParams(window.location.search);
    if (params.has(LOCALE_PARAM) && !localeFromSearch(window.location.search)) {
      replaceUrl(urlWithLocale(window.location.href, null));
    }
    // Follow back/forward navigation between URLs with different ?lang= values.
    const onPopState = () => setLocaleState(initialLocale());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const value = useMemo(() => ({ locale, setLocale, t, locales: LOCALES }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
