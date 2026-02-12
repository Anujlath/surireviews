"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, CheckCircle, MapPin, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RatingInput } from '@/components/star-rating';
import { DEFAULT_COUNTRY, sanitizeCountryList } from '@/lib/country';
import { detectClientCountry, fetchCountryOptions, getStoredCountry } from '@/lib/country-client';

const countryStorageKey = 'sr:search-country';
const countryCookieKey = 'sr_country';

function formatReviewCount(count) {
  if (!count) return '0 reviews';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M reviews`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K reviews`;
  return `${count} reviews`;
}

function WriteReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [countryOptions, setCountryOptions] = useState([DEFAULT_COUNTRY, 'UK', 'USA']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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

  useEffect(() => {
    const requestedSlug = searchParams.get('company');
    const wantsDraft = searchParams.get('review') === 'draft';
    if (!requestedSlug) return;
    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/businesses/${requestedSlug}`);
        if (!response.ok) return;
        const data = await response.json();
        setSelectedCompany(data);
        if (wantsDraft) {
          const draftRaw = window.localStorage.getItem(`reviewDraftSlug:${requestedSlug}`);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (typeof draft.rating === 'number') setRating(draft.rating);
            if (typeof draft.title === 'string') setTitle(draft.title);
            if (typeof draft.content === 'string') setContent(draft.content);
          }
        }
        setReviewOpen(true);
      } catch (error) {
        setSelectedCompany(null);
      }
    };
    fetchCompany();
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`
        );
        const data = await response.json();
        const companies = Array.isArray(data.companies) ? data.companies : [];
        setResults(companies);
        setOpen(true);
      } catch (error) {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, country]);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const response = await fetch(
          `/api/businesses?sort=most-reviewed&country=${encodeURIComponent(country)}&page=1&pageSize=4`
        );
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
        setTopCompanies(items.slice(0, 4));
      } catch (error) {
        setTopCompanies([]);
      }
    };
    fetchTop();
  }, [country]);

  const hasResults = results.length > 0;

  const openReview = (company) => {
    setOpen(false);
    setSelectedCompany(company);
    setReviewOpen(true);
    setFormError('');
    setFormSuccess('');
    const draftRaw = window.localStorage.getItem(`reviewDraftSlug:${company.slug}`);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        setRating(typeof draft.rating === 'number' ? draft.rating : 0);
        setTitle(typeof draft.title === 'string' ? draft.title : '');
        setContent(typeof draft.content === 'string' ? draft.content : '');
      } catch (error) {
        setRating(0);
        setTitle('');
        setContent('');
      }
    } else {
      setRating(0);
      setTitle('');
      setContent('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (hasResults) {
      openReview(results[0]);
      return;
    }
    router.push(`/companies?search=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`);
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!selectedCompany) return;

    if (rating === 0 || !title.trim() || !content.trim()) {
      setFormError('Please complete rating, title and review details');
      return;
    }

    if (!session) {
      const draft = { rating, title, content };
      window.localStorage.setItem(`reviewDraftSlug:${selectedCompany.slug}`, JSON.stringify(draft));
      const callbackUrl = `/write-review?review=draft&company=${encodeURIComponent(selectedCompany.slug)}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedCompany.id,
          rating,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.error || 'Failed to submit review');
        return;
      }
      window.localStorage.removeItem(`reviewDraftSlug:${selectedCompany.slug}`);
      setFormSuccess('Review submitted successfully. It will be visible after moderation.');
      setRating(0);
      setTitle('');
      setContent('');
      setReviewOpen(false);
    } catch (error) {
      setFormError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const suggestions = useMemo(() => results.slice(0, 6), [results]);

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <section className="bg-[radial-gradient(circle_at_top,#ede9fe_0%,#ddd6fe_42%,#c4b5fd_100%)]">
        <div className="container max-w-6xl px-4 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div className="space-y-5 text-center md:text-left">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                Share trusted feedback
              </p>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
                Share your experience
              </h1>
              <p className="text-base text-slate-700 sm:text-lg">
                Help others make the right choice. Your review builds trust and transparency.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-700 md:justify-start">
                <span className="rounded-full bg-white/70 px-3 py-1">Write a review in minutes</span>
                <span className="rounded-full bg-white/70 px-3 py-1">Verified profiles</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-white/40 blur-2xl" />
              <form onSubmit={handleSubmit} className="relative z-10 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl">
                <p className="text-sm font-semibold text-slate-800">Find a company to review</p>
                <div className="relative mt-4">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder="Search by company name"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-12 text-sm shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:h-13 sm:text-base"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Country</span>
                  {loading ? (
                    <span className="text-xs text-slate-500">Searching...</span>
                  ) : (
                    <select
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                    >
                      {countryOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {open && query.trim().length >= 2 && (
                  <div className="relative">
                    <div className="absolute left-0 right-0 mt-3 rounded-2xl bg-white p-3 text-left shadow-xl border-2">
                      {suggestions.length > 0 ? (
                        <div className="space-y-2">
                          <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Companies
                          </p>
                          <div className="space-y-1">
                            {suggestions.map((company) => (
                              <button
                                key={company.id}
                                type="button"
                                onClick={() => openReview(company)}
                                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 hover:bg-accent/70"
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
                                      {company.name}
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
                                        <span className="truncate inline-flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                                        </span>
                                      </>
                                    )}
                                    {company.reviewCount > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{formatReviewCount(company.reviewCount)}</span>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1">
                                          <Star className="h-3 w-3 fill-violet-500 text-violet-500" />
                                          {company.averageRating || 0}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 p-2">
                          <p className="text-sm text-slate-600">No matching companies yet.</p>
                          <Button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/companies?add=1&name=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(
                                  country
                                )}`
                              )
                            }
                            className="w-full"
                          >
                            Add this company
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-5xl px-4 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Ready to write your review?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topCompanies.length === 0 ? (
            <Card className="p-6 text-sm text-slate-600">
              No companies yet. Search above to get started.
            </Card>
          ) : (
            topCompanies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => openReview(company)}
                className="text-left"
              >
                <Card className="h-full p-4 transition hover:shadow-lg">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-slate-100" />
                  )}
                  <p className="mt-3 font-semibold">{company.name}</p>
                  <p className="text-xs text-slate-500">{company.website || company.category}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                    <Star className="h-3 w-3 fill-violet-500 text-violet-500" />
                    {company.averageRating || 0} · {formatReviewCount(company.reviewCount)}
                  </p>
                </Card>
              </button>
            ))
          )}
        </div>

        <div className="mt-10 rounded-2xl border bg-white p-6">
          <p className="text-sm text-slate-700">
            Can&apos;t find a company?{' '}
            <Link
              href={`/companies?add=1&country=${encodeURIComponent(country)}`}
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Add it here
            </Link>
            .
          </p>
        </div>
      </section>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? `Write a review for ${selectedCompany.name}` : 'Write a review'}
            </DialogTitle>
            <DialogDescription>
              Rate your experience and share the details. Login is asked only when you submit.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            {formSuccess && (
              <Alert className="border-emerald-500 bg-emerald-50">
                <AlertDescription className="text-emerald-800">{formSuccess}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Rating *</Label>
              <RatingInput value={rating} onChange={setRating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-title">Title *</Label>
              <Input
                id="review-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Summarize your experience"
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-content">Review *</Label>
              <Textarea
                id="review-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Tell others what went well and what did not"
                rows={5}
                disabled={submitting}
                required
              />
            </div>
            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
              <Button type="button" variant="outline" onClick={() => setReviewOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !selectedCompany}>
                {submitting ? 'Submitting...' : session ? 'Submit review' : 'Continue to login'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={<div className="container max-w-5xl px-4 py-12" />}>
      <WriteReviewPageContent />
    </Suspense>
  );
}
