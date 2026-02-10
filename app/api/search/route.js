export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TRUSTPILOT_CATEGORIES } from '@/lib/categories';

function getCountryTerms(country) {
  const normalized = String(country || '').trim().toLowerCase();
  if (!normalized) return [];
  if (normalized === 'uk') {
    return ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland'];
  }
  if (normalized === 'usa') {
    return ['usa', 'us', 'united states', 'united states of america'];
  }
  if (normalized === 'nigeria') {
    return ['nigeria'];
  }
  return [normalized];
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const selectedCountry = searchParams.get('country')?.trim() || 'UK';
    const countryTerms = getCountryTerms(selectedCountry);
    const countryFilter =
      countryTerms.length > 0
        ? {
            OR: countryTerms.map((term) => ({
              country: { contains: term, mode: 'insensitive' },
            })),
          }
        : null;

    if (!query || query.length < 2) {
      return NextResponse.json({
        query: query || '',
        country: selectedCountry,
        companies: [],
        categories: [],
        locations: [],
      });
    }

    const rawBusinesses = await prisma.business.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
              { website: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
              { state: { contains: query, mode: 'insensitive' } },
              { country: { contains: query, mode: 'insensitive' } },
            ],
          },
          ...(countryFilter ? [countryFilter] : []),
        ],
      },
      include: {
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true },
        },
        _count: {
          select: { reviews: { where: { status: 'APPROVED' } } },
        },
      },
      take: 20,
    });

    const q = query.toLowerCase();
    const businesses = rawBusinesses
      .map((business) => {
        const reviewCount = business._count.reviews;
        const totalRating = business.reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

        let relevance = 0;
        const name = business.name.toLowerCase();
        const category = business.category.toLowerCase();
        const website = (business.website || '').toLowerCase();
        const city = (business.city || '').toLowerCase();
        const state = (business.state || '').toLowerCase();
        const country = (business.country || '').toLowerCase();

        if (name.startsWith(q)) relevance += 120;
        if (name.includes(q)) relevance += 70;
        if (category.startsWith(q)) relevance += 40;
        if (category.includes(q)) relevance += 20;
        if (website.includes(q)) relevance += 10;
        if (city.includes(q) || state.includes(q) || country.includes(q)) relevance += 60;

        // Keep popular/reviewed companies higher, similar to Trustpilot's behavior.
        relevance += Math.min(reviewCount, 50);

        return {
          id: business.id,
          name: business.name,
          slug: business.slug,
          website: business.website,
          category: business.category,
          city: business.city,
          state: business.state,
          country: business.country,
          logo: business.logo,
          verified: business.verified,
          reviewCount,
          averageRating: Number(averageRating.toFixed(1)),
          relevance,
        };
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);

    const matchedCategoryCatalog = TRUSTPILOT_CATEGORIES.filter((item) => {
      const q = query.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
    }).slice(0, 8);

    const categoryNames = matchedCategoryCatalog.map((item) => item.name);
    const categoryCounts = categoryNames.length
      ? await prisma.business.groupBy({
          by: ['category'],
          where: {
            AND: [
              { category: { in: categoryNames } },
              ...(countryFilter ? [countryFilter] : []),
            ],
          },
          _count: { _all: true },
        })
      : [];

    const countMap = new Map(categoryCounts.map((item) => [item.category, item._count._all]));

    const locations = await prisma.business.findMany({
      where: {
        AND: [
          {
            OR: [
              { city: { contains: query, mode: 'insensitive' } },
              { state: { contains: query, mode: 'insensitive' } },
              { country: { contains: query, mode: 'insensitive' } },
            ],
          },
          ...(countryFilter ? [countryFilter] : []),
        ],
      },
      select: {
        city: true,
        state: true,
        country: true,
      },
      take: 20,
    });

    const locationCounts = new Map();
    for (const item of locations) {
      const labelParts = [item.city, item.state, item.country].filter(Boolean);
      if (labelParts.length === 0) continue;
      const label = labelParts.join(', ');
      locationCounts.set(label, (locationCounts.get(label) || 0) + 1);
    }

    return NextResponse.json({
      query,
      country: selectedCountry,
      companies: businesses,
      categories: matchedCategoryCatalog
        .map((item) => ({
          name: item.name,
          businessCount: countMap.get(item.name) || 0,
        }))
        .sort((a, b) => b.businessCount - a.businessCount || a.name.localeCompare(b.name))
        .slice(0, 6),
      locations: Array.from(locationCounts.entries())
        .map(([name, businessCount]) => ({ name, businessCount }))
        .sort((a, b) => b.businessCount - a.businessCount)
        .slice(0, 3),
    });
  } catch (error) {
    console.error('Error searching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to search businesses' },
      { status: 500 }
    );
  }
}
