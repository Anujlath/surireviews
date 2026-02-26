export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import Footer from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/star-rating';
import { SearchBar } from '@/components/search-bar';
import { HomeCategoriesCarousel } from '@/components/home-categories-carousel';
import { prisma } from '@/lib/prisma';
import { DEFAULT_COUNTRY, getCountryTerms } from '@/lib/country';
import {
  Search,
  TrendingUp,
  Shield,
  Users,
  Star,
  Sparkles,
} from 'lucide-react';

async function getFeaturedBusinesses(country = DEFAULT_COUNTRY) {
  const countryTerms = getCountryTerms(country);
  const businesses = await prisma.business.findMany({
    where: countryTerms.length
      ? {
          OR: countryTerms.map((term) => ({
            country: { contains: term, mode: 'insensitive' },
          })),
        }
      : undefined,
    take: 6,
    include: {
      reviews: {
        where: { status: 'APPROVED' },
        select: { rating: true },
      },
      _count: {
        select: { reviews: { where: { status: 'APPROVED' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return businesses.map((business) => {
    const totalRating = business.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const avgRating =
      business.reviews.length > 0
        ? totalRating / business.reviews.length
        : 0;

    return {
      ...business,
      averageRating: parseFloat(avgRating.toFixed(1)),
      reviewCount: business._count.reviews,
      reviews: undefined,
      _count: undefined,
    };
  });
}

export default async function HomePage({ searchParams }) {
  const cookieStore = cookies();
  const selectedCountry = searchParams?.country || cookieStore.get('sr_country')?.value || DEFAULT_COUNTRY;
  const featuredBusinesses = await getFeaturedBusinesses(selectedCountry);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-12 md:py-16 lg:py-24">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />
        <div className="hero-grid-pattern" />

        <div className="container relative max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6 md:space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/85 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                Trusted by customers across Nigeria, UK and USA
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-6xl">
                  Find trusted businesses.
                  <br />
                  <span className="text-primary">Read real reviews.</span>
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
                  Compare companies with transparent ratings, recent customer feedback, and verified business profiles.
                </p>
              </div>

              <div className="max-w-3xl">
                <SearchBar autoFocus={false} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/companies">
                    <Search className="mr-2 h-5 w-5" />
                    Explore Companies
                  </Link>
                </Button>
                <Button size="lg" asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/categories">Browse Categories</Link>
                </Button>
              </div>
            </div>

            <div className="relative hidden min-h-[380px] lg:block">
              <div className="hero-orb hero-orb-a" />
              <div className="hero-orb hero-orb-b" />

              <div className="hero-float-card absolute left-6 top-8 w-56 rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Rated</p>
                <p className="mt-2 text-base font-semibold">Global Services Inc</p>
                <p className="text-sm text-muted-foreground">Consulting, New York</p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                  <Star className="h-3.5 w-3.5 fill-violet-600 text-violet-600" />
                  5.0 Excellent
                </div>
              </div>

              <div className="hero-float-card hero-float-delay absolute right-2 top-36 w-56 rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verified Profile</p>
                <p className="mt-2 text-base font-semibold">Acme Corporation</p>
                <p className="text-sm text-muted-foreground">Technology, San Francisco</p>
                <p className="mt-3 text-xs text-muted-foreground">Updated with recent customer replies</p>
              </div>

              <div className="hero-float-card hero-float-slow absolute left-16 bottom-8 w-60 rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer Signal</p>
                <p className="mt-2 text-sm text-muted-foreground">+42 new reviews this week across trending categories.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="bg-[#f4f4f4] px-4 py-8 md:py-10">
        <div className="container max-w-6xl">
          <HomeCategoriesCarousel />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-6 sm:mb-12">Why SuriReviews?</h2>
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            <Card className="h-full">
              <CardHeader className="h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Verified Reviews</CardTitle>
                <CardDescription className="min-h-[48px]">
                  All reviews are moderated to ensure authenticity and quality
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="h-full">
              <CardHeader className="h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Real People</CardTitle>
                <CardDescription className="min-h-[48px]">
                  Reviews from real customers sharing genuine experiences
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="h-full">
              <CardHeader className="h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Transparent Ratings</CardTitle>
                <CardDescription className="min-h-[48px]">
                  Clear rating distributions and detailed feedback
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="md:hidden">
            <div className="grid gap-3">
              <div className="min-w-[80%] snap-center rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Verified Reviews</p>
                    <p className="text-xs text-muted-foreground">Moderated for authenticity</p>
                  </div>
                </div>
              </div>
              <div className="min-w-[80%] snap-center rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Real People</p>
                    <p className="text-xs text-muted-foreground">Genuine customer voices</p>
                  </div>
                </div>
              </div>
              <div className="min-w-[80%] snap-center rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Transparent Ratings</p>
                    <p className="text-xs text-muted-foreground">Clear, detailed summaries</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl">
          <div className="mb-8 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold sm:text-3xl">Featured Companies</h2>
            <Button variant="ghost" asChild>
              <Link href="/companies">View all -&gt;</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
            {featuredBusinesses.map((business) => (
              <Link key={business.id} href={`/company/${business.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {business.logo && (
                        <img
                          src={business.logo}
                          alt={business.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{business.name}</CardTitle>
                        <CardDescription className="truncate">
                          {business.category}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {business.reviewCount > 0 ? (
                        <div className="space-y-2">
                          <StarRating rating={business.averageRating} showNumber />
                          <p className="text-sm text-muted-foreground">
                            Based on {business.reviewCount} review{business.reviewCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No reviews yet</p>
                      )}
                      {business.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {business.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary px-4 py-14 text-primary-foreground md:py-20">
        <div className="container max-w-4xl space-y-5 text-center md:space-y-6">
          <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
            Ready to share your experience?
          </h2>
          <p className="text-base opacity-90 sm:text-lg">
            Help others make informed decisions by sharing your honest reviews.
          </p>
          <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
            <Link href="/write-review">Write a Review</Link>
          </Button>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6">
          <Footer variant="review" embedded transparent />
        </div>
      </section>
    </div>
  );
}
