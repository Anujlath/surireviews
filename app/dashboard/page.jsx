"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StarRating } from '@/components/star-rating';
import { RatingDistribution } from '@/components/rating-distribution';
import { Loader2, Star, MessageSquare, AlertCircle, ExternalLink, Download, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BusinessDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'BUSINESS') {
      router.push('/');
    } else {
      fetchDashboard();
    }
  }, [session, status, router]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/business');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      } else {
        setError('You need to claim a business first');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit reply');
        return;
      }

      setReplyDialogOpen(false);
      setReplyContent('');
      setSelectedReview(null);
      fetchDashboard();
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/dashboard/business/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export reviews');
      }
    } catch (error) {
      alert('An error occurred while exporting');
    } finally {
      setExporting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Business Claimed</h2>
            <p className="text-muted-foreground mb-4">
              You need to claim a business profile to access this dashboard.
            </p>
            <Button asChild>
              <Link href="/companies">Browse Companies to Claim</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session?.user?.role !== 'BUSINESS' || !dashboard) {
    return null;
  }

  const { business, stats } = dashboard;

  return (
    <div className="container py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold">{business.name}</h1>
                {business.verified && (
                  <Badge variant="default" className="bg-blue-500">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">Manage your business profile and reviews</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={exporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Reviews'}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/company/${business.slug}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Profile
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{stats.averageRating}</div>
              <StarRating rating={stats.averageRating} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <RatingDistribution
                distribution={stats.ratingDistribution}
                total={stats.totalReviews}
              />
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>Respond to customer feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {business.reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reviews yet
              </div>
            ) : (
              <div className="space-y-6">
                {business.reviews.map((review) => (
                  <div key={review.id}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{review.user.name || 'Anonymous'}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{review.title}</h4>
                        <p className="text-muted-foreground">{review.content}</p>
                      </div>

                      {/* Reply Section */}
                      {review.reply ? (
                        <div className="ml-6 pl-4 border-l-2 border-muted">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Your Response</Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(review.reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm">{review.reply.content}</p>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReview(review);
                            setReplyDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Reply
                        </Button>
                      )}
                    </div>
                    <Separator className="mt-6" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Respond professionally to customer feedback
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <form onSubmit={handleReply} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedReview.user.name || 'Anonymous'}</span>
                  <StarRating rating={selectedReview.rating} size="sm" />
                </div>
                <p className="text-sm font-semibold">{selectedReview.title}</p>
                <p className="text-sm text-muted-foreground">{selectedReview.content}</p>
              </div>

              <div className="space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your response..."
                  rows={4}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReplyDialogOpen(false);
                    setReplyContent('');
                    setSelectedReview(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Reply'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
