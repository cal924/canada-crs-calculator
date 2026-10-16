import { useEffect, useMemo, useRef, useState } from 'react';
import { parseDate } from '../draws/useDraws.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

const PAGE_SIZE = 25;

// IRCC gives the pool date as English text ("October 12, 2026"); show it in the current language when it parses.
function formatLongDate(text, locale) {
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);
}

function RoundsTable({ data, score, locale, t }) {
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);
  const numFmt = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  // Categories ordered by their most recent draw.
  const categories = useMemo(() => [...new Set(data.rounds.map((r) => r.category))], [data]);
  const rounds = category === 'all' ? data.rounds : data.rounds.filter((r) => r.category === category);

  return (
    <>
      <div className="row g-2 align-items-end mb-3">
        <div className="col-sm-6">
          <label className="form-label small mb-1" htmlFor="draw-category">{t('draws.filter')}</label>
          <select id="draw-category" className="form-select form-select-sm" value={category}
            onChange={(e) => { setCategory(e.target.value); setLimit(PAGE_SIZE); }}>
            <option value="all">{t('draws.all')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-sm-6 small text-body-secondary">
          {t('draws.yourScore', { score })} <span className="text-success fw-bold">✓</span> {t('draws.metLegend')}
        </div>
      </div>

      <div className="table-responsive draws-table">
        <table className="table table-sm table-hover align-middle mb-2">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{t('draws.colDate')}</th>
              <th scope="col">{t('draws.colType')}</th>
              <th scope="col" className="text-end d-none d-sm-table-cell">{t('draws.colSize')}</th>
              <th scope="col" className="text-end">{t('draws.colCrs')}</th>
            </tr>
          </thead>
          <tbody>
            {rounds.slice(0, limit).map((r) => {
              const met = score >= r.crs;
              return (
                <tr key={r.number}>
                  <td>
                    <a href={`${data.invitationUrl}${encodeURIComponent(r.number)}`} target="_blank" rel="noreferrer">{r.number}</a>
                  </td>
                  <td className="text-nowrap">{dateFmt.format(parseDate(r.date))}</td>
                  <td>{r.category}</td>
                  <td className="text-end d-none d-sm-table-cell">{numFmt.format(r.size)}</td>
                  <td className={`text-end fw-semibold text-nowrap ${met ? 'text-success' : ''}`}>
                    {met && <span title={t('draws.met')} aria-label={t('draws.met')}>✓ </span>}{r.crs}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rounds.length > limit && (
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
          {t('draws.showMore', { shown: limit, total: rounds.length })}
        </button>
      )}
      <p className="small text-body-secondary mt-2 mb-0">{t('draws.namesNote')}</p>
    </>
  );
}

function DistributionTable({ distribution, score, locale, t }) {
  const numFmt = new Intl.NumberFormat(locale);
  const inRange = (range) => {
    const [lo, hi] = range.split('–').map(Number);
    return score >= lo && score <= hi;
  };
  return (
    <>
      {distribution.asOf && <p className="small text-body-secondary">{t('draws.poolAsOf', { date: formatLongDate(distribution.asOf, locale) })}</p>}
      <table className="table table-sm align-middle mb-0">
        <thead>
          <tr><th scope="col">{t('draws.colRange')}</th><th scope="col" className="text-end">{t('draws.colCandidates')}</th></tr>
        </thead>
        <tbody>
          {distribution.buckets.map((b) => {
            const mine = !b.total && inRange(b.range);
            return (
              <tr key={b.range} className={`${b.total ? 'fw-bold' : ''} ${mine ? 'table-warning' : ''}`}>
                <td className={b.sub ? `ps-4 ${mine ? 'fw-semibold' : 'text-body-secondary'}` : ''}>
                  {b.total ? t('draws.total') : b.range}
                  {mine && b.sub && <span className="badge text-bg-warning ms-2">{t('draws.youAreHere')}</span>}
                </td>
                <td className={`text-end ${b.sub && !mine ? 'text-body-secondary' : ''}`}>{numFmt.format(b.count)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default function DrawsModal({ open, onClose, draws, score }) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState('rounds');
  const dialogRef = useRef(null);
  const { data, error } = draws;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const fmtDate = (d) => new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(d);
  const fmtDateTime = (d) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="draws-title"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-md-down">
          <div className="modal-content" ref={dialogRef} tabIndex={-1}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title h5" id="draws-title">{t('draws.title')}</h2>
                {data && (
                  <div className="small text-body-secondary">
                    {t('draws.latest')}: <strong>{fmtDate(parseDate(data.latestDrawDate))}</strong>
                    <span className="mx-2">·</span>
                    {t('draws.updated')}: <strong>{fmtDateTime(new Date(data.updatedAt))}</strong>
                  </div>
                )}
              </div>
              <button type="button" className="btn-close" aria-label={t('draws.close')} onClick={onClose} />
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-warning mb-0">{t('draws.error')}</div>}
              {!data && !error && (
                <div className="text-center py-5"><div className="spinner-border text-danger" role="status" />
                  <div className="visually-hidden">{t('draws.loading')}</div></div>
              )}
              {data && (
                <>
                  <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                      <button type="button" className={`nav-link ${tab === 'rounds' ? 'active' : ''}`}
                        onClick={() => setTab('rounds')}>{t('draws.tabRounds')}</button>
                    </li>
                    {data.distribution && (
                      <li className="nav-item">
                        <button type="button" className={`nav-link ${tab === 'pool' ? 'active' : ''}`}
                          onClick={() => setTab('pool')}>{t('draws.tabPool')}</button>
                      </li>
                    )}
                  </ul>
                  {tab === 'rounds' || !data.distribution
                    ? <RoundsTable data={data} score={score} locale={locale} t={t} />
                    : <DistributionTable distribution={data.distribution} score={score} locale={locale} t={t} />}
                </>
              )}
            </div>

            <div className="modal-footer">
              <a className="btn btn-danger" target="_blank" rel="noreferrer"
                href={data?.roundsPage ?? 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html'}>
                {t('draws.openIrcc')} ↗
              </a>
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>{t('draws.close')}</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
