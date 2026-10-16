import { useEffect, useMemo, useState } from 'react';
import { calculateCRS, defaultRulesFor } from './crs/calculator.js';
import { toClbList } from './crs/languageTests.js';
import { EDUCATION_LEVELS, LMI_EFFECTIVE_DATE, WAGE_TIERS } from './crs/tables.js';
import { CheckField, RadioGroup, Section, SelectField } from './components/Fields.jsx';
import LanguageInput from './components/LanguageInput.jsx';
import ScoreSummary from './components/ScoreSummary.jsx';

const STORAGE_KEY = 'crs-calculator:v1';
const today = new Date().toISOString().slice(0, 10);

const emptyScores = () => ['', '', '', ''];
const defaultTest = (lang) => (lang === 'fr' ? 'tcf' : 'ielts');

const DEFAULTS = {
  rules: defaultRulesFor(today, LMI_EFFECTIVE_DATE),
  maritalStatus: 'single',
  spouseIsCanadian: false,
  spouseComing: true,
  age: '30',
  education: 'bachelor',
  canadianEducation: 'none',
  firstLanguage: 'en',
  first: { test: 'ielts', scores: emptyScores() },
  hasSecond: false,
  second: { test: 'tcf', scores: emptyScores() },
  canadianYears: '0',
  foreignYears: '0',
  tradeCertificate: false,
  highWage: 'none',
  jobOffer: 'none',
  nomination: false,
  sibling: false,
  spouseEducation: 'bachelor',
  spouseCanadianYears: '0',
  spouseLanguage: { test: 'ielts', scores: emptyScores() },
};

const AGES = Array.from({ length: 31 }, (_, i) => {
  const age = i + 17;
  return { key: String(age), label: age === 17 ? '17 or younger' : age === 47 ? '47 or older' : String(age) };
});
const CANADIAN_YEARS = [
  { key: '0', label: 'None or less than a year' },
  { key: '1', label: '1 year' }, { key: '2', label: '2 years' }, { key: '3', label: '3 years' },
  { key: '4', label: '4 years' }, { key: '5', label: '5 years or more' },
];
const FOREIGN_YEARS = [
  { key: '0', label: 'None or less than a year' },
  { key: '1', label: '1 year' }, { key: '2', label: '2 years' }, { key: '3', label: '3 years or more' },
];
const CANADIAN_EDUCATION = [
  { key: 'none', label: 'No Canadian credential' },
  { key: 'short', label: '1- or 2-year diploma or certificate' },
  { key: 'long', label: 'Degree, diploma or certificate of 3+ years, or a master’s, professional or doctoral degree' },
];

// Shareable state lives in the URL hash so links work on a static host.
function encodeState(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}
function decodeState(text) {
  try { return JSON.parse(decodeURIComponent(escape(atob(text)))); } catch { return null; }
}
function loadInitialState() {
  const fromHash = window.location.hash.startsWith('#p=') ? decodeState(window.location.hash.slice(3)) : null;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { /* storage unavailable */ }
  if (fromHash) return { ...DEFAULTS, ...fromHash };
  // Saved inputs keep the date-based rule set, so returning visitors switch rules on Nov 3, 2026.
  return { ...DEFAULTS, ...(saved || {}), rules: DEFAULTS.rules };
}

function useTheme() {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('crs-theme') || (prefersDark ? 'dark' : 'light'); } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem('crs-theme', theme); } catch { /* ignore */ }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

