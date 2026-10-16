// Turns IRCC's Express Entry rounds JSON into the small file the site loads (public/data/ee-rounds.json).
// Source: https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json

export const SOURCE_URL = 'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json';
export const ROUNDS_PAGE_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html';
const INVITATION_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds/invitations.html?q=';

// Order of dd1..dd18 in IRCC's data: score ranges of candidates in the pool. Sub-ranges are nested under their parent.
export const DISTRIBUTION_RANGES = [
  { range: '601–1200' }, { range: '501–600' },
  { range: '451–500' }, { range: '491–500', sub: true }, { range: '481–490', sub: true }, { range: '471–480', sub: true },
  { range: '461–470', sub: true }, { range: '451–460', sub: true },
  { range: '401–450' }, { range: '441–450', sub: true }, { range: '431–440', sub: true }, { range: '421–430', sub: true },
  { range: '411–420', sub: true }, { range: '401–410', sub: true },
  { range: '351–400' }, { range: '301–350' }, { range: '0–300' }, { range: 'total', total: true },
];

const toInt = (text) => {
  const n = Number(String(text ?? '').replace(/[,\s]/g, ''));
  return Number.isInteger(n) ? n : null;
};
const plain = (text) => String(text ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** "French-Language proficiency 2026-Version 2" → "French-Language proficiency" */
export function drawCategory(name) {
  return plain(name)
    .replace(/[,\s]*\(?\s*(\d{4}-)?Version\s*\d+\s*\)?$/i, '')
    .trim() || plain(name);
}

/** Grouping key that ignores case, hyphens and "Trade"/"Trades". */
export function categoryKey(category) {
  return category.toLowerCase().replace(/-/g, ' ').replace(/\btrades\b/g, 'trade').replace(/\s+/g, ' ').trim();
}

/** Validate and slim down IRCC's JSON. Throws if the format looks wrong, so bad data is never written. */
export function normalizeRounds(raw) {
  if (!raw || !Array.isArray(raw.rounds) || raw.rounds.length === 0) {
    throw new Error('Unexpected format: no "rounds" array');
  }
  const rounds = raw.rounds.map((r, i) => {
    const round = {
      number: plain(r.drawNumber),
      date: plain(r.drawDate),
      name: plain(r.drawName),
      category: drawCategory(r.drawName),
      size: toInt(r.drawSize),
      crs: toInt(r.drawCRS),
      tieBreak: plain(r.drawCutOff) || null,
    };
    if (!round.number || !/^\d{4}-\d{2}-\d{2}$/.test(round.date) || round.size === null || round.crs === null) {
      throw new Error(`Unexpected format in round at index ${i}: ${JSON.stringify(r).slice(0, 200)}`);
    }
    return round;
  });
  rounds.sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number, 'en', { numeric: true }));

  // IRCC spells some categories differently over time; label each group with its most recent spelling.
  const labels = new Map();
  for (const round of rounds) {
    const key = categoryKey(round.category);
    if (!labels.has(key)) labels.set(key, round.category);
    round.category = labels.get(key);
  }

  const latest = raw.rounds.find((r) => plain(r.drawNumber) === rounds[0].number) ?? raw.rounds[0];
  const buckets = DISTRIBUTION_RANGES.map((b, i) => ({ ...b, count: toInt(latest[`dd${i + 1}`]) }));
  const distribution = buckets.every((b) => b.count !== null)
    ? { asOf: plain(latest.drawDistributionAsOn) || null, buckets }
    : null;

  return {
    source: SOURCE_URL,
    roundsPage: ROUNDS_PAGE_URL,
    invitationUrl: INVITATION_URL,
    latestDrawDate: rounds[0].date,
    distribution,
    rounds,
  };
}

/** Keep the previous `updatedAt` unless the draw data actually changed, so unchanged runs create no commit. */
export function withUpdatedAt(next, previous, now = new Date()) {
  const strip = (d) => (d ? JSON.stringify({ ...d, updatedAt: undefined }) : null);
  const unchanged = previous && strip(previous) === strip(next);
  return { updatedAt: unchanged ? previous.updatedAt : now.toISOString(), ...next };
}
