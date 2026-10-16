import en from './locales/en.js';
import fr from './locales/fr.js';
import zhHant from './locales/zh-Hant.js';
import zhHans from './locales/zh-Hans.js';
import hi from './locales/hi.js';

// `code` is used for <html lang>; `name` is shown in the language picker in its own language.
export const LOCALES = [
  { code: 'en', name: 'English', messages: en },
  { code: 'fr', name: 'Français', messages: fr },
  { code: 'zh-Hant', name: '繁體中文', messages: zhHant },
  { code: 'zh-Hans', name: '简体中文', messages: zhHans },
  { code: 'hi', name: 'हिन्दी', messages: hi },
];

export const DEFAULT_LOCALE = 'en';
const byCode = Object.fromEntries(LOCALES.map((l) => [l.code, l]));

export const LOCALE_PARAM = 'lang';

/**
 * Map a language tag from the ?lang= query parameter to a supported locale, or null if unsupported.
 * Accepts exact codes (zh-Hant) and common variants (zh-TW, zh-HK, zh-CN, fr-CA, hi-IN), case-insensitively.
 */
export function resolveLocale(tag) {
  const lower = String(tag ?? '').trim().toLowerCase();
  if (!lower) return null;
  if (lower.startsWith('zh')) return /hant|-tw|-hk|-mo/.test(lower) ? 'zh-Hant' : 'zh-Hans';
  const base = lower.split(/[-_]/)[0];
  return Object.hasOwn(byCode, base) ? base : null;
}

/** Supported locale from ?lang= in a URL query string, or null. */
export function localeFromSearch(search) {
  return resolveLocale(new URLSearchParams(search).get(LOCALE_PARAM));
}

/**
 * Starting language, in priority order:
 * 1. ?lang= in the URL  2. the last language picked in the menu  3. the browser's languages  4. English
 */
export function chooseLocale({ search = '', stored = null, languages = [] } = {}) {
  return localeFromSearch(search)
    ?? resolveLocale(stored)
    ?? languages.map(resolveLocale).find(Boolean)
    ?? DEFAULT_LOCALE;
}

/** The same URL with ?lang= set to `locale`, or removed when `locale` is null. */
export function urlWithLocale(href, locale) {
  const url = new URL(href);
  if (locale) url.searchParams.set(LOCALE_PARAM, locale);
  else url.searchParams.delete(LOCALE_PARAM);
  return url.toString();
}

/** Look up a message, falling back to English, then to the key. Replaces {name} placeholders. */
export function translate(locale, key, vars) {
  const message = byCode[locale]?.messages[key] ?? en[key] ?? key;
  if (!vars) return message;
  return message.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