export default function App() {
  const [form, setForm] = useState(loadInitialState);
  const [shareStatus, setShareStatus] = useState('');
  const [theme, toggleTheme] = useTheme();
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch { /* ignore */ }
  }, [form]);

  const withSpouse = form.maritalStatus === 'married' && !form.spouseIsCanadian && form.spouseComing;
  const lmi = form.rules === 'lmi2026';
  const secondLanguage = form.firstLanguage === 'en' ? 'fr' : 'en';

  const result = useMemo(() => calculateCRS({
    rules: form.rules,
    withSpouse,
    age: Number(form.age),
    education: form.education,
    firstLanguage: form.firstLanguage,
    firstClb: toClbList(form.first.test, form.first.scores),
    secondClb: form.hasSecond ? toClbList(form.second.test, form.second.scores) : [0, 0, 0, 0],
    canadianYears: Number(form.canadianYears),
    foreignYears: Number(form.foreignYears),
    tradeCertificate: form.tradeCertificate,
    canadianEducation: form.canadianEducation,
    nomination: form.nomination,
    sibling: form.sibling,
    highWage: form.highWage,
    jobOffer: form.jobOffer,
    spouse: {
      education: form.spouseEducation,
      canadianYears: Number(form.spouseCanadianYears),
      clb: toClbList(form.spouseLanguage.test, form.spouseLanguage.scores),
    },
  }), [form, withSpouse]);

  const changeFirstLanguage = (lang) => setForm((f) => ({
    ...f,
    firstLanguage: lang,
    first: { test: defaultTest(lang), scores: emptyScores() },
    second: { test: defaultTest(lang === 'en' ? 'fr' : 'en'), scores: emptyScores() },
  }));

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#p=${encodeState(form)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('Link copied!');
    } catch {
      window.history.replaceState(null, '', url);
      setShareStatus('Link is in the address bar');
    }
    setTimeout(() => setShareStatus(''), 2500);
  };

  const reset = () => {
    setForm({ ...DEFAULTS });
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <>
      <nav className="navbar border-bottom bg-body sticky-top d-print-none">
        <div className="container">
          <span className="navbar-brand d-flex align-items-center gap-2 mb-0">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="28" height="28" />
            <span className="fw-semibold">CRS Calculator</span>
            <span className="badge text-bg-secondary fw-normal d-none d-sm-inline">Unofficial</span>
          </span>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={toggleTheme}
            aria-label="Toggle colour theme">
            {theme === 'dark' ? '☀︎ Light' : '☾ Dark'}
          </button>
        </div>
      </nav>

      <header className="hero py-4 mb-4">
        <div className="container">
          <h1 className="h3 fw-bold mb-1">Express Entry CRS score calculator</h1>
          <p className="mb-0 text-body-secondary">
            Estimate your Comprehensive Ranking System score for Canada’s Express Entry. Everything runs in your
            browser — nothing you enter leaves this page.
          </p>
        </div>
      </header>

      <main className="container pb-5">
        <div className="row g-4">
          <div className="col-lg-7 col-xl-8">
            <Section step="1" title="Scoring rules">
              <RadioGroup name="rules" label="Which CRS rules should apply?" value={form.rules} onChange={set('rules')}
                options={[
                  { key: 'current', label: 'Before Nov 3, 2026' },
                  { key: 'lmi2026', label: 'From Nov 3, 2026' },
                ]} />
              <div className="form-text">
                From November 3, 2026, IRCC replaces Canadian work experience points with a
                <strong> Labour Market Integration</strong> factor: the higher of Canadian work experience
                (length + high-wage occupation) or a qualifying high-wage job offer, up to 150 points.
              </div>
            </Section>

            <Section step="2" title="About you">
              <div className="row">
                <div className="col-md-6">
                  <SelectField label="Marital status" value={form.maritalStatus} onChange={set('maritalStatus')}
                    options={[
                      { key: 'single', label: 'Never married / single, divorced, separated, widowed' },
                      { key: 'married', label: 'Married or common-law' },
                    ]} />
                </div>
                <div className="col-md-6">
                  <SelectField label="Age" value={form.age} onChange={set('age')} options={AGES}
                    help="Your age on the day you get an invitation to apply." />
                </div>
              </div>
              {form.maritalStatus === 'married' && (
                <div className="border rounded p-3 bg-body-tertiary">
                  <CheckField label="My spouse or partner is a Canadian citizen or permanent resident"
                    checked={form.spouseIsCanadian} onChange={set('spouseIsCanadian')} />
                  {!form.spouseIsCanadian && (
                    <CheckField label="My spouse or partner will come with me to Canada"
                      checked={form.spouseComing} onChange={set('spouseComing')} />
                  )}
                  <div className="small text-body-secondary">
                    You are scored {withSpouse ? <strong>with</strong> : <strong>as single (without)</strong>} a
                    spouse or partner.
                  </div>
                </div>
              )}
            </Section>

            <Section step="3" title="Education">
              <SelectField label="Highest level of education" value={form.education} onChange={set('education')}
                options={EDUCATION_LEVELS}
                help="Foreign credentials need an Educational Credential Assessment (ECA)." />
              <SelectField label="Canadian post-secondary education" value={form.canadianEducation}
                onChange={set('canadianEducation')} options={CANADIAN_EDUCATION} className="mb-0" />
            </Section>

            <Section step="4" title="Official languages"
              subtitle="Enter your test results. Scores are converted to Canadian Language Benchmark (CLB / NCLC) levels.">
              <RadioGroup name="firstLanguage" label="First official language" value={form.firstLanguage}
                onChange={changeFirstLanguage}
                options={[{ key: 'en', label: 'English' }, { key: 'fr', label: 'French' }]} />
              <LanguageInput language={form.firstLanguage} value={form.first} onChange={set('first')} />
              <hr />
              <CheckField label={`I also have ${secondLanguage === 'fr' ? 'French' : 'English'} test results (second official language)`}
                checked={form.hasSecond} onChange={set('hasSecond')}
                help="Also used for the French language bonus (up to 50 points)." />
              {form.hasSecond && (
                <LanguageInput language={secondLanguage} value={form.second} onChange={set('second')} />
              )}
            </Section>

            <Section step="5" title="Work experience"
              subtitle="Skilled work (TEER 0, 1, 2 or 3) in the last 10 years. Count full-time years (1,560 hours each).">
              <div className="row">
                <div className="col-md-6">
                  <SelectField label="Canadian work experience" value={form.canadianYears}
                    onChange={set('canadianYears')} options={CANADIAN_YEARS} />
                </div>
                <div className="col-md-6">
                  <SelectField label="Foreign work experience" value={form.foreignYears}
                    onChange={set('foreignYears')} options={FOREIGN_YEARS} />
                </div>
              </div>
              <CheckField label="I have a certificate of qualification from a Canadian province or territory (trades)"
                checked={form.tradeCertificate} onChange={set('tradeCertificate')} />

              {lmi && (
                <div className="border rounded p-3 bg-body-tertiary">
                  <h3 className="h6">Labour Market Integration (from Nov 3, 2026)</h3>
                  <div className="row">
                    <div className="col-md-6">
                      <SelectField label="Canadian high-wage occupation experience (12+ months)" value={form.highWage}
                        onChange={set('highWage')} options={WAGE_TIERS}
                        help="Median wage of the occupation compared with the average median wage. Needs 1+ year of Canadian work." />
                    </div>
                    <div className="col-md-6">
                      <SelectField label="Qualifying job offer" value={form.jobOffer} onChange={set('jobOffer')}
                        options={WAGE_TIERS} help="Valid Express Entry job offer in a high-wage occupation. No LMIA needed." />
                    </div>
                  </div>
                  <div className="small text-body-secondary">
                    Only the higher of the two paths counts: Canadian work ({result.labour.workPath}) or job offer
                    ({result.labour.jobOfferPath}).
                  </div>
                </div>
              )}
            </Section>

            {withSpouse && (
              <Section step="6" title="Spouse or common-law partner">
                <div className="row">
                  <div className="col-md-6">
                    <SelectField label="Spouse’s highest education" value={form.spouseEducation}
                      onChange={set('spouseEducation')} options={EDUCATION_LEVELS} />
                  </div>
                  <div className="col-md-6">
                    <SelectField label="Spouse’s Canadian work experience" value={form.spouseCanadianYears}
                      onChange={set('spouseCanadianYears')} options={CANADIAN_YEARS} />
                  </div>
                </div>
                <h3 className="h6">Spouse’s first official language</h3>
                <LanguageInput value={form.spouseLanguage} onChange={set('spouseLanguage')} />
              </Section>
            )}

            <Section step={withSpouse ? '7' : '6'} title="Additional factors">
              <CheckField label="I have a provincial or territorial nomination (+600)"
                checked={form.nomination} onChange={set('nomination')} />
              <CheckField label="I (or my spouse/partner) have a brother or sister in Canada who is a citizen or PR, aged 18+ (+15)"
                checked={form.sibling} onChange={set('sibling')} />
            </Section>
          </div>

          <aside className="col-lg-5 col-xl-4" id="score">
            <div className="sticky-lg-top score-sticky">
              <ScoreSummary result={result} onShare={share} shareStatus={shareStatus} onReset={reset} />
            </div>
          </aside>
        </div>
      </main>

      <div className="mobile-score-bar fixed-bottom d-lg-none d-print-none bg-body border-top shadow-lg">
        <div className="container d-flex align-items-center justify-content-between py-2">
          <div>
            <div className="small text-body-secondary lh-1">Estimated CRS score</div>
            <div className="fs-3 fw-bold text-danger lh-sm">{result.total}</div>
          </div>
          <a href="#score" className="btn btn-outline-danger btn-sm"
            onClick={(e) => { e.preventDefault(); document.getElementById('score').scrollIntoView({ behavior: 'smooth' }); }}>
            See breakdown
          </a>
        </div>
      </div>

      <footer className="border-top py-4 small text-body-secondary">
        <div className="container">
          <p className="mb-2">
            <strong>Disclaimer:</strong> This is an unofficial estimate and is not affiliated with Immigration,
            Refugees and Citizenship Canada (IRCC). It does not check program eligibility. Always confirm your score
            with the{' '}
            <a href="https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp" target="_blank" rel="noreferrer">
              official IRCC CRS tool
            </a>.
          </p>
          <p className="mb-0">
            Point tables from IRCC’s{' '}
            <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html"
              target="_blank" rel="noreferrer">CRS criteria</a> and{' '}
            <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html"
              target="_blank" rel="noreferrer">Express Entry changes</a> pages, checked October 16, 2026.{' '}
            <a href="https://github.com/cal924/canada-crs-calculator" target="_blank" rel="noreferrer">Source on GitHub</a>.
          </p>
        </div>
      </footer>
    </>
  );
}
