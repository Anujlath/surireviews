"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle, FolderOpen, Loader2, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPlacePredictions, geocodePlaceId } from '@/lib/google-maps-client';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, query }) {
  if (!query) return text;
  const escaped = escapeRegExp(query.trim());
  if (!escaped) return text;

  const regex = new RegExp(`(${escaped})`, 'ig');
  const parts = text.split(regex);

  return parts.map((part, index) => (
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className="bg-primary/15 text-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  ));
}

function formatReviewCount(count) {
  if (!count) return '0 reviews';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M reviews`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K reviews`;
  return `${count} reviews`;
}

const countryOptions = ['UK', 'USA', 'Nigeria'];
const countryStorageKey = 'sr:search-country';
const countryCookieKey = 'sr_country';

export function SearchBar({ className, autoFocus = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const wrapperRef = useRef(null);
  const inputContainerRef = useRef(null);
  const hasMountedRef = useRef(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [country, setCountry] = useState('UK');
  const [results, setResults] = useState({ companies: [], categories: [], locations: [], places: [] });
  const [dropdownStyle, setDropdownStyle] = useState({});

  const hasInput = query.trim().length >= 2;
  const hasResults =
    results.companies.length > 0 ||
    results.categories.length > 0 ||
    results.locations.length > 0 ||
    results.places.length > 0;
  const hasCoreResults =
    results.companies.length > 0 ||
    results.categories.length > 0 ||
    results.locations.length > 0;

  const actionItems = useMemo(() => {
    const companyItems = results.companies.map((company) => ({
      type: 'company',
      key: `company-${company.id}`,
      payload: company,
    }));
    const categoryItems = results.categories.map((category) => ({
      type: 'category',
      key: `category-${category.name}`,
      payload: category,
    }));
    const locationItems = results.locations.map((location) => ({
      type: 'location',
      key: `location-${location.name}`,
      payload: location,
    }));
    const placeItems = results.places.map((place) => ({
      type: 'place',
      key: `place-${place.placeId}`,
      payload: place,
    }));
    const showAll = hasInput
      ? [{ type: 'showAll', key: 'show-all', payload: { query: query.trim() } }]
      : [];

    return [...companyItems, ...categoryItems, ...locationItems, ...placeItems, ...showAll];
  }, [results, hasInput, query]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search || '');
    const urlCountry = params.get('country');
    if (urlCountry && countryOptions.includes(urlCountry)) {
      setCountry(urlCountry);
      return;
    }

    const stored = window.localStorage.getItem(countryStorageKey);
    if (stored && countryOptions.includes(stored)) {
      setCountry(stored);
      return;
    }

    const cookieCountry = document.cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('sr_country='))
      ?.split('=')[1];
    if (cookieCountry) {
      const decoded = decodeURIComponent(cookieCountry);
      if (countryOptions.includes(decoded)) {
        setCountry(decoded);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      if (!inputContainerRef.current) return;
      const rect = inputContainerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(countryStorageKey, country);
    document.cookie = `${countryCookieKey}=${encodeURIComponent(country)}; path=/; max-age=31536000; samesite=lax`;
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
    }
  }, [country]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onCountryChanged = (event) => {
      const next = event?.detail?.country;
      if (next && countryOptions.includes(next)) {
        setCountry(next);
      }
    };
    window.addEventListener('sr:country-changed', onCountryChanged);
    return () => window.removeEventListener('sr:country-changed', onCountryChanged);
  }, []);

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
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!hasInput) {
        setResults({ companies: [], categories: [], locations: [], places: [] });
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }

      setIsOpen(true);
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(country)}`
        );
        const data = await response.json();

        // Backward-compatible fallback if API still returns an array shape.
        if (Array.isArray(data)) {
          setResults({ companies: data, categories: [], locations: [], places: [] });
          setIsOpen(data.length > 0);
        } else {
          const companies = Array.isArray(data.companies) ? data.companies : [];
          const categories = Array.isArray(data.categories) ? data.categories : [];
          const locations = Array.isArray(data.locations) ? data.locations : [];
          setResults((prev) => ({ ...prev, companies, categories, locations }));
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, hasInput, results.places.length, country]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!hasInput) return;

      setPlacesLoading(true);
      try {
        const places = await fetchPlacePredictions(query.trim());
        setResults((prev) => {
          const next = { ...prev, places };
          setIsOpen(true);
          return next;
        });
      } catch (error) {
        setResults((prev) => ({ ...prev, places: [] }));
      } finally {
        setPlacesLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, hasInput]);

  function goToCompaniesSearch(searchValue) {
    setIsOpen(false);
    setSelectedIndex(-1);
    router.push(
      `/companies?search=${encodeURIComponent(searchValue)}&country=${encodeURIComponent(country)}`
    );
  }

  async function handleAction(item) {
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery('');

    if (item.type === 'company') {
      router.push(`/company/${item.payload.slug}`);
      return;
    }

    if (item.type === 'category') {
      router.push(
        `/companies?category=${encodeURIComponent(item.payload.name)}&country=${encodeURIComponent(country)}`
      );
      return;
    }

    if (item.type === 'location') {
      router.push(
        `/companies?location=${encodeURIComponent(item.payload.name)}&country=${encodeURIComponent(country)}`
      );
      return;
    }

    if (item.type === 'place') {
      const geocoded = await geocodePlaceId(item.payload.placeId);
      if (geocoded) {
        router.push(
          `/companies?location=${encodeURIComponent(item.payload.description)}&lat=${geocoded.lat.toFixed(
            6
          )}&lng=${geocoded.lng.toFixed(6)}&radiusKm=25&sort=nearest&country=${encodeURIComponent(
            country
          )}`
        );
      } else {
        router.push(
          `/companies?location=${encodeURIComponent(item.payload.description)}&country=${encodeURIComponent(
            country
          )}`
        );
      }
      return;
    }

    if (item.type === 'showAll') {
      goToCompaniesSearch(item.payload.query);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (selectedIndex >= 0 && actionItems[selectedIndex]) {
      void handleAction(actionItems[selectedIndex]);
      return;
    }

    if (query.trim()) {
      goToCompaniesSearch(query.trim());
    }
  }

  function handleKeyDown(event) {
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, actionItems.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }

  function handleFocus() {
    const isMobileViewport =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    if (isMobileViewport) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(
        new CustomEvent('sr:open-mobile-search', { detail: { initialQuery: query } })
      );
      return;
    }

    if (hasInput) {
      setIsOpen(true);
    }
  }

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative" ref={inputContainerRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Search for a company or category..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            autoFocus={autoFocus}
            className="pl-12 pr-12 h-14 text-lg border-2 focus:border-primary"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
          {!loading && placesLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Country</span>
          <select
            value={country}
            onChange={(event) => handleCountryChange(event.target.value)}
            className="h-8 rounded border bg-background px-2 text-xs"
          >
            {countryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </form>

      {isOpen && (
        <Card
          className="fixed z-[80] mt-0 max-h-[65vh] overflow-y-auto p-2 shadow-xl border-2"
          style={dropdownStyle}
        >
          {hasResults ? (
            <div className="space-y-2">
              {results.companies.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-3 py-1">
                    Companies
                  </p>
                  <div className="space-y-1">
                    {results.companies.map((company) => {
                      const actionIndex = actionItems.findIndex((item) => item.key === `company-${company.id}`);
                      return (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => void handleAction({ type: 'company', payload: company })}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3',
                            'hover:bg-accent/70',
                            selectedIndex === actionIndex && 'bg-accent/80'
                          )}
                        >
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[15px] leading-5 truncate">
                                <Highlight text={company.name} query={query} />
                              </span>
                              {company.verified && (
                                <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{company.website || company.category}</span>
                              {(company.city || company.state || company.country) && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">
                                    {[company.city, company.state, company.country]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </span>
                                </>
                              )}
                              {company.reviewCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{formatReviewCount(company.reviewCount)}</span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                                    {company.averageRating}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.categories.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-3 py-1">
                    Categories
                  </p>
                  <div className="space-y-1">
                    {results.categories.map((category) => {
                      const actionIndex = actionItems.findIndex((item) => item.key === `category-${category.name}`);
                      return (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => void handleAction({ type: 'category', payload: category })}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-3',
                            'hover:bg-accent/70',
                            selectedIndex === actionIndex && 'bg-accent/80'
                          )}
                        >
                          <FolderOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-medium text-[15px] leading-5 truncate">
                              <Highlight text={category.name} query={query} />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              The best companies in this category ({category.businessCount})
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.locations.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-3 py-1">
                    Locations
                  </p>
                  <div className="space-y-1">
                    {results.locations.map((location) => {
                      const actionIndex = actionItems.findIndex((item) => item.key === `location-${location.name}`);
                      return (
                        <button
                          key={location.name}
                          type="button"
                          onClick={() => void handleAction({ type: 'location', payload: location })}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-3',
                            'hover:bg-accent/70',
                            selectedIndex === actionIndex && 'bg-accent/80'
                          )}
                        >
                          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-medium text-[15px] leading-5 truncate">
                              <Highlight text={location.name} query={query} />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {location.businessCount} matching businesses
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.places.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground px-3 py-1">
                    Places
                  </p>
                  <div className="space-y-1">
                    {results.places.map((place) => {
                      const actionIndex = actionItems.findIndex((item) => item.key === `place-${place.placeId}`);
                      return (
                        <button
                          key={place.placeId}
                          type="button"
                          onClick={() => void handleAction({ type: 'place', payload: place })}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-3',
                            'hover:bg-accent/70',
                            selectedIndex === actionIndex && 'bg-accent/80'
                          )}
                        >
                          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-medium text-[15px] leading-5 truncate">
                              <Highlight text={place.mainText} query={query} />
                            </p>
                            {place.secondaryText && (
                              <p className="text-xs text-muted-foreground truncate">{place.secondaryText}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-1 border-t">
                <button
                  type="button"
                  onClick={() => goToCompaniesSearch(query.trim())}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                    'text-primary hover:bg-accent/70',
                    selectedIndex === actionItems.length - 1 && 'bg-accent/80'
                  )}
                >
                  Show all results for "{query.trim()}"
                </button>
              </div>
              {query.trim().length > 1 && results.companies.length === 0 && (
                <div className="pt-1">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() =>
                      router.push(
                        `/companies?add=1&name=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(
                          country
                        )}`
                      )
                    }
                  >
                    Create this company
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">Country</p>
                <select
                  value={country}
                  onChange={(event) => handleCountryChange(event.target.value)}
                  className="h-8 rounded border bg-background px-2 text-xs"
                >
                  {countryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 px-3 py-4">
              <p className="text-sm text-muted-foreground">No matching companies or categories</p>
              {query.trim().length > 1 && results.companies.length === 0 && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/companies?add=1&name=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(
                        country
                      )}`
                    )
                  }
                >
                  Create this company
                </Button>
              )}
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">Country</p>
                <select
                  value={country}
                  onChange={(event) => handleCountryChange(event.target.value)}
                  className="h-8 rounded border bg-background px-2 text-xs"
                >
                  {countryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
