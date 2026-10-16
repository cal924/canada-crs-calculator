import { useId } from 'react';

export function Section({ title, subtitle, children, step }) {
  return (
    <section className="card shadow-sm mb-4">
      <div className="card-header bg-body-tertiary d-flex align-items-center gap-2">
        {step && <span className="badge rounded-pill text-bg-danger">{step}</span>}
        <h2 className="h6 mb-0">{title}</h2>
      </div>
      <div className="card-body">
        {subtitle && <p className="text-body-secondary small">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function SelectField({ label, value, onChange, options, help, className = 'mb-3' }) {
  const id = useId();
  return (
    <div className={className}>
      <label className="form-label fw-medium" htmlFor={id}>{label}</label>
      <select id={id} className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      {help && <div className="form-text">{help}</div>}
    </div>
  );
}

export function CheckField({ label, checked, onChange, help }) {
  const id = useId();
  return (
    <div className="form-check form-switch mb-3">
      <input id={id} className="form-check-input" type="checkbox" role="switch" checked={checked}
        onChange={(e) => onChange(e.target.checked)} />
      <label className="form-check-label" htmlFor={id}>{label}</label>
      {help && <div className="form-text">{help}</div>}
    </div>
  );
}

export function RadioGroup({ label, name, value, onChange, options }) {
  return (
    <fieldset className="mb-3">
      <legend className="form-label fw-medium fs-6">{label}</legend>
      <div className="d-flex flex-wrap gap-2" role="group">
        {options.map((o) => (
          <span key={o.key}>
            <input type="radio" className="btn-check" name={name} id={`${name}-${o.key}`} autoComplete="off"
              checked={value === o.key} onChange={() => onChange(o.key)} />
            <label className="btn btn-outline-danger" htmlFor={`${name}-${o.key}`}>{o.label}</label>
          </span>
        ))}
      </div>
    </fieldset>
  );
}
