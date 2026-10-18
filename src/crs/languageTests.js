// Test score → CLB/NCLC equivalency, from IRCC's language testing page:
// https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html
// Skill order everywhere in this app: listening, reading, writing, speaking.

export const SKILLS = ['listening', 'reading', 'writing', 'speaking']; // message keys: skill.<name>

// For each test: minimum score needed for CLB 4, 5, 6, 7, 8, 9, 10 per skill.
export const LANGUAGE_TESTS = {
  clb: { labelKey: 'lang.knowClb', language: 'en', direct: true },
  celpip: {
    label: 'CELPIP-General', language: 'en',
    input: { min: 0, max: 12, step: 1 },
    thresholds: Array(4).fill([4, 5, 6, 7, 8, 9, 10]),
  },
  ielts: {
    label: 'IELTS General Training', language: 'en',
    input: { min: 0, max: 9, step: 0.5 },
    thresholds: [
      [4.5, 5, 5.5, 6, 7.5, 8, 8.5],
      [3.5, 4, 5, 6, 6.5, 7, 8],
      [4, 5, 5.5, 6, 6.5, 7, 7.5],
      [4, 5, 5.5, 6, 6.5, 7, 7.5],
    ],
  },
  pte: {
    label: 'PTE Core', language: 'en',
    input: { min: 10, max: 90, step: 1 },
    thresholds: [
      [28, 39, 50, 60, 71, 82, 89],
      [33, 42, 51, 60, 69, 78, 88],
      [41, 51, 60, 69, 79, 88, 90],
      [42, 51, 59, 68, 76, 84, 89],
    ],
  },
  nclc: { labelKey: 'lang.knowNclc', language: 'fr', direct: true },
  tcf: {
    label: 'TCF Canada', language: 'fr',
    input: [{ min: 0, max: 699, step: 1 }, { min: 0, max: 699, step: 1 }, { min: 0, max: 20, step: 1 }, { min: 0, max: 20, step: 1 }],
    thresholds: [
      [331, 369, 398, 458, 503, 523, 549],
      [342, 375, 406, 453, 499, 524, 549],
      [4, 6, 7, 10, 12, 14, 16],
      [4, 6, 7, 10, 12, 14, 16],
    ],
  },
};

export const testsFor = (language) =>
  Object.entries(LANGUAGE_TESTS).filter(([, t]) => t.language === language).map(([key, t]) => ({ key, ...t }));

export function inputFor(testKey, skillIndex) {
  const input = LANGUAGE_TESTS[testKey]?.input;
  return Array.isArray(input) ? input[skillIndex] : input;
}

const isBlank = (score) => score === '' || score === null || score === undefined;

/**
 * True when a typed test score is possible for that test: inside its range and on its step
 * (e.g. IELTS 0–9 in steps of 0.5). Blank counts as valid (not entered yet).
 */
export function isValidScore(testKey, skillIndex, score) {
  if (isBlank(score)) return true;
  const test = LANGUAGE_TESTS[testKey];
  if (!test) return false;
  if (test.direct) return true;
  const value = Number(score);
  const { min, max, step } = inputFor(testKey, skillIndex);
  if (!Number.isFinite(value) || value < min || value > max) return false;
  const steps = (value - min) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/** Convert one test score to a CLB level (0 means below CLB 4, not entered, or not a valid score). */
export function toClb(testKey, skillIndex, score) {
  const test = LANGUAGE_TESTS[testKey];
  if (isBlank(score)) return 0;
  const value = Number(score);
  if (!test || Number.isNaN(value)) return 0;
  // An impossible score (e.g. CELPIP 109 from a typo) must not count as CLB 10.
  if (!isValidScore(testKey, skillIndex, score)) return 0;
  if (test.direct) return Math.min(10, Math.max(0, Math.floor(value)));
  const levels = test.thresholds[skillIndex];
  let clb = 0;
  levels.forEach((min, i) => { if (value >= min) clb = i + 4; });
  return clb;
}

export const toClbList = (testKey, scores) => scores.map((s, i) => toClb(testKey, i, s));
