// Download the latest Express Entry rounds from IRCC and write public/data/ee-rounds.json.
// Usage: node scripts/fetch-rounds.mjs            (fetches from canada.ca)
//        node scripts/fetch-rounds.mjs <file.json> (uses a local copy of IRCC's JSON)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SOURCE_URL, normalizeRounds, withUpdatedAt } from './rounds-lib.mjs';

const OUTPUT = new URL('../public/data/ee-rounds.json', import.meta.url);

async function loadRaw(localFile) {
  if (localFile) return JSON.parse(await readFile(localFile, 'utf8'));
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'canada-crs-calculator (+https://github.com/cal924/canada-crs-calculator)', Accept: 'application/json' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`IRCC returned HTTP ${res.status}`);
  return res.json();
}

const previous = await readFile(OUTPUT, 'utf8').then(JSON.parse).catch(() => null);
const data = withUpdatedAt(normalizeRounds(await loadRaw(process.argv[2])), previous);

await mkdir(dirname(OUTPUT.pathname), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(data, null, 1)}\n`);

const latest = data.rounds[0];
console.log(`${data.rounds.length} rounds; latest #${latest.number} on ${latest.date} (${latest.category}, CRS ${latest.crs}).`);
console.log(previous?.updatedAt === data.updatedAt ? 'No change in draw data.' : `Draw data updated at ${data.updatedAt}.`);
