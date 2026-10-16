import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareUrl, decodeState } from '../src/shareLink.js';

const base = 'https://cal924.github.io/canada-crs-calculator/';
const state = { age: '30', note: '繁體 français हिन्दी' };

test('share link leaves out ?lang= and carries the form state', () => {
  const link = new URL(buildShareUrl(`${base}?lang=fr#p=old`, state));
  assert.equal(link.origin + link.pathname, base);
  assert.equal(link.searchParams.has('lang'), false);
  assert.ok(link.hash.startsWith('#p='));
  assert.deepEqual(decodeState(link.hash.slice(3)), state);
});

test('share link keeps other query parameters', () => {
  const link = new URL(buildShareUrl(`${base}?lang=hi&ref=x`, state));
  assert.equal(link.search, '?ref=x');
});
