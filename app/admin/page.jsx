"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarRating } from '@/components/star-rating';
import { Loader2, Users, Building2, Star, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { isAdminRole } from '@/lib/roles';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [claims, setClaims] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (!isAdminRole(session?.user?.role)) {
      router.push('/');
    } else {
      fetchData();
    }
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, reviewsRes, verificationRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/reviews?status=PENDING'),
        fetch('/api/admin/verification-requests'),
      ]);
      
      const statsData = await statsRes.json();
      const reviewsData = await reviewsRes.json();
      
      setStats(statsData.stats);
      setReviews(reviewsData);
      const verificationData = await verificationRes.json();
      setVerificationRequests(Array.isArray(verificationData) ? verificationData : []);
      const claimsRes = await fetch('/api/admin/claims');
      const claimsData = await claimsRes.json();
      setClaims(Array.isArray(claimsData) ? claimsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (reviewId, status) => {
    setModerating(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        setStats(prev => ({
          ...prev,
          pendingReviews: prev.pendingReviews - 1,
          totalReviews: status === 'APPROVED' ? prev.totalReviews + 1 : prev.totalReviews,
        }));
      }
    } catch (error) {
      console.error('Error moderating review:', error);
    } finally {
      setModerating(null);
    }
  };

  const handleClaimDecision = async (claimId, status) => {
    setClaiming(claimId);
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setClaims((prev) => prev.filter((item) => item.id !== claimId));
      }
    } catch (error) {
      console.error('Error updating claim request:', error);
    } finally {
      setClaiming(null);
    }
  };

  const handleVerificationDecision = async (requestId, status) => {
    setVerifying(requestId);
    try {
      const response = await fetch(`/api/admin/verification-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setVerificationRequests((prev) => prev.filter((item) => item.id !== requestId));
      }
    } catch (error) {
      console.error('Error updating verification request:', error);
    } finally {
      setVerifying(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdminRole(session?.user?.role)) {
    return null;
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage reviews, businesses, and users</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Approved Reviews</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReviews}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>Review and moderate submitted reviews</CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending reviews
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/company/${review.business.slug}`}
                                className="font-semibold hover:underline"
                              >
                                {review.business.name}
                              </Link>
                              <Badge variant="secondary">{review.business.slug}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>By {review.user.name || review.user.email}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-1">{review.title}</h4>
                          <p className="text-muted-foreground">{review.content}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleModerate(review.id, 'APPROVED')}
                            disabled={moderating === review.id}
                            size="sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleModerate(review.id, 'REJECTED')}
                            disabled={moderating === review.id}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Requests</CardTitle>
            <CardDescription>Approve or reject verified profile badge requests</CardDescription>
          </CardHeader>
          <CardContent>
            {verificationRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending verification requests
              </div>
            ) : (
              <div className="space-y-4">
                {verificationRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/company/${request.business.slug}`}
                                className="font-semibold hover:underline"
                              >
                                {request.business.name}
                              </Link>
                              <Badge variant="secondary">{request.business.category}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Requested by {request.requestedBy.name || request.requestedBy.email}
                            </div>
                            {request.note && (
                              <p className="text-sm text-muted-foreground">Note: {request.note}</p>
                            )}
                          </div>
                          <Badge>{request.status}</Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVerificationDecision(request.id, 'APPROVED')}
                            disabled={verifying === request.id}
                            size="sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleVerificationDecision(request.id, 'REJECTED')}
                            disabled={verifying === request.id}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claim Requests</CardTitle>
            <CardDescription>Approve or reject business claim requests</CardDescription>
          </CardHeader>
          <CardContent>
            {claims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending claim requests
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <Card key={claim.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/company/${claim.business.slug}`}
                                className="font-semibold hover:underline"
                              >
                                {claim.business.name}
                              </Link>
                              <Badge variant="secondary">{claim.business.category}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Requested by {claim.user.name || claim.user.email}
                            </div>
                          </div>
                          <Badge>{claim.status}</Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleClaimDecision(claim.id, 'APPROVED')}
                            disabled={claiming === claim.id}
                            size="sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleClaimDecision(claim.id, 'REJECTED')}
                            disabled={claiming === claim.id}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
