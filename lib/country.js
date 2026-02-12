export const DEFAULT_COUNTRY = 'Nigeria';
export const FALLBACK_COUNTRIES = [DEFAULT_COUNTRY, 'UK', 'USA'];

export function normalizeCountry(value) {
  return String(value || '').trim();
}

export function normalizeCountryLower(value) {
  return normalizeCountry(value).toLowerCase();
}

export function getCountryTerms(country) {
  const normalized = normalizeCountryLower(country);
  if (!normalized) return [];
  if (normalized === 'uk') return ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland'];
  if (normalized === 'usa') return ['usa', 'us', 'united states', 'united states of america'];
  if (normalized === 'nigeria') return ['nigeria'];
  return [normalized];
}

export function sanitizeCountryList(values) {
  const deduped = Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => normalizeCountry(value))
        .filter(Boolean)
    )
  );

  for (const fallback of FALLBACK_COUNTRIES) {
    if (!deduped.includes(fallback)) deduped.push(fallback);
  }

  deduped.sort((a, b) => {
    if (a === DEFAULT_COUNTRY) return -1;
    if (b === DEFAULT_COUNTRY) return 1;
    return a.localeCompare(b);
  });

  return deduped;
}
