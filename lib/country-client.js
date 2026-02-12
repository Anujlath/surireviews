import { DEFAULT_COUNTRY, sanitizeCountryList } from '@/lib/country';

function mapRegionToCountry(region) {
  const code = String(region || '').trim().toUpperCase();
  if (!code) return null;
  if (code === 'NG') return 'Nigeria';
  if (code === 'US') return 'USA';
  if (['GB', 'UK', 'ENG', 'SCT', 'WLS', 'NIR'].includes(code)) return 'UK';
  return null;
}

function parseRegionFromLocale(locale) {
  if (!locale || typeof locale !== 'string') return null;
  const parts = locale.split(/[-_]/g);
  if (parts.length < 2) return null;
  return mapRegionToCountry(parts[1]);
}

function inferFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/lagos/i.test(tz)) return 'Nigeria';
    if (/london|belfast/i.test(tz)) return 'UK';
    if (
      /new_york|chicago|denver|los_angeles|phoenix|anchorage|honolulu/i.test(tz)
    ) {
      return 'USA';
    }
  } catch (_) {
    // Ignore unsupported timezone environments.
  }
  return null;
}

export function detectClientCountry() {
  if (typeof window === 'undefined') return DEFAULT_COUNTRY;

  const browserLocales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of browserLocales) {
    const mapped = parseRegionFromLocale(locale);
    if (mapped) return mapped;
  }

  return inferFromTimezone() || DEFAULT_COUNTRY;
}

export function getStoredCountry(storageKey, cookieKey, validCountries = []) {
  if (typeof window === 'undefined') return null;
  const safeCountries = sanitizeCountryList(validCountries);

  const stored = window.localStorage.getItem(storageKey);
  if (stored && safeCountries.includes(stored)) return stored;

  const cookieCountry = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieKey}=`))
    ?.split('=')[1];
  if (!cookieCountry) return null;

  const decoded = decodeURIComponent(cookieCountry);
  return safeCountries.includes(decoded) ? decoded : null;
}

export async function fetchCountryOptions() {
  const response = await fetch('/api/countries');
  if (!response.ok) {
    return { countries: [DEFAULT_COUNTRY], defaultCountry: DEFAULT_COUNTRY };
  }
  const data = await response.json();
  return {
    defaultCountry: data?.defaultCountry || DEFAULT_COUNTRY,
    countries: sanitizeCountryList(data?.countries || []),
  };
}
