import { useId } from 'react';
import { LANGUAGE_TESTS, SKILLS, inputFor, testsFor, toClb } from '../crs/languageTests.js';

const clbOptions = Array.from({ length: 11 }, (_, n) => ({
  key: String(n),
  label: n < 4 ? (n === 0 ? 'Below 4 / none' : null) : n === 10 ? '10 or more' : String(n),
})).filter((o) => o.label);

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
  const tests = language ? testsFor(language) : [...testsFor('en'), ...testsFor('fr')];
  const test = LANGUAGE_TESTS[value.test];
  const prefix = test?.language === 'fr' ? 'NCLC' : 'CLB';

  const setScore = (i, score) => onChange({ ...value, scores: value.scores.map((s, j) => (j === i ? score : s)) });

  return (
    <div>
      <div className="mb-3">
        <label className="form-label fw-medium" htmlFor={`${id}-test`}>Language test</label>
        <select id={`${id}-test`} className="form-select" value={value.test}
          onChange={(e) => onChange({ test: e.target.value, scores: ['', '', '', ''] })}>
          {tests.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>
      <div className="row g-2">
        {SKILLS.map((skill, i) => {
          const clb = toClb(value.test, i, value.scores[i]);
          const input = inputFor(value.test, i);
          return (
            <div className="col-6 col-md-3" key={skill}>
              <label className="form-label small mb-1" htmlFor={`${id}-${i}`}>{skill}</label>
              {test?.direct ? (
                <select id={`${id}-${i}`} className="form-select" value={value.scores[i] === '' ? '0' : value.scores[i]}
                  onChange={(e) => setScore(i, e.target.value)}>
                  {clbOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              ) : (
                <>
                  <input id={`${id}-${i}`} type="number" inputMode="decimal" className="form-control"
                    min={input.min} max={input.max} step={input.step} placeholder={`${input.min}–${input.max}`}
                    value={value.scores[i]} onChange={(e) => setScore(i, e.target.value)} />
                  <div className="mt-1"><ClbBadge clb={clb} prefix={prefix} /></div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
