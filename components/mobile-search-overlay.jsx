"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Building2, CheckCircle, FolderOpen, Loader2, MapPin, Search, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_COUNTRY, sanitizeCountryList } from '@/lib/country';
import { detectClientCountry, fetchCountryOptions, getStoredCountry } from '@/lib/country-client';
import { getRatingColorClasses } from '@/lib/rating-colors';

const suggestedSearches = [
  'Best educational institution',
  'Roofing contractor near me',
  'Insurance agency in Los Angeles',
  'Womens clothing store in New York',
  'Furniture store in United States',
];
const countryStorageKey = 'sr:search-country';
const countryCookieKey = 'sr_country';

function formatReviewCount(count) {
  if (!count) return '0 reviews';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M reviews`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K reviews`;
  return `${count} reviews`;
}

export function MobileSearchOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [countryOptions, setCountryOptions] = useState([DEFAULT_COUNTRY, 'UK', 'USA']);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ companies: [], categories: [], locations: [] });

  const hasInput = query.trim().length >= 2;
  const hasResults =
    results.companies.length > 0 ||
    results.categories.length > 0 ||
    results.locations.length > 0;
  const hasCoreResults = results.companies.length > 0;

  useEffect(() => {
    let mounted = true;
    const loadCountries = async () => {
      const fetched = await fetchCountryOptions().catch(() => ({
        countries: [DEFAULT_COUNTRY, 'UK', 'USA'],
        defaultCountry: DEFAULT_COUNTRY,
      }));
      const options = sanitizeCountryList(fetched.countries || []);
      const stored = getStoredCountry(countryStorageKey, countryCookieKey, options);
      const detected = detectClientCountry();
      const resolved =
        stored || (options.includes(detected) ? detected : fetched.defaultCountry || DEFAULT_COUNTRY);
      if (!mounted) return;
      setCountryOptions(options);
      setCountry(resolved);
    };

    void loadCountries();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(countryStorageKey, country);
    document.cookie = `${countryCookieKey}=${encodeURIComponent(country)}; path=/; max-age=31536000; samesite=lax`;
  }, [country]);

  const openOverlay = (initialQuery = '') => {
    setOpen(true);
    setQuery(initialQuery || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeOverlay = () => {
    setOpen(false);
  };

  function handleCountryChange(nextCountry) {
    setCountry(nextCountry);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(countryStorageKey, nextCountry);
    document.cookie = `${countryCookieKey}=${encodeURIComponent(nextCountry)}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new CustomEvent('sr:country-changed', { detail: { country: nextCountry } }));

    if (pathname === '/') {
      const params = new URLSearchParams(window.location.search || '');
      params.set('country', nextCountry);
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : '/', { scroll: false });
      router.refresh();
    }
  }

  useEffect(() => {
    const onOpen = (event) => {
      const initialQuery = event?.detail?.initialQuery || '';
      openOverlay(initialQuery);
    };

    window.addEventListener('sr:open-mobile-search', onOpen);
    return () => window.removeEventListener('sr:open-mobile-search', onOpen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!open || !hasInput) {
        setResults({ companies: [], categories: [], locations: [] });
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(country)}`
        );
        const data = await response.json();
        setResults({
          companies: Array.isArray(data.companies) ? data.companies : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
          locations: Array.isArray(data.locations) ? data.locations : [],
        });
      } catch (error) {
        setResults({ companies: [], categories: [], locations: [] });
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [open, query, hasInput, country]);

  const companyRows = useMemo(() => results.companies.slice(0, 5), [results.companies]);

  function goTo(url) {
    closeOverlay();
    router.push(url);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) return;
    goTo(
      `/companies?search=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(country)}`
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => openOverlay()}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-white">
          <div className="border-b px-3 py-3">
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                placeholder="Search company or category"
                className="h-12 border-0 pl-11 pr-11 text-lg shadow-none focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={closeOverlay}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-primary"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="h-[calc(100dvh-73px)] overflow-y-auto px-3 py-4 bg-white">
            {!hasInput ? (
              <Card className="border-0 bg-transparent shadow-none">
                <div className="space-y-4 px-1">
                  <p className="text-base font-semibold">Suggested searches</p>
                  {suggestedSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        goTo(
                          `/companies?search=${encodeURIComponent(item)}&country=${encodeURIComponent(
                            country
                          )}`
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left hover:bg-muted"
                    >
                      <Search className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base leading-6 sm:text-lg">{item}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ) : loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : hasResults ? (
              <div className="space-y-4">
                {companyRows.length > 0 && (
                  <Card className="p-2">
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Companies</p>
                    {companyRows.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => goTo(`/company/${company.slug}`)}
                        className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                      >
                        {company.logo ? (
                          <img src={company.logo} alt={company.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{company.name}</p>
                            {company.verified && <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatReviewCount(company.reviewCount)} | {company.averageRating || 0}
                            <Star className={cn('ml-1 inline h-3 w-3', getRatingColorClasses(company.averageRating).solid)} />
                          </p>
                        </div>
                      </button>
                    ))}
                  </Card>
                )}

                {results.categories.length > 0 && (
                  <Card className="p-2">
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</p>
                    {results.categories.map((category) => (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() =>
                          goTo(
                            `/companies?category=${encodeURIComponent(
                              category.name
                            )}&country=${encodeURIComponent(country)}`
                          )
                        }
                        className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                      >
                        <FolderOpen className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.businessCount} companies</p>
                        </div>
                      </button>
                    ))}
                  </Card>
                )}

                {results.locations.length > 0 && (
                  <Card className="p-2">
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Locations</p>
                    {results.locations.map((location) => (
                      <button
                        key={location.name}
                        type="button"
                        onClick={() =>
                          goTo(
                            `/companies?location=${encodeURIComponent(
                              location.name
                            )}&country=${encodeURIComponent(country)}`
                          )
                        }
                        className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                      >
                        <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-xs text-muted-foreground">{location.businessCount} businesses</p>
                        </div>
                      </button>
                    ))}
                  </Card>
                )}
                {!hasCoreResults && query.trim().length > 1 && (
                  <Card className="p-3">
                    <Button
                      type="button"
                      onClick={() =>
                        goTo(
                          `/companies?add=1&name=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(
                            country
                          )}`
                        )
                      }
                      className="w-full"
                    >
                      Create this company
                    </Button>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-3 px-1 py-2">
                <p className="text-sm text-muted-foreground">No matching companies or categories.</p>
                {query.trim().length > 1 && (
                  <Button
                    type="button"
                    onClick={() =>
                      goTo(
                        `/companies?add=1&name=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(
                          country
                        )}`
                      )
                    }
                    className="w-full"
                  >
                    Create this company
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="border-t bg-white px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Country</p>
              <select
                value={country}
                onChange={(event) => handleCountryChange(event.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                {countryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
