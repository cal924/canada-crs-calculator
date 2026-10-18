import { useId } from 'react';
import { LANGUAGE_TESTS, SKILLS, inputFor, isValidScore, testsFor, toClb } from '../crs/languageTests.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

function ClbBadge({ clb, prefix }) {
  const tone = clb >= 9 ? 'success' : clb >= 7 ? 'primary' : clb >= 4 ? 'warning' : 'secondary';
  return <span className={`badge text-bg-${tone} clb-badge`}>{clb >= 4 ? `${prefix} ${clb}` : `< ${prefix} 4`}</span>;
}

/**
 * Four-skill language input. `value` is { test, scores: [L, R, W, S] }.
 * `language` limits the test list to 'en' or 'fr'; omit to allow both.
 */
export default function LanguageInput({ value, onChange, language }) {
  const id = useId();
  const { t } = useI18n();
  const tests = language ? testsFor(language) : [...testsFor('en'), ...testsFor('fr')];
  const test = LANGUAGE_TESTS[value.test];
  const prefix = test?.language === 'fr' ? 'NCLC' : 'CLB';
  const clbOptions = [
    { key: '0', label: t('lang.below4') },
    ...[4, 5, 6, 7, 8, 9].map((n) => ({ key: String(n), label: String(n) })),
    { key: '10', label: t('lang.tenPlus') },
  ];

  const setScore = (i, score) => onChange({ ...value, scores: value.scores.map((s, j) => (j === i ? score : s)) });

  return (
    <div>
      <div className="mb-3">
        <label className="form-label fw-medium" htmlFor={`${id}-test`}>{t('lang.test')}</label>
        <select id={`${id}-test`} className="form-select" value={value.test}
          onChange={(e) => onChange({ test: e.target.value, scores: ['', '', '', ''] })}>
          {tests.map((x) => <option key={x.key} value={x.key}>{x.labelKey ? t(x.labelKey) : x.label}</option>)}
        </select>
      </div>
      <div className="row g-2">
        {SKILLS.map((skill, i) => {
          const clb = toClb(value.test, i, value.scores[i]);
          const input = inputFor(value.test, i);
          const valid = test?.direct || isValidScore(value.test, i, value.scores[i]);
          return (
            <div className="col-6 col-md-3" key={skill}>
              <label className="form-label small mb-1" htmlFor={`${id}-${i}`}>{t(`skill.${skill}`)}</label>
              {test?.direct ? (
                <select id={`${id}-${i}`} className="form-select" value={value.scores[i] === '' ? '0' : value.scores[i]}
                  onChange={(e) => setScore(i, e.target.value)}>
                  {clbOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              ) : (
                <>
                  <input id={`${id}-${i}`} type="number" inputMode="decimal"
                    className={`form-control ${valid ? '' : 'is-invalid'}`} aria-invalid={!valid}
                    aria-describedby={valid ? undefined : `${id}-${i}-error`}
                    min={input.min} max={input.max} step={input.step} placeholder={`${input.min}–${input.max}`}
                    value={value.scores[i]} onChange={(e) => setScore(i, e.target.value)} />
                  {valid ? (
                    <div className="mt-1"><ClbBadge clb={clb} prefix={prefix} /></div>
                  ) : (
                    <div id={`${id}-${i}-error`} className="invalid-feedback d-block">
                      {input.step === 1
                        ? t('lang.invalidScore', { min: input.min, max: input.max })
                        : t('lang.invalidScoreStep', { min: input.min, max: input.max, step: input.step })}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
