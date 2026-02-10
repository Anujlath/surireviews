"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StarRating } from '@/components/star-rating';
import { TRUSTPILOT_CATEGORY_NAMES } from '@/lib/categories';
import { fetchPlacePredictions, geocodePlaceId, reverseGeocode } from '@/lib/google-maps-client';
import { CheckCircle, Loader2, LocateFixed, MapPin, PlusCircle, Search } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const categories = ['All Categories', ...TRUSTPILOT_CATEGORY_NAMES];

const sortOptions = [
  { value: 'most-relevant', label: 'Most relevant' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'most-reviewed', label: 'Most reviewed' },
  { value: 'recently-reviewed', label: 'Recently reviewed' },
  { value: 'newest', label: 'Newest' },
];
const countryOptions = ['UK', 'USA', 'Nigeria'];
const countryStorageKey = 'sr:search-country';
const countryCookieKey = 'sr_country';

function formatReviewCount(count) {
  if (!count) return '0 reviews';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M reviews`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K reviews`;
  return `${count} review${count !== 1 ? 's' : ''}`;
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return '';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

function CompaniesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('most-relevant');
  const [minRating, setMinRating] = useState('0');
  const [verifiedOnly, setVerifiedOnly] = useState('false');
  const [countryFilter, setCountryFilter] = useState('UK');
  const [radiusKm, setRadiusKm] = useState('25');
  const [geoLat, setGeoLat] = useState(null);
  const [geoLng, setGeoLng] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingCompany, setAddingCompany] = useState(false);
  const [addCompanyError, setAddCompanyError] = useState('');
  const [addCompanySuccess, setAddCompanySuccess] = useState('');
  const [addedCompanySlug, setAddedCompanySlug] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCategory, setNewCompanyCategory] = useState(TRUSTPILOT_CATEGORY_NAMES[0] || '');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyCity, setNewCompanyCity] = useState('');
  const [newCompanyState, setNewCompanyState] = useState('');
  const [newCompanyCountry, setNewCompanyCountry] = useState('');
  const [newCompanyDescription, setNewCompanyDescription] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [urlSynced, setUrlSynced] = useState(false);
  const [paramsReady, setParamsReady] = useState(false);
  const locationWrapperRef = useRef(null);
  const initialized = useRef(false);
  const skipPageReset = useRef(false);
  const allowUrlSync = useRef(false);
  const fetchRequestId = useRef(0);

  const getUrlState = () => {
    const sourceParams =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search || '')
        : searchParams;
    const urlSearch = sourceParams.get('search') || '';
    const urlLocation = sourceParams.get('location') || '';
    const urlCountry = sourceParams.get('country') || 'UK';
    const urlCategory = sourceParams.get('category') || 'all';
    const urlSort = sourceParams.get('sort') || 'most-relevant';
    const urlMinRating = sourceParams.get('minRating') || '0';
    const urlVerified = sourceParams.get('verified') || 'false';
    const urlRadiusKm = sourceParams.get('radiusKm') || '25';
    const urlLat = parseFloat(sourceParams.get('lat') || '');
    const urlLng = parseFloat(sourceParams.get('lng') || '');
    const urlPage = parseInt(sourceParams.get('page') || '1', 10);
    return {
      urlSearch,
      urlLocation,
      urlCountry,
      urlCategory: urlCategory || 'all',
      urlSort,
      urlMinRating,
      urlVerified,
      urlRadiusKm,
      urlLat,
      urlLng,
      urlPage,
    };
  };

  const effectiveCategory = useMemo(() => {
    const { urlCategory } = getUrlState();
    if (category && category !== 'all') return category;
    if (urlCategory && urlCategory !== 'all') return urlCategory;
    return 'all';
  }, [category, searchParams]);

  useEffect(() => {
    const {
      urlSearch,
      urlLocation,
      urlCountry,
      urlCategory,
      urlSort,
      urlMinRating,
      urlVerified,
      urlRadiusKm,
      urlLat,
      urlLng,
      urlPage,
    } = getUrlState();

    if (initialized.current) return;

    initialized.current = true;
    setUrlSynced(false);
    setSearchInput(urlSearch);
    setSearchTerm(urlSearch);
    setLocationInput(urlLocation);
    setLocationTerm(urlLocation);
    setCategory(urlCategory || 'all');
    setSortBy(urlSort);
    setMinRating(urlMinRating);
    setVerifiedOnly(urlVerified);
    setCountryFilter(urlCountry);
    setRadiusKm(urlRadiusKm);
    setGeoLat(Number.isFinite(urlLat) ? urlLat : null);
    setGeoLng(Number.isFinite(urlLng) ? urlLng : null);
    setPage(Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1);
    skipPageReset.current = true;
    setParamsReady(true);
    if (urlCategory !== 'all' || urlSearch || urlLocation) {
      allowUrlSync.current = true;
    }
  }, []);

  useEffect(() => {
    if (!initialized.current || !paramsReady) return;
    const {
      urlSearch,
      urlLocation,
      urlCountry,
      urlCategory,
      urlSort,
      urlMinRating,
      urlVerified,
      urlRadiusKm,
      urlLat,
      urlLng,
      urlPage,
    } = getUrlState();

    const matches =
      searchTerm === urlSearch &&
      locationTerm === urlLocation &&
      effectiveCategory === urlCategory &&
      sortBy === urlSort &&
      minRating === urlMinRating &&
      verifiedOnly === urlVerified &&
      countryFilter === urlCountry &&
      radiusKm === urlRadiusKm &&
      (Number.isFinite(urlLat) ? geoLat === urlLat : geoLat === null) &&
      (Number.isFinite(urlLng) ? geoLng === urlLng : geoLng === null) &&
      page === (Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1);

    if (matches) {
      setUrlSynced(true);
    }
  }, [
    searchParams,
    searchTerm,
    locationTerm,
    effectiveCategory,
    sortBy,
    minRating,
    verifiedOnly,
    countryFilter,
    radiusKm,
    geoLat,
    geoLng,
    page,
    paramsReady,
  ]);

  useEffect(() => {
    if (!category) {
      setCategory('all');
    }
  }, [category]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlCountry = searchParams.get('country');
    if (urlCountry) return;
    const stored = window.localStorage.getItem(countryStorageKey);
    if (stored && countryOptions.includes(stored) && stored !== countryFilter) {
      setCountryFilter(stored);
    }
  }, [searchParams, countryFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(countryStorageKey, countryFilter);
    document.cookie = `${countryCookieKey}=${encodeURIComponent(countryFilter)}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new CustomEvent('sr:country-changed', { detail: { country: countryFilter } }));
  }, [countryFilter]);

  useEffect(() => {
    if (!initialized.current || !paramsReady) return;

    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }

    if (page !== 1) {
      setPage(1);
    }
  }, [searchTerm, locationTerm, effectiveCategory, sortBy, minRating, verifiedOnly, countryFilter, radiusKm, geoLat, geoLng]);

  useEffect(() => {
    if (!initialized.current || !paramsReady) return;

    if (!allowUrlSync.current) return;

    if (typeof window !== 'undefined') {
      const hasLocationQuery = window.location.search && window.location.search.length > 0;
      if (hasLocationQuery && !urlSynced) {
        return;
      }
    }

    const {
      urlSearch,
      urlLocation,
      urlCountry,
      urlCategory,
      urlSort,
      urlMinRating,
      urlVerified,
      urlRadiusKm,
      urlLat,
      urlLng,
      urlPage,
    } = getUrlState();

    const matches =
      searchTerm === urlSearch &&
      locationTerm === urlLocation &&
      effectiveCategory === urlCategory &&
      sortBy === urlSort &&
      minRating === urlMinRating &&
      verifiedOnly === urlVerified &&
      countryFilter === urlCountry &&
      radiusKm === urlRadiusKm &&
      (Number.isFinite(urlLat) ? geoLat === urlLat : geoLat === null) &&
      (Number.isFinite(urlLng) ? geoLng === urlLng : geoLng === null) &&
      page === (Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1);

    if (!matches) return;

    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (locationTerm) params.set('location', locationTerm);
    if (effectiveCategory && effectiveCategory !== 'all') params.set('category', effectiveCategory);
    if (sortBy !== 'most-relevant') params.set('sort', sortBy);
    if (minRating !== '0') params.set('minRating', minRating);
    if (verifiedOnly === 'true') params.set('verified', 'true');
    if (countryFilter && countryFilter !== 'UK') params.set('country', countryFilter);
    if (radiusKm !== '25') params.set('radiusKm', radiusKm);
    if (page > 1) params.set('page', String(page));
    if (Number.isFinite(geoLat) && Number.isFinite(geoLng)) {
      params.set('lat', geoLat.toFixed(6));
      params.set('lng', geoLng.toFixed(6));
    }

    const query = params.toString();
    router.replace(query ? `/companies?${query}` : '/companies');
  }, [searchParams, searchTerm, locationTerm, effectiveCategory, sortBy, minRating, verifiedOnly, countryFilter, radiusKm, geoLat, geoLng, page, router, paramsReady, urlSynced]);

  useEffect(() => {
    if (!initialized.current) return;

    const requestId = fetchRequestId.current + 1;
    fetchRequestId.current = requestId;
    const controller = new AbortController();

    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (locationTerm) params.append('location', locationTerm);
        if (effectiveCategory && effectiveCategory !== 'all') params.append('category', effectiveCategory);
        if (sortBy) params.append('sort', sortBy);
        if (minRating !== '0') params.append('minRating', minRating);
        if (verifiedOnly === 'true') params.append('verified', 'true');
        if (countryFilter) params.append('country', countryFilter);
        if (radiusKm) params.append('radiusKm', radiusKm);
        params.append('page', String(page));
        params.append('pageSize', String(pageSize));
        if (Number.isFinite(geoLat) && Number.isFinite(geoLng)) {
          params.append('lat', String(geoLat));
          params.append('lng', String(geoLng));
        }

        const response = await fetch(`/api/businesses?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (requestId !== fetchRequestId.current) return;
        if (Array.isArray(data)) {
          setBusinesses(data);
          setTotalCount(data.length);
        } else {
          setBusinesses(Array.isArray(data.items) ? data.items : []);
          setTotalCount(typeof data.total === 'number' ? data.total : 0);
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
        console.error('Error fetching businesses:', error);
        if (requestId === fetchRequestId.current) {
          setBusinesses([]);
          setTotalCount(0);
        }
      } finally {
        if (requestId === fetchRequestId.current) {
          setLoading(false);
        }
      }
    };

    fetchBusinesses();
    return () => controller.abort();
  }, [searchTerm, locationTerm, effectiveCategory, sortBy, minRating, verifiedOnly, countryFilter, radiusKm, geoLat, geoLng, page, pageSize, paramsReady]);

  useEffect(() => {
    const shouldOpenAdd = searchParams.get('add') === '1';
    if (!shouldOpenAdd) return;

    const prefillName = searchParams.get('name') || '';
    const prefillCountry = searchParams.get('country') || 'UK';
    setNewCompanyName(prefillName);
    setNewCompanyCountry(prefillCountry);
    setAddDialogOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!newCompanyCountry) {
      setNewCompanyCountry(countryFilter || 'UK');
    }
  }, [countryFilter, newCompanyCountry]);

  useEffect(() => {
    const query = locationInput.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      setLocationSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const predictions = await fetchPlacePredictions(query);
        setLocationSuggestions(predictions);
        setLocationSuggestionsOpen(predictions.length > 0);
      } catch (error) {
        setLocationSuggestions([]);
        setLocationSuggestionsOpen(false);
      } finally {
        setLocationLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [locationInput]);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target)) {
        setLocationSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  const searchSummary = useMemo(() => {
    if (searchTerm) return `for "${searchTerm}"`;
    if (locationTerm && Number.isFinite(geoLat) && Number.isFinite(geoLng)) return `within ${radiusKm} km of ${locationTerm}`;
    if (locationTerm) return `near ${locationTerm}`;
    if (effectiveCategory !== 'all') return `in ${effectiveCategory}`;
    return '';
  }, [searchTerm, locationTerm, effectiveCategory, geoLat, geoLng, radiusKm]);

  const categoryOptionsList = useMemo(() => {
    if (effectiveCategory !== 'all' && !categories.includes(effectiveCategory)) {
      return [...categories, effectiveCategory];
    }
    return categories;
  }, [effectiveCategory]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const trimmedLocation = locationInput.trim();

    if (trimmedLocation && locationSuggestions.length > 0) {
      const topSuggestion = locationSuggestions[0];
      const geocoded = await geocodePlaceId(topSuggestion.placeId);
      if (geocoded) {
        setLocationInput(topSuggestion.description);
        setLocationTerm(topSuggestion.description);
        setGeoLat(geocoded.lat);
        setGeoLng(geocoded.lng);
      } else {
        setLocationTerm(trimmedLocation);
        setGeoLat(null);
        setGeoLng(null);
      }
    } else {
      setLocationTerm(trimmedLocation);
      if (!trimmedLocation) {
        setGeoLat(null);
        setGeoLng(null);
      }
    }

    allowUrlSync.current = true;
    setSearchTerm(searchInput.trim());
    setPage(1);
    setLocationSuggestionsOpen(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const label = (await reverseGeocode(lat, lng)) || 'Current location';

        setGeoLat(lat);
        setGeoLng(lng);
        setLocationInput(label);
        setLocationTerm(label);
        allowUrlSync.current = true;
        setSortBy('nearest');
        setIsLocating(false);
        setPage(1);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectLocationSuggestion = async (suggestion) => {
    const geocoded = await geocodePlaceId(suggestion.placeId);
    setLocationInput(suggestion.description);
    setLocationTerm(suggestion.description);
    if (geocoded) {
      setGeoLat(geocoded.lat);
      setGeoLng(geocoded.lng);
      allowUrlSync.current = true;
      setSortBy('nearest');
    } else {
      setGeoLat(null);
      setGeoLng(null);
    }
    allowUrlSync.current = true;
    setLocationSuggestionsOpen(false);
    setPage(1);
  };

  const resetAddCompanyForm = () => {
    setNewCompanyName('');
    setNewCompanyCategory(TRUSTPILOT_CATEGORY_NAMES[0] || '');
    setNewCompanyWebsite('');
    setNewCompanyCity('');
    setNewCompanyState('');
    setNewCompanyCountry(countryFilter || 'UK');
    setNewCompanyDescription('');
    setAddCompanyError('');
  };

  const handleAddCompany = async (event) => {
    event.preventDefault();
    setAddCompanyError('');
    setAddCompanySuccess('');
    setAddedCompanySlug('');

    if (!newCompanyName.trim() || !newCompanyCategory.trim()) {
      setAddCompanyError('Company name and category are required.');
      return;
    }

    setAddingCompany(true);
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          category: newCompanyCategory,
          website: newCompanyWebsite.trim() || null,
          city: newCompanyCity.trim() || null,
          state: newCompanyState.trim() || null,
          country: (newCompanyCountry || countryFilter || 'UK').trim(),
          description: newCompanyDescription.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add company');
      }

      setAddCompanySuccess('Company added successfully as an unclaimed profile.');
      setAddedCompanySlug(data.slug || '');
      setSearchInput(data.name || newCompanyName.trim());
      setSearchTerm(data.name || newCompanyName.trim());
      setAddDialogOpen(false);
      resetAddCompanyForm();
    } catch (error) {
      setAddCompanyError(error.message || 'Failed to add company');
    } finally {
      setAddingCompany(false);
    }
  };

  return (
    <div className="container max-w-6xl py-6 md:py-8">
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Browse Companies</h1>
          <p className="text-muted-foreground">
            Explore businesses and read authentic reviews from real customers
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="pt-4 sm:pt-6">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search company name, category or keyword"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div ref={locationWrapperRef} className="w-full lg:w-80 relative">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Location (city, area)"
                      value={locationInput}
                      onChange={(event) => {
                        setLocationInput(event.target.value);
                        if (!event.target.value.trim()) {
                          allowUrlSync.current = true;
                          setGeoLat(null);
                          setGeoLng(null);
                          setLocationTerm('');
                        }
                      }}
                      onFocus={() => setLocationSuggestionsOpen(locationSuggestions.length > 0)}
                      className="h-11 pl-10 pr-10"
                    />
                    {locationLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {locationSuggestionsOpen && locationSuggestions.length > 0 && (
                    <Card className="absolute z-50 w-full mt-1 p-1 shadow-lg">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          onClick={() => handleSelectLocationSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <p className="text-sm font-medium">{suggestion.mainText}</p>
                          {suggestion.secondaryText && (
                            <p className="text-xs text-muted-foreground">{suggestion.secondaryText}</p>
                          )}
                        </button>
                      ))}
                    </Card>
                  )}
                </div>
                <Select
                  value={effectiveCategory}
                  onValueChange={(value) => {
                    if (!value) return;
                    allowUrlSync.current = true;
                    setCategory(value || 'all');
                  }}
                >
                  <SelectTrigger className="h-11 w-full lg:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptionsList.map((cat) => (
                      <SelectItem key={cat} value={cat === 'All Categories' ? 'all' : cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" className="h-11 w-full px-6 sm:w-auto">Search</Button>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort by</label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      allowUrlSync.current = true;
                      setSortBy(value);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Star rating</label>
                  <Select
                    value={minRating}
                    onValueChange={(value) => {
                      allowUrlSync.current = true;
                      setMinRating(value);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All ratings</SelectItem>
                      <SelectItem value="4">4 stars & up</SelectItem>
                      <SelectItem value="3">3 stars & up</SelectItem>
                      <SelectItem value="2">2 stars & up</SelectItem>
                      <SelectItem value="1">1 star & up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Company status</label>
                  <Select
                    value={verifiedOnly}
                    onValueChange={(value) => {
                      allowUrlSync.current = true;
                      setVerifiedOnly(value);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">All companies</SelectItem>
                      <SelectItem value="true">Verified only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Country</label>
                  <Select
                    value={countryFilter}
                    onValueChange={(value) => {
                      allowUrlSync.current = true;
                      setCountryFilter(value);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Search radius</label>
                  <Select
                    value={radiusKm}
                    onValueChange={(value) => {
                      allowUrlSync.current = true;
                      setRadiusKm(value);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                      <SelectItem value="100">100 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Quick location</label>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4 mr-2" />
                    )}
                    Near me
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="font-medium">Can&apos;t find a company?</p>
              <p className="text-sm text-muted-foreground">
                Add it now. New listings start as unclaimed profiles until a business owner claims them.
              </p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add company
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add a company</DialogTitle>
                  <DialogDescription>
                    The profile will be created as unclaimed. A business user can claim it later.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCompany} className="space-y-4">
                  {addCompanyError && (
                    <p className="text-sm text-red-600">{addCompanyError}</p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Company name</label>
                      <Input
                        value={newCompanyName}
                        onChange={(event) => setNewCompanyName(event.target.value)}
                        placeholder="e.g. Fresh Foods Market"
                        required
                        disabled={addingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Input
                        value={newCompanyCategory}
                        onChange={(event) => setNewCompanyCategory(event.target.value)}
                        placeholder="Search or type a category"
                        list="sr-category-options"
                        required
                        disabled={addingCompany}
                      />
                      <datalist id="sr-category-options">
                        {TRUSTPILOT_CATEGORY_NAMES.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Website (optional)</label>
                      <Input
                        value={newCompanyWebsite}
                        onChange={(event) => setNewCompanyWebsite(event.target.value)}
                        placeholder="https://example.com"
                        disabled={addingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">City (optional)</label>
                      <Input
                        value={newCompanyCity}
                        onChange={(event) => setNewCompanyCity(event.target.value)}
                        placeholder="Lagos"
                        disabled={addingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">State (optional)</label>
                      <Input
                        value={newCompanyState}
                        onChange={(event) => setNewCompanyState(event.target.value)}
                        placeholder="Lagos State"
                        disabled={addingCompany}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Country</label>
                      <Select value={newCompanyCountry} onValueChange={setNewCompanyCountry} disabled={addingCompany}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium">Description (optional)</label>
                      <Textarea
                        value={newCompanyDescription}
                        onChange={(event) => setNewCompanyDescription(event.target.value)}
                        placeholder="Briefly describe this company"
                        rows={4}
                        disabled={addingCompany}
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} disabled={addingCompany}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addingCompany}>
                      {addingCompany ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Create unclaimed profile'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Loading...'
              : `${totalCount} ${totalCount === 1 ? 'company' : 'companies'} found ${searchSummary}`.trim()}
          </p>
          {!loading && totalCount === 0 && (
            <p className="text-sm font-medium text-foreground">No results found.</p>
          )}
        </div>
        {addCompanySuccess && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="flex flex-col gap-2 p-4 text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">{addCompanySuccess}</p>
              {addedCompanySlug && (
                <Button asChild size="sm" variant="outline" className="border-emerald-300 bg-white">
                  <Link href={`/company/${addedCompanySlug}`}>View profile</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : businesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No companies found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {businesses.map((business) => (
                <Link key={business.id} href={`/company/${business.slug}`}>
                  <Card className="h-full hover:shadow-lg border transition-shadow cursor-pointer">
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {business.logo && (
                          <img
                            src={business.logo}
                            alt={business.name}
                            className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <CardTitle className="truncate flex-1">{business.name}</CardTitle>
                            {business.verified && (
                              <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" title="Verified Business" />
                            )}
                          </div>
                          <div className="mt-1">
                            <Badge variant={business.claimedById ? 'secondary' : 'outline'}>
                              {business.claimedById ? 'Claimed' : 'Unclaimed'}
                            </Badge>
                          </div>
                          <CardDescription className="truncate">
                            {business.website || business.category}
                          </CardDescription>
                          {(business.city || business.state || business.country) && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {[business.city, business.state, business.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {Number.isFinite(business.distanceKm) && (
                            <p className="text-xs text-muted-foreground mt-1">{formatDistance(business.distanceKm)}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                      <div className="space-y-3">
                        {business.reviewCount > 0 ? (
                          <div className="space-y-2">
                            <StarRating rating={business.averageRating} showNumber />
                            <p className="text-sm text-muted-foreground">{formatReviewCount(business.reviewCount)}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No reviews yet</p>
                        )}
                        {business.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {totalCount > pageSize && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                      if (page > 1) {
                        allowUrlSync.current = true;
                        setPage(page - 1);
                      }
                    }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {(() => {
                    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                    const start = Math.max(1, page - 2);
                    const end = Math.min(totalPages, page + 2);
                    const items = [];

                    if (start > 1) {
                      items.push(
                        <PaginationItem key="page-1">
                          <PaginationLink
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              allowUrlSync.current = true;
                              setPage(1);
                            }}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (start > 2) {
                      items.push(
                        <PaginationItem key="ellipsis-start">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    for (let i = start; i <= end; i += 1) {
                      items.push(
                        <PaginationItem key={`page-${i}`}>
                          <PaginationLink
                            href="#"
                            isActive={i === page}
                            onClick={(event) => {
                              event.preventDefault();
                              allowUrlSync.current = true;
                              setPage(i);
                            }}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (end < totalPages - 1) {
                      items.push(
                        <PaginationItem key="ellipsis-end">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    if (end < totalPages) {
                      items.push(
                        <PaginationItem key={`page-${totalPages}`}>
                          <PaginationLink
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              allowUrlSync.current = true;
                              setPage(totalPages);
                            }}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    return items;
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                      if (page < totalPages) {
                        allowUrlSync.current = true;
                        setPage(page + 1);
                      }
                    }}
                      className={page >= Math.ceil(totalCount / pageSize) ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="container py-8 max-w-6xl" />}>
      <CompaniesPageContent />
    </Suspense>
  );
}
