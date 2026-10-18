import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCRS, defaultRulesFor } from '../src/crs/calculator.js';
import { toClb, toClbList } from '../src/crs/languageTests.js';

const base = {
  rules: 'current', withSpouse: false, age: 30, education: 'bachelor',
  firstLanguage: 'en', firstClb: [9, 9, 9, 9], secondClb: [0, 0, 0, 0],
  canadianYears: 2, foreignYears: 3,
};

test('single applicant core + capped transferability', () => {
  const r = calculateCRS(base);
  assert.deepEqual(r.core, { age: 105, education: 120, firstLanguage: 124, secondLanguage: 0, canadianWork: 53 });
  assert.deepEqual(r.transferGroups, { education: 50, foreignWork: 50, trade: 0 });
  assert.equal(r.transferTotal, 100);
  assert.equal(r.total, 502);
});

test('education transferability group is capped at 50', () => {
  const r = calculateCRS({ ...base, education: 'master', foreignYears: 0 });
  assert.equal(r.transfer.educationLanguage, 50);
  assert.equal(r.transfer.educationWork, 50);
  assert.equal(r.transferGroups.education, 50);
  assert.equal(r.transferTotal, 50);
});

test('accompanying spouse uses the with-spouse tables', () => {
  const r = calculateCRS({ ...base, withSpouse: true, spouse: { education: 'master', canadianYears: 1, clb: [9, 9, 7, 5] } });
  assert.equal(r.core.age, 95);
  assert.equal(r.core.firstLanguage, 116);
  assert.equal(r.core.canadianWork, 46);
  assert.deepEqual(r.spouse, { education: 10, language: 14, canadianWork: 5 });
});

test('second language is capped', () => {
  assert.equal(calculateCRS({ ...base, secondClb: [10, 10, 10, 10] }).core.secondLanguage, 24);
  assert.equal(calculateCRS({ ...base, withSpouse: true, secondClb: [10, 10, 10, 10] }).core.secondLanguage, 22);
});

test('French bonus', () => {
  const fr = { ...base, firstLanguage: 'fr', firstClb: [7, 7, 7, 7] };
  assert.equal(calculateCRS({ ...fr, secondClb: [5, 5, 5, 5] }).additional.french, 50);
  assert.equal(calculateCRS({ ...fr, secondClb: [4, 9, 9, 9] }).additional.french, 25);
  assert.equal(calculateCRS({ ...base, secondClb: [7, 7, 7, 7] }).additional.french, 50);
  assert.equal(calculateCRS({ ...base, secondClb: [7, 7, 7, 6] }).additional.french, 0);
});

test('trade certificate', () => {
  assert.equal(calculateCRS({ ...base, tradeCertificate: true, firstClb: [6, 5, 7, 8] }).transfer.trade, 25);
  assert.equal(calculateCRS({ ...base, tradeCertificate: true, firstClb: [7, 7, 7, 7] }).transfer.trade, 50);
  assert.equal(calculateCRS({ ...base, tradeCertificate: true, firstClb: [4, 7, 7, 7] }).transfer.trade, 0);
});

test('additional points are capped at 600', () => {
  const r = calculateCRS({ ...base, nomination: true, sibling: true, canadianEducation: 'long' });
  assert.equal(r.additionalTotal, 600);
  assert.equal(r.total, 1102);
});

test('Labour Market Integration takes the higher path', () => {
  const r = calculateCRS({ ...base, rules: 'lmi2026', highWage: 'x15', jobOffer: 'x20' });
  assert.equal(r.core.canadianWork, 0);
  assert.equal(r.labour.workPath, 93);
  assert.equal(r.labour.jobOfferPath, 100);
  assert.equal(r.labour.selected, 'jobOffer');
  assert.equal(r.total, 549);

  const work = calculateCRS({ ...base, rules: 'lmi2026', canadianYears: 5, highWage: 'x20', jobOffer: 'x20' });
  assert.equal(work.labour.total, 150);
  assert.equal(work.labour.selected, 'work');
});

test('high-wage points need at least one year of Canadian work', () => {
  const r = calculateCRS({ ...base, rules: 'lmi2026', canadianYears: 0, highWage: 'x20' });
  assert.equal(r.labour.highWage, 0);
});

test('age edges', () => {
  assert.equal(calculateCRS({ ...base, age: 17 }).core.age, 0);
  assert.equal(calculateCRS({ ...base, age: 18 }).core.age, 99);
  assert.equal(calculateCRS({ ...base, age: 44 }).core.age, 6);
  assert.equal(calculateCRS({ ...base, age: 45 }).core.age, 0);
});

test('default rules switch on Nov 3, 2026', () => {
  assert.equal(defaultRulesFor('2026-11-02'), 'current');
  assert.equal(defaultRulesFor('2026-11-03'), 'lmi2026');
});

test('language test conversion', () => {
  assert.deepEqual(toClbList('ielts', [8, 7, 7, 7]), [9, 9, 9, 9]);
  assert.deepEqual(toClbList('ielts', [7.5, 6.5, 6.5, 6.5]), [8, 8, 8, 8]);
  assert.deepEqual(toClbList('celpip', [12, 9, 4, 3]), [10, 9, 4, 0]);
  assert.equal(toClb('pte', 2, 89), 9);
  assert.equal(toClb('pte', 2, 90), 10);
  assert.deepEqual(toClbList('tcf', [549, 453, 12, 3]), [10, 7, 8, 0]);
  assert.equal(toClb('ielts', 0, ''), 0);
});

test('category eligibility flags', () => {
  assert.deepEqual(calculateCRS(base).eligibility, { frenchCategory: false, cec: true });
  assert.equal(calculateCRS({ ...base, canadianYears: 0 }).eligibility.cec, false);
  assert.equal(calculateCRS({ ...base, secondClb: [7, 7, 7, 7] }).eligibility.frenchCategory, true);
  assert.equal(calculateCRS({ ...base, secondClb: [7, 7, 7, 6] }).eligibility.frenchCategory, false);
  assert.equal(calculateCRS({ ...base, firstLanguage: 'fr', firstClb: [9, 8, 7, 7] }).eligibility.frenchCategory, true);
});

test('impossible test scores do not count (e.g. a typo like CELPIP 109)', async () => {
  const { isValidScore, toClb, toClbList } = await import('../src/crs/languageTests.js');
  assert.equal(toClb('celpip', 0, '109'), 0);
  assert.equal(isValidScore('celpip', 0, '109'), false);
  assert.equal(isValidScore('celpip', 0, '9.5'), false, 'CELPIP is whole numbers');
  assert.deepEqual(toClbList('celpip', ['10', '9', '9', '9']), [10, 9, 9, 9]);
  assert.equal(toClb('ielts', 0, '75'), 0, 'IELTS 75 instead of 7.5');
  assert.equal(toClb('ielts', 0, '6.3'), 0, 'IELTS bands are in steps of 0.5');
  assert.equal(toClb('ielts', 0, '6.5'), 7);
  assert.equal(toClb('pte', 0, '9'), 0, 'PTE starts at 10');
  assert.equal(toClb('tcf', 2, '21'), 0, 'TCF writing is 0–20');
  assert.equal(toClb('tcf', 0, '549'), 10);
  assert.equal(isValidScore('celpip', 0, ''), true, 'blank is not an error');
  assert.equal(isValidScore('clb', 0, '10'), true);
});
