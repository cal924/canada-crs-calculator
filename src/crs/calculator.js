import {
  AGE_POINTS, EDUCATION_LEVELS, EDUCATION_POINTS, FIRST_LANGUAGE_POINTS, SECOND_LANGUAGE_POINTS,
  SECOND_LANGUAGE_CAP, SPOUSE_LANGUAGE_POINTS, CANADIAN_WORK_POINTS, HIGH_WAGE_EXPERIENCE_POINTS,
  JOB_OFFER_POINTS, ADDITIONAL_POINTS, TRANSFERABILITY_CAPS,
} from './tables.js';

const clampInt = (x, min, max) => Math.min(max, Math.max(min, Math.floor(Number(x) || 0)));
const sum = (values) => values.reduce((a, b) => a + b, 0);
const educationIndex = (key) => Math.max(0, EDUCATION_LEVELS.findIndex((e) => e.key === key));
const clbList = (list) => (Array.isArray(list) && list.length === 4 ? list.map((n) => clampInt(n, 0, 10)) : [0, 0, 0, 0]);

// Skill transferability groups education into: none (secondary or less), one credential of 1+ years,
// or the top tier (two or more credentials, master's, PhD).
function educationTier(key) {
  if (key === 'less' || key === 'secondary') return 0;
  if (key === 'multiple' || key === 'master' || key === 'phd') return 2;
  return 1;
}

// tier 0 → 0, tier 1 → 13/25, tier 2 → 25/50 depending on whether the stronger condition is met.
const combo = (tier, strong) => (tier === 0 ? 0 : tier === 1 ? (strong ? 25 : 13) : (strong ? 50 : 25));

/**
 * Calculate a CRS score.
 *
 * @param {object} p
 * @param {'current'|'lmi2026'} p.rules  'lmi2026' applies the Labour Market Integration factor (Nov 3, 2026).
 * @param {boolean} p.withSpouse  True when a spouse/partner who is not a Canadian citizen/PR comes to Canada.
 * @param {number} p.age
 * @param {string} p.education  key from EDUCATION_LEVELS
 * @param {'en'|'fr'} p.firstLanguage
 * @param {number[]} p.firstClb   [listening, reading, writing, speaking]
 * @param {number[]} [p.secondClb]
 * @param {number} p.canadianYears  0..5
 * @param {number} p.foreignYears   0..3
 * @param {boolean} p.tradeCertificate
 * @param {'none'|'short'|'long'} p.canadianEducation
 * @param {boolean} p.nomination
 * @param {boolean} p.sibling
 * @param {string} p.highWage  key of HIGH_WAGE_EXPERIENCE_POINTS
 * @param {string} p.jobOffer  key of JOB_OFFER_POINTS
 * @param {{education:string, canadianYears:number, clb:number[]}} [p.spouse]
 */
