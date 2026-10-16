// CRS point tables, transcribed from IRCC's published criteria:
// https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html
// https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html
// Last checked: 2026-10-16.

export const LMI_EFFECTIVE_DATE = '2026-11-03';

// Labels are translated in the UI via the `edu.<key>` messages.
export const EDUCATION_LEVELS = ['less', 'secondary', 'one', 'two', 'bachelor', 'multiple', 'master', 'phd'].map((key) => ({ key }));

// Indexed by EDUCATION_LEVELS order.
export const EDUCATION_POINTS = {
  single: [0, 30, 90, 98, 120, 128, 135, 150],
  withSpouse: [0, 28, 84, 91, 112, 119, 126, 140],
  spouse: [0, 2, 6, 7, 8, 9, 10, 10],
};

// Age 18..44; anything outside is 0.
export const AGE_POINTS = {
  single: { 18: 99, 19: 105, 20: 110, 21: 110, 22: 110, 23: 110, 24: 110, 25: 110, 26: 110, 27: 110, 28: 110, 29: 110,
    30: 105, 31: 99, 32: 94, 33: 88, 34: 83, 35: 77, 36: 72, 37: 66, 38: 61, 39: 55, 40: 50, 41: 39, 42: 28, 43: 17, 44: 6 },
  withSpouse: { 18: 90, 19: 95, 20: 100, 21: 100, 22: 100, 23: 100, 24: 100, 25: 100, 26: 100, 27: 100, 28: 100, 29: 100,
    30: 95, 31: 90, 32: 85, 33: 80, 34: 75, 35: 70, 36: 65, 37: 60, 38: 55, 39: 50, 40: 45, 41: 35, 42: 25, 43: 15, 44: 5 },
};

// Per ability, indexed by CLB 0..10 (CLB 10 means 10 or higher).
export const FIRST_LANGUAGE_POINTS = {
  single: [0, 0, 0, 0, 6, 6, 9, 17, 23, 31, 34],
  withSpouse: [0, 0, 0, 0, 6, 6, 8, 16, 22, 29, 32],
};
export const SECOND_LANGUAGE_POINTS = [0, 0, 0, 0, 0, 1, 1, 3, 3, 6, 6];
export const SECOND_LANGUAGE_CAP = { single: 24, withSpouse: 22 };
export const SPOUSE_LANGUAGE_POINTS = [0, 0, 0, 0, 0, 1, 1, 3, 3, 5, 5];

// Indexed by years of Canadian work 0..5 (5 means 5 or more).
export const CANADIAN_WORK_POINTS = {
  single: [0, 40, 53, 64, 72, 80],
  withSpouse: [0, 35, 46, 56, 63, 70],
  spouse: [0, 5, 7, 8, 9, 10],
};

// Labour Market Integration factor (from November 3, 2026).
// Labels are translated in the UI via the `wage.<key>` messages.
export const WAGE_TIERS = ['none', 'x13', 'x15', 'x20'].map((key) => ({ key }));
export const HIGH_WAGE_EXPERIENCE_POINTS = { none: 0, x13: 20, x15: 40, x20: 70 };
export const JOB_OFFER_POINTS = { none: 0, x13: 50, x15: 70, x20: 100 };

export const ADDITIONAL_POINTS = {
  nomination: 600,
  sibling: 15,
  canadianEducation: { none: 0, short: 15, long: 30 },
  frenchOnly: 25,
  frenchAndEnglish: 50,
  cap: 600,
};

export const TRANSFERABILITY_CAPS = { education: 50, foreignWork: 50, trade: 50, total: 100 };
