export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_COUNTRY, getCountryTerms } from '@/lib/country';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesCountry(countryValue, selectedCountry) {
  if (!String(countryValue || '').trim()) return true;
  const terms = getCountryTerms(selectedCountry);
  if (!terms.length) return true;
  const source = normalize(countryValue);
  return terms.some((term) => source.includes(term));
}

export async function GET(request, { params }) {
  try {
    const slug = params.slug;
    const selectedCountry =
      new URL(request.url).searchParams.get('country') ||
      request.cookies.get('sr_country')?.value ||
      DEFAULT_COUNTRY;

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            reply: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        claimedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (!matchesCountry(business.country, selectedCountry)) {
      return NextResponse.json(
        { error: 'Business not found in selected country' },
        { status: 404 }
      );
    }

    const [aggregate, groupedRatings, approvedReviewCount] = await Promise.all([
      prisma.review.aggregate({
        where: { businessId: business.id, status: 'APPROVED' },
        _avg: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { businessId: business.id, status: 'APPROVED' },
        _count: { _all: true },
      }),
      prisma.review.count({
        where: { businessId: business.id, status: 'APPROVED' },
      }),
    ]);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const row of groupedRatings) {
      if (ratingDistribution[row.rating] !== undefined) {
        ratingDistribution[row.rating] = row._count._all;
      }
    }

    return NextResponse.json({
      ...business,
      location: [business.city, business.state, business.country].filter(Boolean).join(', '),
      averageRating: parseFloat((aggregate._avg.rating || 0).toFixed(1)),
      reviewCount: approvedReviewCount,
      ratingDistribution,
      reviewHighlights: business.reviews,
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const slug = params.slug;
    const body = await request.json();

    const business = await prisma.business.update({
      where: { slug },
      data: body,
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const slug = params.slug;

    await prisma.business.delete({
      where: { slug },
    });

    return NextResponse.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500 }
    );
  }
}
