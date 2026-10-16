import { parseDate } from '../draws/useDraws.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

function Row({ label, value, muted }) {
  return (
    <li className={`list-group-item d-flex justify-content-between gap-2 py-1 px-0 border-0 ${muted ? 'text-body-secondary' : ''}`}>
      <span>{label}</span><span className="fw-semibold">{value}</span>
    </li>
  );
}

function Group({ title, total, max, children }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-baseline gap-2 border-bottom pb-1 mb-1">
        <h3 className="h6 mb-0">{title}</h3>
        <span className="fw-bold text-nowrap">{total}<span className="text-body-secondary fw-normal small"> / {max}</span></span>
      </div>
      <ul className="list-group list-group-flush small">{children}</ul>
    </div>
  );
}

function LatestDraw({ draws, total, onOpenDraws, t, locale }) {
  const latest = draws.data?.rounds[0];
  return (
    <div className="border rounded p-2 mb-3 small d-flex align-items-center justify-content-between gap-2 d-print-none">
      <div>
        {latest ? (
          <>
            <div className="text-body-secondary">
              {t('draws.latestCutoff', {
                date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parseDate(latest.date)),
              })}
            </div>
            <div>
              <span className="fw-bold fs-5">{latest.crs}</span>{' '}
              <span className="text-body-secondary">{latest.category}</span>
            </div>
            <div className={total >= latest.crs ? 'text-success fw-medium' : 'text-body-secondary'}>
              {total >= latest.crs ? t('draws.aboveLatest') : t('draws.belowLatest', { gap: latest.crs - total })}
            </div>
          </>
        ) : (
          <span className="text-body-secondary">{t('draws.title')}</span>
        )}
      </div>
      <button type="button" className="btn btn-sm btn-outline-danger text-nowrap" onClick={onOpenDraws}>
        {t('draws.button')}
      </button>
    </div>
  );
}

export default function ScoreSummary({ result, onShare, shareStatus, onReset, draws, onOpenDraws }) {
  const { t, locale } = useI18n();
  const r = result;
  const lmi = r.rules === 'lmi2026';
  const s = r.withSpouse;

  return (
    <div className="card shadow score-card">
      <div className="card-body">
        <div className="text-center mb-3">
          <div className="text-body-secondary small text-uppercase fw-semibold">{t('summary.heading')}</div>
          <div className="display-3 fw-bold text-danger lh-1 my-2" aria-live="polite">{r.total}</div>
          <span className="badge text-bg-light border text-wrap">
            {t(lmi ? 'summary.rulesAfter' : 'summary.rulesBefore')} · {t(s ? 'summary.withSpouse' : 'summary.single')}
          </span>
        </div>

        <LatestDraw draws={draws} total={r.total} onOpenDraws={onOpenDraws} t={t} locale={locale} />

        <Group title={t('summary.core')} total={r.coreTotal} max={lmi ? (s ? 390 : 420) : (s ? 460 : 500)}>
          <Row label={t('summary.age')} value={r.core.age} />
          <Row label={t('summary.education')} value={r.core.education} />
          <Row label={t('summary.firstLanguage')} value={r.core.firstLanguage} />
          <Row label={t('summary.secondLanguage')} value={r.core.secondLanguage} />
          {!lmi && <Row label={t('summary.canadianWork')} value={r.core.canadianWork} />}
        </Group>

        {s && (
          <Group title={t('summary.spouse')} total={r.spouseTotal} max={40}>
            <Row label={t('summary.education')} value={r.spouse.education} />
            <Row label={t('summary.firstLanguage')} value={r.spouse.language} />
            <Row label={t('summary.canadianWork')} value={r.spouse.canadianWork} />
          </Group>
        )}

        <Group title={t('summary.transfer')} total={r.transferTotal} max={100}>
          <Row label={t('summary.transferEducation')} value={r.transferGroups.education} />
          <Row label={t('summary.transferForeign')} value={r.transferGroups.foreignWork} />
          <Row label={t('summary.trade')} value={r.transferGroups.trade} />
        </Group>

        {lmi && (
          <Group title={t('summary.labour')} total={r.labourTotal} max={s ? 140 : 150}>
            <Row label={t('summary.workLength')} value={r.labour.workLength} muted={r.labour.selected !== 'work'} />
            <Row label={t('summary.highWage')} value={r.labour.highWage} muted={r.labour.selected !== 'work'} />
            <Row label={t('summary.jobOffer')} value={r.labour.jobOfferPath} muted={r.labour.selected !== 'jobOffer'} />
            <li className="list-group-item px-0 py-1 border-0 small text-body-secondary">
              {t(r.labour.selected === 'work' ? 'summary.labourNoteWork' : 'summary.labourNoteOffer')}
            </li>
          </Group>
        )}

        <Group title={t('summary.additional')} total={r.additionalTotal} max={600}>
          <Row label={t('summary.nomination')} value={r.additional.nomination} />
          <Row label={t('summary.french')} value={r.additional.french} />
          <Row label={t('summary.canadianEducation')} value={r.additional.canadianEducation} />
          <Row label={t('summary.sibling')} value={r.additional.sibling} />
        </Group>

        <div className="d-grid gap-2 d-print-none">
          <button type="button" className="btn btn-danger" onClick={onShare}>
            {shareStatus ? t(shareStatus) : t('summary.share')}
          </button>
          <div className="btn-group">
            <button type="button" className="btn btn-outline-secondary" onClick={() => window.print()}>{t('summary.print')}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={onReset}>{t('summary.reset')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
