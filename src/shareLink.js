import { urlWithLocale } from './i18n/index.js';

// Shareable state lives in the URL hash so links work on a static host.
export function encodeState(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function decodeState(text) {
  try { return JSON.parse(decodeURIComponent(escape(atob(text)))); } catch { return null; }
}

/** Link for the share button. Leaves out ?lang= so the recipient sees the page in their own language. */
export function buildShareUrl(href, state) {
  const url = new URL(urlWithLocale(href, null));
  url.hash = `p=${encodeState(state)}`;
  return url.toString();
}
