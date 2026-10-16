import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES, chooseLocale, localeFromSearch, resolveLocale, translate, urlWithLocale } from '../src/i18n/index.js';
import en from '../src/i18n/locales/en.js';

const enKeys = Object.keys(en).sort();

for (const { code, messages } of LOCALES) {
  test(`${code} has exactly the English keys`, () => {
    const keys = Object.keys(messages).sort();
    assert.deepEqual(keys.filter((k) => !(k in en)), [], 'extra keys');
    assert.deepEqual(enKeys.filter((k) => !(k in messages)), [], 'missing keys');
  });

  test(`${code} keeps every {placeholder}`, () => {
    for (const key of enKeys) {
      const expected = (en[key].match(/\{\w+\}/g) || []).sort();
      const actual = (messages[key].match(/\{\w+\}/g) || []).sort();
      assert.deepEqual(actual, expected, key);
    }
  });
}

test('every key used in the UI exists in English', () => {
  const files = [];
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p); else if (/\.jsx?$/.test(e.name)) files.push(p);
  });
  walk('src');
  // Literal keys only, e.g. t('summary.age') or 'footer.criteria' in a lookup list.
  const used = new Set();
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/['"]((?:app|rules|about|education|edu|canEdu|lang|skill|work|years|lmi|wage|spouse|additional|summary|mobile|footer|draws)\.[A-Za-z0-9]+)['"]/g)) {
      used.add(m[1]);
    }
  }
  assert.deepEqual([...used].filter((k) => !(k in en)), []);
});

test('resolveLocale accepts codes and common variants', () => {
  assert.equal(resolveLocale('fr'), 'fr');
  assert.equal(resolveLocale('FR-ca'), 'fr');
  assert.equal(resolveLocale('hi-IN'), 'hi');
  assert.equal(resolveLocale('en-US'), 'en');
  assert.equal(resolveLocale('zh-Hant'), 'zh-Hant');
  assert.equal(resolveLocale('zh-TW'), 'zh-Hant');
  assert.equal(resolveLocale('zh-HK'), 'zh-Hant');
  assert.equal(resolveLocale('zh_hant'), 'zh-Hant');
  assert.equal(resolveLocale('zh-Hans'), 'zh-Hans');
  assert.equal(resolveLocale('zh-CN'), 'zh-Hans');
  assert.equal(resolveLocale('zh'), 'zh-Hans');
  assert.equal(resolveLocale('de'), null);
  assert.equal(resolveLocale(''), null);
  assert.equal(resolveLocale(null), null);
});

test('localeFromSearch reads a supported ?lang=', () => {
  assert.equal(localeFromSearch(''), null);
  assert.equal(localeFromSearch('?lang=de'), null);
  assert.equal(localeFromSearch('?lang=zh-TW'), 'zh-Hant');
  assert.equal(localeFromSearch('?x=1&lang=hi'), 'hi');
});

test('chooseLocale: ?lang= → last choice → browser → English', () => {
  const all = { search: '?lang=hi', stored: 'fr', languages: ['zh-TW'] };
  assert.equal(chooseLocale(all), 'hi');
  assert.equal(chooseLocale({ ...all, search: '' }), 'fr');
  assert.equal(chooseLocale({ ...all, search: '?lang=de' }), 'fr', 'unsupported ?lang= is ignored');
  assert.equal(chooseLocale({ ...all, search: '', stored: null }), 'zh-Hant');
  assert.equal(chooseLocale({ ...all, search: '', stored: 'xx' }), 'zh-Hant', 'bad stored value is ignored');
  assert.equal(chooseLocale({ search: '', stored: null, languages: ['de-DE', 'fr-CA'] }), 'fr');
  assert.equal(chooseLocale({ search: '', stored: null, languages: ['de-DE'] }), 'en');
  assert.equal(chooseLocale(), 'en');
  assert.equal(chooseLocale({ search: '?lang=en', stored: 'fr' }), 'en', 'explicit English beats the stored choice');
});

test('urlWithLocale sets or removes ?lang= and keeps the hash', () => {
  const base = 'https://cal924.github.io/canada-crs-calculator/';
  assert.equal(urlWithLocale(base, 'fr'), `${base}?lang=fr`);
  assert.equal(urlWithLocale(`${base}?lang=fr#p=abc`, 'zh-Hant'), `${base}?lang=zh-Hant#p=abc`);
  assert.equal(urlWithLocale(`${base}?lang=fr#p=abc`, 'en'), `${base}?lang=en#p=abc`);
  assert.equal(urlWithLocale(`${base}?lang=de`, null), base);
});

test('translate interpolates and falls back', () => {
  assert.equal(translate('fr', 'years.n', { n: 3 }), '3 ans');
  assert.equal(translate('xx', 'summary.age'), 'Age');
  assert.equal(translate('en', 'no.such.key'), 'no.such.key');
});
