import { useEffect, useState } from 'react';

// Static file written by scripts/fetch-rounds.mjs (refreshed by the "Update Express Entry draws" workflow).
const DATA_URL = `${import.meta.env.BASE_URL}data/ee-rounds.json`;

let cache = null;

/** Loads the stored draws data once per page. Returns { data, error }. */
export function useDraws() {
  const [state, setState] = useState(() => (cache ? { data: cache, error: null } : { data: null, error: null }));

  useEffect(() => {
    if (cache) return undefined;
    let cancelled = false;
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        cache = data;
        if (!cancelled) setState({ data, error: null });
      })
      .catch((error) => { if (!cancelled) setState({ data: null, error }); });
    return () => { cancelled = true; };
  }, []);

  return state;
}

/** Parse "YYYY-MM-DD" as a local calendar date (avoids a time-zone shift to the previous day). */
export function parseDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}
