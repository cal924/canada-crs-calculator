import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawCategory, normalizeRounds, withUpdatedAt } from '../scripts/rounds-lib.mjs';

const dd = Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`dd${i + 1}`, `1,${String(i).padStart(3, '0')}`]));
const raw = {
  classes: 'wb-tables',
  rounds: [
    { drawNumber: '450', drawDate: '2026-10-16', drawName: 'French-Language proficiency 2026-Version 2', drawSize: '5,000',
      drawCRS: '435', drawCutOff: 'October 06, 2026 at 21:31:22 UTC', drawDistributionAsOn: 'October 12, 2026', ...dd },
    { drawNumber: '449', drawDate: '2026-10-15', drawName: '<b>Trade occupations</b> (Version 1)', drawSize: '1,250',
      drawCRS: '480', drawCutOff: '', ...dd },
    { drawNumber: '91a', drawDate: '2018-05-30', drawName: 'Trades Occupations', drawSize: '500', drawCRS: '288', drawCutOff: '' },
  ],
};

test('normalizes IRCC rounds', () => {
  const data = normalizeRounds(raw);
  assert.equal(data.latestDrawDate, '2026-10-16');
  assert.deepEqual(data.rounds[0], {
    number: '450', date: '2026-10-16', name: 'French-Language proficiency 2026-Version 2',
    category: 'French-Language proficiency', size: 5000, crs: 435, tieBreak: 'October 06, 2026 at 21:31:22 UTC',
  });
  assert.equal(data.rounds[1].name, 'Trade occupations (Version 1)', 'HTML is stripped');
  assert.equal(data.rounds[1].tieBreak, null);
  assert.equal(data.rounds[2].number, '91a');
  assert.equal(data.rounds[2].category, 'Trade occupations', 'spelling variants share the latest label');
  assert.equal(data.distribution.asOf, 'October 12, 2026');
  assert.equal(data.distribution.buckets.length, 18);
  assert.deepEqual(data.distribution.buckets.at(-1), { range: 'total', total: true, count: 1017 });
});

test('drawCategory strips version suffixes', () => {
  assert.equal(drawCategory('Healthcare and Social Services Occupations, 2026-Version 3'), 'Healthcare and Social Services Occupations');
  assert.equal(drawCategory('STEM occupations (Version 1)'), 'STEM occupations');
  assert.equal(drawCategory('Canadian Experience Class'), 'Canadian Experience Class');
});

test('rejects unexpected formats instead of writing bad data', () => {
  assert.throws(() => normalizeRounds({}), /no "rounds" array/);
  assert.throws(() => normalizeRounds({ rounds: [] }), /no "rounds" array/);
  assert.throws(() => normalizeRounds({ rounds: [{ ...raw.rounds[0], drawCRS: 'TBD' }] }), /Unexpected format/);
  assert.throws(() => normalizeRounds({ rounds: [{ ...raw.rounds[0], drawDate: '16/10/2026' }] }), /Unexpected format/);
});

test('updatedAt only changes when the data changes', () => {
  const data = normalizeRounds(raw);
  const first = withUpdatedAt(data, null, new Date('2026-10-16T10:00:00Z'));
  assert.equal(first.updatedAt, '2026-10-16T10:00:00.000Z');
  assert.equal(withUpdatedAt(data, first, new Date('2026-10-17T10:00:00Z')).updatedAt, first.updatedAt);
  const changed = normalizeRounds({ rounds: [{ ...raw.rounds[0], drawNumber: '451', drawDate: '2026-10-20' }, ...raw.rounds] });
  assert.equal(withUpdatedAt(changed, first, new Date('2026-10-20T10:00:00Z')).updatedAt, '2026-10-20T10:00:00.000Z');
});

test('stored data file is valid', () => {
  const data = JSON.parse(readFileSync('public/data/ee-rounds.json', 'utf8'));
  assert.ok(data.updatedAt && data.rounds.length > 0 && data.roundsPage.startsWith('https://www.canada.ca/'));
  for (const r of data.rounds) assert.ok(Number.isInteger(r.crs) && Number.isInteger(r.size) && /^\d{4}-\d{2}-\d{2}$/.test(r.date));
});
