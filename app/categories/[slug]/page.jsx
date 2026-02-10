export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoryBySlug, getCategoryGroupByName, getCategorySlugByName, getCategoryFamilyName, getRelatedCategories } from '@/lib/categories';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getCountryTerms(country) {
  const normalized = normalize(country);
  if (!normalized) return [];
  if (normalized === 'uk') return ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland'];
  if (normalized === 'usa') return ['usa', 'us', 'united states', 'united states of america'];
  if (normalized === 'nigeria') return ['nigeria'];
  return [normalized];
}

export default async function CategoryLandingPage({ params }) {
  const category = getCategoryBySlug(params.slug);
  if (!category) {
    notFound();
  }
  const selectedCountry = cookies().get('sr_country')?.value || 'UK';
  const countryTerms = getCountryTerms(selectedCountry);
  const countryWhere = countryTerms.length
    ? {
        OR: countryTerms.map((term) => ({
          country: { contains: term, mode: 'insensitive' },
        })),
      }
    : {};

  const [companyCount, companies] = await Promise.all([
    prisma.business.count({ where: { category: category.name, ...countryWhere } }),
    prisma.business.findMany({
      where: { category: category.name, ...countryWhere },
      include: {
        _count: {
          select: { reviews: { where: { status: 'APPROVED' } } },
        },
      },
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      take: 18,
    }),
  ]);

  const categoryGroup = getCategoryGroupByName(category.name);
  const parentFamily = categoryGroup?.name || getCategoryFamilyName(category.name) || 'Other';
  const siblingCategories = categoryGroup
    ? categoryGroup.subcategories
        .map((name) => ({
          name,
          slug: getCategorySlugByName(name),
        }))
        .filter((item) => item.slug)
    : getRelatedCategories(category.name);

  return (
    <div className="container max-w-6xl space-y-6 py-6 md:py-8">
      <div className="text-sm text-muted-foreground">
        <Link href="/categories" className="hover:underline">Categories</Link>
        {' / '}
        <span>{category.name}</span>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Category landing</Badge>
          <Badge variant="outline">Parent: {parentFamily}</Badge>
          <Badge variant="outline">{companyCount} companies</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{category.name}</h1>
        <p className="text-muted-foreground">
          Explore verified businesses and customer reviews in this category.
        </p>
        <p className="text-xs text-muted-foreground">Country scope: {selectedCountry}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/categories">Back to categories</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subcategories in {parentFamily}</CardTitle>
          <CardDescription>Explore sibling subcategories under this parent category</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {siblingCategories.map((item) => (
            <Button key={item.slug} asChild variant={item.slug === params.slug ? 'default' : 'outline'} size="sm">
              <Link href={`/categories/${item.slug}`}>{item.name}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold sm:text-2xl">Companies in {category.name}</h2>
        <Button asChild variant="outline">
          <Link href={`/companies?category=${encodeURIComponent(category.name)}`}>Browse full list</Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No company is currently listed under this category.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/company/${company.slug}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg leading-6">{company.name}</CardTitle>
                    {company.verified && <Badge variant="secondary">Verified</Badge>}
                  </div>
                  <CardDescription>
                    {[company.city, company.state, company.country].filter(Boolean).join(', ') || 'Location unavailable'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {company.description || 'No company description available yet.'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {company._count.reviews} approved review{company._count.reviews !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
