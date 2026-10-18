import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateCRS, defaultRulesFor } from './crs/calculator.js';
import { toClbList } from './crs/languageTests.js';
import { EDUCATION_LEVELS, LMI_EFFECTIVE_DATE, WAGE_TIERS } from './crs/tables.js';
import { CheckField, RadioGroup, Section, SelectField } from './components/Fields.jsx';
import LanguageInput from './components/LanguageInput.jsx';
import LocalePicker from './components/LocalePicker.jsx';
import ScoreSummary from './components/ScoreSummary.jsx';
import DrawsModal from './components/DrawsModal.jsx';
import { useDraws } from './draws/useDraws.js';
import { useI18n } from './i18n/I18nProvider.jsx';
import { buildShareUrl, decodeState } from './shareLink.js';

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

const HIGH_WAGE_LIST_URL = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/high-wage.html';

const SOURCES = [
  ['footer.criteria', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html'],
  ['footer.changes', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html'],
  ['footer.languageTesting', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html'],
];

// Option lists depend on the current language, so they are built from `t`.
function buildOptions(t) {
  const years = (max, lastKey) => Array.from({ length: max + 1 }, (_, n) => ({
    key: String(n),
    label: n === 0 ? t('years.none') : n === max ? t(lastKey) : n === 1 ? t('years.one') : t('years.n', { n }),
  }));
  return {
    ages: Array.from({ length: 31 }, (_, i) => {
      const age = i + 17;
      return { key: String(age), label: age === 17 ? t('about.age17') : age === 47 ? t('about.age47') : String(age) };
    }),
    canadianYears: years(5, 'years.fivePlus'),
    foreignYears: years(3, 'years.threePlus'),
    education: EDUCATION_LEVELS.map(({ key }) => ({ key, label: t(`edu.${key}`) })),
    canadianEducation: ['none', 'short', 'long'].map((key) => ({ key, label: t(`canEdu.${key}`) })),
    wage: WAGE_TIERS.map(({ key }) => ({ key, label: t(`wage.${key}`) })),
  };
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
    // Paper is white and printers usually skip backgrounds, so always print with the light theme.
    const toLight = () => document.documentElement.setAttribute('data-bs-theme', 'light');
    const restore = () => document.documentElement.setAttribute('data-bs-theme', theme);
    window.addEventListener('beforeprint', toLight);
    window.addEventListener('afterprint', restore);
    return () => {
      window.removeEventListener('beforeprint', toLight);
      window.removeEventListener('afterprint', restore);
    };
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

export default function App() {
  const { t, locale } = useI18n();
  const [form, setForm] = useState(loadInitialState);
  const [shareStatus, setShareStatus] = useState('');
  const [theme, toggleTheme] = useTheme();
  const draws = useDraws();
  const [drawsOpen, setDrawsOpen] = useState(false);
  const openDraws = useCallback(() => setDrawsOpen(true), []);
  const closeDraws = useCallback(() => setDrawsOpen(false), []);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const options = useMemo(() => buildOptions(t), [t]);

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
    const url = buildShareUrl(window.location.href, form);
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('summary.copied');
    } catch {
      window.history.replaceState(null, '', url);
      setShareStatus('summary.inAddressBar');
    }
    setTimeout(() => setShareStatus(''), 2500);
  };

  const reset = () => {
    setForm({ ...DEFAULTS });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  return (
    <>
      <nav className="navbar border-bottom bg-body sticky-top d-print-none">
        <div className="container flex-nowrap gap-2">
          <span className="navbar-brand d-flex align-items-center gap-2 mb-0 me-auto text-truncate">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="28" height="28" />
            <span className="fw-semibold text-truncate">{t('app.brand')}</span>
            <span className="badge text-bg-secondary fw-normal d-none d-md-inline">{t('app.unofficial')}</span>
          </span>
          <LocalePicker />
          <button type="button" className="btn btn-sm btn-outline-secondary text-nowrap" onClick={toggleTheme}
            aria-label={t('app.toggleTheme')} title={t('app.toggleTheme')}>
            {theme === 'dark' ? '☀︎' : '☾'}
            <span className="d-none d-sm-inline"> {t(theme === 'dark' ? 'app.themeLight' : 'app.themeDark')}</span>
          </button>
        </div>
      </nav>

      <header className="hero py-4 mb-4">
        <div className="container">
          <h1 className="h3 fw-bold mb-1">{t('app.heroTitle')}</h1>
          <p className="mb-0 text-body-secondary d-print-none">{t('app.heroText')}</p>
          <button type="button" className="btn btn-outline-danger btn-sm mt-3 d-print-none" onClick={openDraws}>
            📊 {t('draws.button')}
          </button>
          {locale !== 'en' && <p className="small text-body-secondary fst-italic mt-2 mb-0">{t('app.translationNote')}</p>}
        </div>
      </header>

      <main className="container pb-5">
        <div className="row g-4">
          <div className="col-lg-7 col-xl-8">
            <Section step="1" title={t('rules.title')}>
              <RadioGroup name="rules" label={t('rules.question')} value={form.rules} onChange={set('rules')}
                options={[
                  { key: 'current', label: t('rules.before') },
                  { key: 'lmi2026', label: t('rules.after') },
                ]} />
              <div className="form-text">{t('rules.help')}</div>
            </Section>

            <Section step="2" title={t('about.title')}>
              <div className="row">
                <div className="col-md-6">
                  <SelectField label={t('about.maritalStatus')} value={form.maritalStatus} onChange={set('maritalStatus')}
                    options={[
                      { key: 'single', label: t('about.single') },
                      { key: 'married', label: t('about.married') },
                    ]} />
                </div>
                <div className="col-md-6">
                  <SelectField label={t('about.age')} value={form.age} onChange={set('age')} options={options.ages}
                    help={t('about.ageHelp')} />
                </div>
              </div>
              {form.maritalStatus === 'married' && (
                <div className="border rounded p-3 bg-body-tertiary">
                  <CheckField label={t('about.spouseCanadian')}
                    checked={form.spouseIsCanadian} onChange={set('spouseIsCanadian')} />
                  {!form.spouseIsCanadian && (
                    <CheckField label={t('about.spouseComing')}
                      checked={form.spouseComing} onChange={set('spouseComing')} />
                  )}
                  <div className="small fw-medium">{t(withSpouse ? 'about.scoredWith' : 'about.scoredSingle')}</div>
                </div>
              )}
            </Section>

            <Section step="3" title={t('education.title')}>
              <SelectField label={t('education.highest')} value={form.education} onChange={set('education')}
                options={options.education} help={t('education.ecaHelp')} />
              <SelectField label={t('education.canadian')} value={form.canadianEducation}
                onChange={set('canadianEducation')} options={options.canadianEducation} className="mb-0" />
            </Section>

            <Section step="4" title={t('lang.title')} subtitle={t('lang.subtitle')}>
              <RadioGroup name="firstLanguage" label={t('lang.first')} value={form.firstLanguage}
                onChange={changeFirstLanguage}
                options={[{ key: 'en', label: t('lang.english') }, { key: 'fr', label: t('lang.french') }]} />
              <LanguageInput language={form.firstLanguage} value={form.first} onChange={set('first')} />
              <hr />
              <CheckField label={t(secondLanguage === 'fr' ? 'lang.hasSecondFr' : 'lang.hasSecondEn')}
                checked={form.hasSecond} onChange={set('hasSecond')} help={t('lang.secondHelp')} />
              {form.hasSecond && (
                <LanguageInput language={secondLanguage} value={form.second} onChange={set('second')} />
              )}
            </Section>

            <Section step="5" title={t('work.title')} subtitle={t('work.subtitle')}>
              <div className="row">
                <div className="col-md-6">
                  <SelectField label={t('work.canadian')} value={form.canadianYears}
                    onChange={set('canadianYears')} options={options.canadianYears} />
                </div>
                <div className="col-md-6">
                  <SelectField label={t('work.foreign')} value={form.foreignYears}
                    onChange={set('foreignYears')} options={options.foreignYears} />
                </div>
              </div>
              <CheckField label={t('work.trade')} checked={form.tradeCertificate} onChange={set('tradeCertificate')} />

              {lmi && (
                <div className="border rounded p-3 bg-body-tertiary">
                  <h3 className="h6">{t('lmi.title')}</h3>
                  <div className="row">
                    <div className="col-md-6">
                      <SelectField label={t('lmi.highWage')} value={form.highWage}
                        onChange={set('highWage')} options={options.wage}
                        help={(
                          <>
                            {t('lmi.highWageHelp')}{' '}
                            <a href={HIGH_WAGE_LIST_URL} target="_blank" rel="noreferrer">{t('lmi.highWageList')} ↗</a>
                          </>
                        )} />
                    </div>
                    <div className="col-md-6">
                      <SelectField label={t('lmi.jobOffer')} value={form.jobOffer} onChange={set('jobOffer')}
                        options={options.wage} help={t('lmi.jobOfferHelp')} />
                    </div>
                  </div>
                  <div className="small text-body-secondary">
                    {t('lmi.higherOf', { work: result.labour.workPath, offer: result.labour.jobOfferPath })}
                  </div>
                </div>
              )}
            </Section>

            {withSpouse && (
              <Section step="6" title={t('spouse.title')}>
                <div className="row">
                  <div className="col-md-6">
                    <SelectField label={t('spouse.education')} value={form.spouseEducation}
                      onChange={set('spouseEducation')} options={options.education} />
                  </div>
                  <div className="col-md-6">
                    <SelectField label={t('spouse.canadianWork')} value={form.spouseCanadianYears}
                      onChange={set('spouseCanadianYears')} options={options.canadianYears} />
                  </div>
                </div>
                <h3 className="h6">{t('spouse.language')}</h3>
                <LanguageInput value={form.spouseLanguage} onChange={set('spouseLanguage')} />
              </Section>
            )}

            <Section step={withSpouse ? '7' : '6'} title={t('additional.title')}>
              <CheckField label={t('additional.nomination')} checked={form.nomination} onChange={set('nomination')} />
              <CheckField label={t('additional.sibling')} checked={form.sibling} onChange={set('sibling')} />
            </Section>
          </div>

          <aside className="col-lg-5 col-xl-4" id="score">
            <div className="sticky-lg-top score-sticky">
              <ScoreSummary result={result} onShare={share} shareStatus={shareStatus} onReset={reset}
                draws={draws} onOpenDraws={openDraws} />
            </div>
          </aside>
        </div>
      </main>

      <div className="mobile-score-bar fixed-bottom d-lg-none d-print-none bg-body border-top shadow-lg">
        <div className="container d-flex align-items-center justify-content-between py-2">
          <div>
            <div className="small text-body-secondary lh-1">{t('mobile.score')}</div>
            <div className="fs-3 fw-bold text-danger lh-sm">{result.total}</div>
          </div>
          <a href="#score" className="btn btn-outline-danger btn-sm"
            onClick={(e) => { e.preventDefault(); document.getElementById('score').scrollIntoView({ behavior: 'smooth' }); }}>
            {t('mobile.breakdown')}
          </a>
        </div>
      </div>

      <DrawsModal open={drawsOpen} onClose={closeDraws} draws={draws} score={result.total} />

      <footer className="border-top py-4 small text-body-secondary">
        <div className="container">
          <p className="mb-2">
            <strong>{t('footer.disclaimerLabel')}</strong> {t('footer.disclaimer')}{' '}
            <a href="https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp" target="_blank" rel="noreferrer">
              {t('footer.officialTool')}
            </a>
          </p>
          <p className="mb-1">{t('footer.sources')}</p>
          <ul className="list-inline mb-2">
            {SOURCES.map(([key, href]) => (
              <li className="list-inline-item" key={key}>
                <a href={href} target="_blank" rel="noreferrer">{t(key)}</a>
              </li>
            ))}
          </ul>
          <a href="https://github.com/cal924/canada-crs-calculator" target="_blank" rel="noreferrer">{t('footer.source')}</a>
        </div>
      </footer>
    </>
  );
}
