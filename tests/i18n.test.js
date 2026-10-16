import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES, detectLocale, translate } from '../src/i18n/index.js';
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
    for (const m of readFileSync(f, 'utf8').matchAll(/['"]((?:app|rules|about|education|edu|canEdu|lang|skill|work|years|lmi|wage|spouse|additional|summary|mobile|footer)\.[A-Za-z0-9]+)['"]/g)) {
      used.add(m[1]);
    }
  }
  assert.deepEqual([...used].filter((k) => !(k in en)), []);
});

test('detectLocale maps browser languages', () => {
  assert.equal(detectLocale(['zh-TW']), 'zh-Hant');
  assert.equal(detectLocale(['zh-HK']), 'zh-Hant');
  assert.equal(detectLocale(['zh-Hant-CA']), 'zh-Hant');
  assert.equal(detectLocale(['zh-CN']), 'zh-Hans');
  assert.equal(detectLocale(['zh']), 'zh-Hans');
  assert.equal(detectLocale(['fr-CA']), 'fr');
  assert.equal(detectLocale(['hi-IN']), 'hi');
  assert.equal(detectLocale(['de-DE', 'fr']), 'fr');
  assert.equal(detectLocale(['de-DE']), 'en');
  assert.equal(detectLocale([]), 'en');
});

test('translate interpolates and falls back', () => {
  assert.equal(translate('fr', 'years.n', { n: 3 }), '3 ans');
  assert.equal(translate('xx', 'summary.age'), 'Age');
  assert.equal(translate('en', 'no.such.key'), 'no.such.key');
});
