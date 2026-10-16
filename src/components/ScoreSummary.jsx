function Row({ label, value, muted }) {
  return (
    <li className={`list-group-item d-flex justify-content-between py-1 px-0 border-0 ${muted ? 'text-body-secondary' : ''}`}>
      <span>{label}</span><span className="fw-semibold">{value}</span>
    </li>
  );
}

function Group({ title, total, max, children }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-baseline border-bottom pb-1 mb-1">
        <h3 className="h6 mb-0">{title}</h3>
        <span className="fw-bold">{total}<span className="text-body-secondary fw-normal small"> / {max}</span></span>
      </div>
      <ul className="list-group list-group-flush small">{children}</ul>
    </div>
  );
}

export default function ScoreSummary({ result, onShare, shareStatus, onReset }) {
  const r = result;
  const lmi = r.rules === 'lmi2026';
  const s = r.withSpouse;

  return (
    <div className="card shadow score-card">
      <div className="card-body">
        <div className="text-center mb-3">
          <div className="text-body-secondary small text-uppercase fw-semibold">Your estimated CRS score</div>
          <div className="display-3 fw-bold text-danger lh-1 my-2" aria-live="polite">{r.total}</div>
          <span className="badge text-bg-light border">
            {lmi ? 'Rules from Nov 3, 2026' : 'Rules before Nov 3, 2026'} · {s ? 'with spouse/partner' : 'single'}
          </span>
        </div>

        <Group title="Core / human capital" total={r.coreTotal} max={lmi ? (s ? 390 : 420) : (s ? 460 : 500)}>
          <Row label="Age" value={r.core.age} />
          <Row label="Education" value={r.core.education} />
          <Row label="First official language" value={r.core.firstLanguage} />
          <Row label="Second official language" value={r.core.secondLanguage} />
          {!lmi && <Row label="Canadian work experience" value={r.core.canadianWork} />}
        </Group>

        {s && (
          <Group title="Spouse / partner factors" total={r.spouseTotal} max={40}>
            <Row label="Education" value={r.spouse.education} />
            <Row label="First official language" value={r.spouse.language} />
            <Row label="Canadian work experience" value={r.spouse.canadianWork} />
          </Group>
        )}

        <Group title="Skill transferability" total={r.transferTotal} max={100}>
          <Row label="Education (language + Canadian work)" value={r.transferGroups.education} />
          <Row label="Foreign work (language + Canadian work)" value={r.transferGroups.foreignWork} />
          <Row label="Trade certificate" value={r.transferGroups.trade} />
        </Group>

        {lmi && (
          <Group title="Labour market integration" total={r.labourTotal} max={s ? 140 : 150}>
            <Row label="Work length" value={r.labour.workLength} muted={r.labour.selected !== 'work'} />
            <Row label="High-wage experience" value={r.labour.highWage} muted={r.labour.selected !== 'work'} />
            <Row label="Job offer" value={r.labour.jobOfferPath} muted={r.labour.selected !== 'jobOffer'} />
            <li className="list-group-item px-0 py-1 border-0 small text-body-secondary">
              Counts the higher of Canadian work or job offer ({r.labour.selected === 'work' ? 'work' : 'job offer'} applied).
            </li>
          </Group>
        )}

        <Group title="Additional points" total={r.additionalTotal} max={600}>
          <Row label="Provincial nomination" value={r.additional.nomination} />
          <Row label="French language skills" value={r.additional.french} />
          <Row label="Canadian post-secondary education" value={r.additional.canadianEducation} />
          <Row label="Sibling in Canada" value={r.additional.sibling} />
        </Group>

        <div className="d-grid gap-2 d-print-none">
          <button type="button" className="btn btn-danger" onClick={onShare}>
            {shareStatus || 'Copy shareable link'}
          </button>
          <div className="btn-group">
            <button type="button" className="btn btn-outline-secondary" onClick={() => window.print()}>Print</button>
            <button type="button" className="btn btn-outline-secondary" onClick={onReset}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