export function calculateCRS(p) {
  const withSpouse = !!p.withSpouse;
  const status = withSpouse ? 'withSpouse' : 'single';
  const lmi = p.rules === 'lmi2026';

  const age = clampInt(p.age, 0, 120);
  const canadianYears = clampInt(p.canadianYears, 0, 5);
  const foreignYears = clampInt(p.foreignYears, 0, 3);
  const firstClb = clbList(p.firstClb);
  const secondClb = clbList(p.secondClb);
  const edu = educationIndex(p.education);

  // A. Core / human capital
  const workLength = CANADIAN_WORK_POINTS[status][canadianYears];
  const core = {
    age: AGE_POINTS[status][age] ?? 0,
    education: EDUCATION_POINTS[status][edu],
    firstLanguage: sum(firstClb.map((n) => FIRST_LANGUAGE_POINTS[status][n])),
    secondLanguage: Math.min(SECOND_LANGUAGE_CAP[status], sum(secondClb.map((n) => SECOND_LANGUAGE_POINTS[n]))),
    canadianWork: lmi ? 0 : workLength, // moves into the Labour Market Integration factor under the 2026 rules
  };
  const coreTotal = sum(Object.values(core));

  // B. Spouse factors
  let spouse = { education: 0, language: 0, canadianWork: 0 };
  if (withSpouse && p.spouse) {
    spouse = {
      education: EDUCATION_POINTS.spouse[educationIndex(p.spouse.education)],
      language: sum(clbList(p.spouse.clb).map((n) => SPOUSE_LANGUAGE_POINTS[n])),
      canadianWork: CANADIAN_WORK_POINTS.spouse[clampInt(p.spouse.canadianYears, 0, 5)],
    };
  }
  const spouseTotal = sum(Object.values(spouse));

  // C. Skill transferability (uses first official language and work-length years, under both rule sets)
  const minClb = Math.min(...firstClb);
  const goodLanguage = minClb >= 7;
  const strongLanguage = minClb >= 9;
  const eduTier = educationTier(p.education);
  const foreignTier = foreignYears === 0 ? 0 : foreignYears < 3 ? 1 : 2;

  const transfer = {
    educationLanguage: goodLanguage ? combo(eduTier, strongLanguage) : 0,
    educationWork: canadianYears >= 1 ? combo(eduTier, canadianYears >= 2) : 0,
    foreignLanguage: goodLanguage ? combo(foreignTier, strongLanguage) : 0,
    foreignWork: canadianYears >= 1 ? combo(foreignTier, canadianYears >= 2) : 0,
    trade: p.tradeCertificate && minClb >= 5 ? (minClb >= 7 ? 50 : 25) : 0,
  };
  const transferGroups = {
    education: Math.min(TRANSFERABILITY_CAPS.education, transfer.educationLanguage + transfer.educationWork),
    foreignWork: Math.min(TRANSFERABILITY_CAPS.foreignWork, transfer.foreignLanguage + transfer.foreignWork),
    trade: Math.min(TRANSFERABILITY_CAPS.trade, transfer.trade),
  };
  const transferTotal = Math.min(TRANSFERABILITY_CAPS.total, sum(Object.values(transferGroups)));

  // D. Additional points
  const french = p.firstLanguage === 'fr' ? firstClb : secondClb;
  const english = p.firstLanguage === 'fr' ? secondClb : firstClb;
  let frenchBonus = 0;
  if (Math.min(...french) >= 7) {
    frenchBonus = Math.min(...english) >= 5 ? ADDITIONAL_POINTS.frenchAndEnglish : ADDITIONAL_POINTS.frenchOnly;
  }
  const additional = {
    nomination: p.nomination ? ADDITIONAL_POINTS.nomination : 0,
    sibling: p.sibling ? ADDITIONAL_POINTS.sibling : 0,
    canadianEducation: ADDITIONAL_POINTS.canadianEducation[p.canadianEducation] ?? 0,
    french: frenchBonus,
  };
  const additionalTotal = Math.min(ADDITIONAL_POINTS.cap, sum(Object.values(additional)));

  // E. Labour Market Integration (Nov 3, 2026): the higher of Canadian work (length + high-wage) or a job offer.
  let labour = null;
  if (lmi) {
    // High-wage points need 12+ months of qualifying Canadian experience.
    const highWage = canadianYears >= 1 ? (HIGH_WAGE_EXPERIENCE_POINTS[p.highWage] ?? 0) : 0;
    const workPath = workLength + highWage;
    const jobOfferPath = JOB_OFFER_POINTS[p.jobOffer] ?? 0;
    labour = {
      workLength,
      highWage,
      workPath,
      jobOfferPath,
      selected: jobOfferPath > workPath ? 'jobOffer' : 'work',
      total: Math.max(workPath, jobOfferPath),
    };
  }
  const labourTotal = labour ? labour.total : 0;

  return {
    withSpouse,
    rules: lmi ? 'lmi2026' : 'current',
    core, coreTotal,
    spouse, spouseTotal,
    transfer, transferGroups, transferTotal,
    additional, additionalTotal,
    // Basic category checks used to compare against category draws (not a full program-eligibility check).
    eligibility: {
      frenchCategory: Math.min(...french) >= 7, // NCLC 7+ in all four French abilities
      cec: canadianYears >= 1, // Canadian Experience Class needs 1+ year of Canadian skilled work
    },
    labour, labourTotal,
    total: coreTotal + spouseTotal + transferTotal + additionalTotal + labourTotal,
  };
}

/** Which rule set applies on a given date (YYYY-MM-DD). */
export function defaultRulesFor(isoDate, effective = '2026-11-03') {
  return isoDate >= effective ? 'lmi2026' : 'current';
}
