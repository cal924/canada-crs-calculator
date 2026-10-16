import { useI18n } from '../i18n/I18nProvider.jsx';

export default function LocalePicker() {
  const { locale, setLocale, locales, t } = useI18n();
  return (
    <div className="input-group input-group-sm locale-picker">
      <label className="input-group-text" htmlFor="locale-picker" title={t('app.language')}>
        <span aria-hidden="true">🌐</span>
        <span className="visually-hidden">{t('app.language')}</span>
      </label>
      <select id="locale-picker" className="form-select" value={locale} onChange={(e) => setLocale(e.target.value)}>
        {locales.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.name}</option>)}
      </select>
    </div>
  );
}
