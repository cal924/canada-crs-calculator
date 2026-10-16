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

export const isLocale = (code) => Object.hasOwn(byCode, code);

/** Pick the best supported locale from a list of browser language tags (e.g. navigator.languages). */
export function detectLocale(languages = []) {
  for (const tag of languages) {
    const lower = String(tag).toLowerCase();
    if (lower.startsWith('zh')) {
      return /hant|-tw|-hk|-mo/.test(lower) ? 'zh-Hant' : 'zh-Hans';
    }
    const base = lower.split('-')[0];
    if (base === 'fr') return 'fr';
    if (base === 'hi') return 'hi';
    if (base === 'en') return 'en';
  }
  return DEFAULT_LOCALE;
}

/** Look up a message, falling back to English, then to the key. Replaces {name} placeholders. */
export function translate(locale, key, vars) {
  const message = byCode[locale]?.messages[key] ?? en[key] ?? key;
  if (!vars) return message;
  return message.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
