"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating, RatingInput } from '@/components/star-rating';
import { RatingDistribution } from '@/components/rating-distribution';
import {
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  PenSquare,
  ShieldCheck,
  MessageCircle,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function getDraftKey(businessId) {
  return `reviewDraft:${businessId}`;
}

export default function BusinessPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewFilterRating, setReviewFilterRating] = useState('all');
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [claimStatus, setClaimStatus] = useState('UNKNOWN');

  // Review form
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  useEffect(() => {
    if (!params.slug) return;
    const fetchClaimStatus = async () => {
      try {
        const response = await fetch(`/api/businesses/${params.slug}/claim`);
        const data = await response.json();
        if (response.ok && data?.status) {
          setClaimStatus(data.status);
        } else {
          setClaimStatus('UNKNOWN');
        }
      } catch (error) {
        setClaimStatus('UNKNOWN');
      }
    };
    fetchClaimStatus();
  }, [params.slug, session?.user?.id, session?.user?.role]);

  useEffect(() => {
    if (!business?.slug) return;
    fetchReviews({ page: 1, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.slug, reviewFilterRating, reviewSort]);

  useEffect(() => {
    if (!business?.id) return;
    const queryWantsDraft = searchParams.get('review') === 'draft';
    const draftRaw = window.localStorage.getItem(getDraftKey(business.id));
    if (!draftRaw) return;

    try {
      const draft = JSON.parse(draftRaw);
      if (typeof draft.rating === 'number') setRating(draft.rating);
      if (typeof draft.title === 'string') setTitle(draft.title);
      if (typeof draft.content === 'string') setContent(draft.content);
      if (queryWantsDraft) setReviewDialogOpen(true);
    } catch (e) {
      window.localStorage.removeItem(getDraftKey(business.id));
    }
  }, [business?.id, searchParams]);

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/businesses/${params.slug}`);
      if (!response.ok) throw new Error('Business not found');
      const data = await response.json();
      setBusiness(data);
    } catch (err) {
      console.error('Error fetching business:', err);
      setError('Failed to load business');
    } finally {
      setLoading(false);
    }
  };

  async function fetchReviews({ page = 1, replace = false } = {}) {
    if (!business?.slug) return;
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '8',
        rating: reviewFilterRating,
        sort: reviewSort,
      });
      const response = await fetch(`/api/businesses/${business.slug}/reviews?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }
      setReviews((prev) => (replace ? data.items : [...prev, ...data.items]));
      setReviewsPage(data.page);
      setReviewsHasMore(Boolean(data.hasMore));
      setReviewsTotal(data.total || 0);
    } catch (err) {
      if (replace) setReviews([]);
      setReviewsHasMore(false);
      setReviewsTotal(0);
    } finally {
      setReviewsLoading(false);
    }
  }

  const reviewSummary = useMemo(() => {
    if (!business?.reviewCount) {
      return 'No published reviews yet. Be the first customer to share your experience.';
    }
    if (business.averageRating >= 4.5) {
      return 'Customers consistently report a strong and reliable experience with this company.';
    }
    if (business.averageRating >= 3.5) {
      return 'Most customers report a positive experience with a few areas where improvement is possible.';
    }
    if (business.averageRating >= 2.5) {
      return 'Customer experiences are mixed, with both positive and negative feedback trends.';
    }
    return 'Recent reviews indicate recurring issues and lower customer satisfaction.';
  }, [business?.reviewCount, business?.averageRating]);

  const userHasReviewed = reviews.some((item) => item.user.id === session?.user?.id);

  const saveDraft = () => {
    if (!business?.id) return;
    const draft = { rating, title, content };
    window.localStorage.setItem(getDraftKey(business.id), JSON.stringify(draft));
  };

  const clearDraft = () => {
    if (!business?.id) return;
    window.localStorage.removeItem(getDraftKey(business.id));
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (rating === 0 || !title.trim() || !content.trim()) {
      setError('Please complete rating, title and review details');
      return;
    }

    if (!session) {
      saveDraft();
      const callbackUrl = `/company/${params.slug}?review=draft`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          rating,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to submit review');
        return;
      }

      clearDraft();
      setSuccess('Review submitted successfully. It will be visible after moderation.');
      setReviewDialogOpen(false);
      setRating(0);
      setTitle('');
      setContent('');
      setTimeout(() => {
        fetchBusiness();
        fetchReviews({ page: 1, replace: true });
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimBusiness = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/businesses/${params.slug}/claim`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        if (data?.code === 'BUSINESS_REQUIRED') {
          alert('Business account required to claim a company.');
          router.push('/login?mode=signup');
          return;
        }
        alert(data.error || 'Failed to claim business');
        return;
      }
      alert('Claim request submitted. An admin will review it shortly.');
      setClaimStatus(data.status || 'PENDING');
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Business not found</h2>
            <p className="text-muted-foreground mb-4">The business you are looking for does not exist.</p>
            <Button asChild>
              <Link href="/companies">Browse Companies</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapQuery = business.location || business.name;
  const hasCoordinates = Number.isFinite(business.latitude) && Number.isFinite(business.longitude);
  const mapEmbedSrc = googleMapsApiKey
    ? hasCoordinates
      ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(
          googleMapsApiKey
        )}&center=${business.latitude},${business.longitude}&zoom=13`
      : `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
          googleMapsApiKey
        )}&q=${encodeURIComponent(mapQuery)}`
    : null;
  const openMapHref = hasCoordinates
    ? `https://www.google.com/maps?q=${business.latitude},${business.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="container max-w-6xl space-y-6 py-6 md:py-8">
      {success && (
        <Alert className="border-emerald-500 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">{success}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-4">
        <div className="h-36 w-full overflow-hidden rounded-2xl border bg-muted sm:h-44 md:h-56">
          {business.banner ? (
            <img src={business.banner} alt={`${business.name} banner`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-primary/20 via-primary/5 to-background" />
          )}
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {business.logo && (
                  <img src={business.logo} alt={business.name} className="h-24 w-24 rounded-xl object-cover border" />
                )}
                <div className="space-y-3 flex-1">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={business.claimedById ? 'secondary' : 'outline'}>
                        {business.claimedById ? 'Claimed profile' : 'Unclaimed profile'}
                      </Badge>
                      {business.verified && (
                        <Badge variant="outline" className="gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified profile
                        </Badge>
                      )}
                      <Badge variant="secondary">{business.category}</Badge>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{business.name}</h1>
                    <div className="space-y-1">
                      {business.website && (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {business.website}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {business.location && (
                        <p className="text-sm text-muted-foreground">{business.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button disabled={Boolean(session && userHasReviewed)}>
                          <PenSquare className="mr-2 h-4 w-4" />
                          Write a review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl p-4 sm:p-6">
                        <DialogHeader>
                          <DialogTitle>Write a review for {business.name}</DialogTitle>
                          <DialogDescription>
                            Fill in your rating and details first. Login is asked only when you submit.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                          {error && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{error}</AlertDescription>
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
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Summarize your experience"
                              required
                              disabled={submitting}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="review-content">Review *</Label>
                            <Textarea
                              id="review-content"
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              placeholder="Tell others what went well and what did not"
                              rows={5}
                              required
                              disabled={submitting}
                            />
                          </div>
                          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
                            <Button type="button" variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={submitting}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                              {submitting ? 'Submitting...' : session ? 'Submit review' : 'Continue to login'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {business.website && (
                      <Button asChild variant="outline">
                        <a href={business.website} target="_blank" rel="noopener noreferrer">
                          Visit website
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {session && userHasReviewed && (
                    <p className="text-sm text-muted-foreground">You have already reviewed this business.</p>
                  )}

                  {business.description && <p className="text-muted-foreground">{business.description}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trust score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold leading-none sm:text-6xl">{business.averageRating}</span>
                <div className="pb-1">
                  <StarRating rating={business.averageRating} />
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {business.reviewCount} review{business.reviewCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Separator />
              <RatingDistribution
                distribution={business.ratingDistribution}
                total={business.reviewCount}
                selectedRating={reviewFilterRating}
                onSelectRating={(value) => setReviewFilterRating(String(value))}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review summary</CardTitle>
              <CardDescription>Based on published customer reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground">{reviewSummary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Based on these reviews</CardTitle>
              <CardDescription>Recent customer highlights</CardDescription>
            </CardHeader>
            <CardContent>
              {business.reviewHighlights?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {business.reviewHighlights.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">{item.user?.name || 'Anonymous'}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <StarRating rating={item.rating} />
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No review highlights available yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Customer reviews</CardTitle>
                <Badge variant="outline">{reviews.length} of {reviewsTotal} shown</Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    Rating filter
                  </Label>
                  <Select value={reviewFilterRating} onValueChange={setReviewFilterRating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ratings</SelectItem>
                      <SelectItem value="5">5 stars only</SelectItem>
                      <SelectItem value="4">4 stars only</SelectItem>
                      <SelectItem value="3">3 stars only</SelectItem>
                      <SelectItem value="2">2 stars only</SelectItem>
                      <SelectItem value="1">1 star only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    Sort reviews
                  </Label>
                  <Select value={reviewSort} onValueChange={setReviewSort}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="highest">Highest rating</SelectItem>
                      <SelectItem value="lowest">Lowest rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{review.user.name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{review.title}</h4>
                        <p className="text-sm text-muted-foreground">{review.content}</p>
                      </div>
                      {review.reply && (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Business response</p>
                          <p className="text-sm">{review.reply.content}</p>
                        </div>
                      )}
                      <Separator />
                    </div>
                  ))}
                  {reviewsHasMore && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => fetchReviews({ page: reviewsPage + 1, replace: false })}
                        disabled={reviewsLoading}
                      >
                        {reviewsLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load more reviews'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  {reviewsLoading ? 'Loading reviews...' : 'No reviews match the selected filters.'}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              {business.location && <CardDescription>{business.location}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-3">
              {mapEmbedSrc ? (
                <iframe
                  title={`${business.name} location map`}
                  src={mapEmbedSrc}
                  loading="lazy"
                  className="w-full h-56 rounded-md border"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="text-sm text-muted-foreground rounded-md border p-4">
                  Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env` to show an embedded map.
                </div>
              )}
              <Button asChild variant="outline" className="w-full">
                <a href={openMapHref} target="_blank" rel="noopener noreferrer">
                  Open in Google Maps
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                {business.reviewCount > 0
                  ? `This company has ${business.reviewCount} published review${business.reviewCount !== 1 ? 's' : ''}.`
                  : 'This company has no published reviews yet.'}
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                {business.verified
                  ? 'Profile is verified on Surireviews.'
                  : 'Profile is not yet marked as verified.'}
              </p>
            </CardContent>
          </Card>

          {!business.claimedById && session?.user?.role === 'BUSINESS' && (
            <Card>
              <CardHeader>
                <CardTitle>Own this business?</CardTitle>
                <CardDescription>
                  Submit a claim request. An admin will verify ownership before approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {claimStatus === 'PENDING' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Claim request submitted
                  </Button>
                ) : claimStatus === 'REJECTED' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Your previous claim was rejected. You can submit a new request.
                    </p>
                    <Button onClick={handleClaimBusiness} className="w-full">
                      Submit new claim request
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleClaimBusiness} className="w-full">
                    Request claim approval
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {session?.user?.role === 'USER' && !business.claimedById && (
            <Card>
              <CardHeader>
                <CardTitle>Own this business?</CardTitle>
                <CardDescription>
                  Register as a business user to request claim approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/login?mode=signup">Register as business</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
