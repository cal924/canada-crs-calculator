# canada-crs-calculator

An unofficial **Canada Express Entry CRS (Comprehensive Ranking System) score calculator**.
It is a static site built with React and Bootstrap 5 and hosted on GitHub Pages. Everything runs in the browser:
there is no backend, and nothing you enter leaves the page.

Live site: https://cal924.github.io/canada-crs-calculator/

## Features

- All four CRS sections: core/human capital, spouse/partner factors, skill transferability (with the
  50-point group caps and 100-point total cap), and additional points (PNP, French bonus, Canadian education, sibling).
- **Two rule sets**: the rules before November 3, 2026, and the **Labour Market Integration** factor that applies
  from November 3, 2026 (the higher of Canadian work length plus high-wage experience, or a high-wage job offer).
  The default depends on today's date.
- Enter raw scores for **IELTS General, CELPIP-General, PTE Core and TCF Canada**, or enter CLB/NCLC levels
  directly (use NCLC levels for TEF Canada).
- **Five interface languages:** English, Français, 繁體中文, 简体中文 and हिन्दी. The starting language is, in order:
  `?lang=` in the address (`fr`, `zh-Hant`/`zh-TW`/`zh-HK`, `zh-Hans`/`zh-CN`, `hi` or `en`, e.g.
  https://cal924.github.io/canada-crs-calculator/?lang=fr), then the last language picked in the menu, then the
  browser's language, then English. Picking a language also writes `?lang=` into the address. Links from the share button
  leave `?lang=` out, so the recipient sees their own language. A `?lang=` link on its own isn't remembered.
- **Latest Express Entry draws:** a popup with every round of invitations (filter by draw type, ✓ where your
  score met the cutoff), the current pool score distribution, the data's last-update time and a link to IRCC's
  rounds page. The score card also shows the latest draw's cutoff.
- Live score breakdown, shareable link (state in the URL hash), print view, light/dark theme.
- Inputs are saved in `localStorage` in your browser.

## Development

Requires Node.js 24+ (see `.nvmrc`; run `nvm use`).

```bash
npm install
npm run dev      # http://localhost:5173/canada-crs-calculator/
npm test         # unit tests (node:test)
npm run fetch-draws  # refresh public/data/ee-rounds.json from IRCC
npm run build    # static output in dist/
```

## Project layout

```
src/crs/tables.js         IRCC point tables (edit these when IRCC changes the rules)
src/crs/calculator.js     pure scoring engine, no React
src/crs/languageTests.js  test score → CLB/NCLC conversion
src/i18n/locales/         UI translations (en.js is the source and fallback)
src/components/           Bootstrap form fields, language input, language picker, score summary
src/App.jsx               page layout and form state
src/components/DrawsModal.jsx  draws popup
scripts/fetch-rounds.mjs  downloads and slims IRCC's rounds JSON
public/data/ee-rounds.json  stored draws data (updated by GitHub Actions)
tests/                    unit tests for the engine and translations
```

## Draws data

`.github/workflows/update-draws.yml` runs every 6 hours (and on demand from the Actions tab). It downloads
[IRCC's rounds JSON](https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json), keeps only the
fields the site needs, and writes `public/data/ee-rounds.json`. If there's a new draw, it commits the file and
starts the Pages deploy. If IRCC's format changes, the script fails instead of writing bad data, and the site keeps
the last good copy.

`updatedAt` in the file is the time the draw data last changed, which the popup shows as "Data updated".

GitHub pauses scheduled workflows in public repos after 60 days without activity. New draws create commits, which
counts as activity, so this only matters if IRCC stops publishing draws.

## Adding or editing a language

1. Copy `src/i18n/locales/en.js` to a new file such as `pa.js`, and translate the values. Keep the keys and any
   `{placeholders}` unchanged.
2. Register it in the `LOCALES` list in `src/i18n/index.js`. Its `code` is the `?lang=` value.
3. Run `npm test`. It fails if any key or placeholder is missing.

## Deploying to GitHub Pages

1. Push to the `main` branch of `github.com/cal924/canada-crs-calculator`.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes `dist/`.

If you rename the repository, update `base` in `vite.config.js`.

## Sources and disclaimer

Point tables come from IRCC's
[CRS criteria](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html),
[Express Entry changes](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html)
and [language testing](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html)
pages, checked on 2026-10-16.

This tool is not affiliated with IRCC. It estimates points only. It does not check program eligibility,
whether work experience qualifies, or whether a job offer is valid. Confirm your score with the
[official IRCC CRS tool](https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp).
