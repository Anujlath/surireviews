export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_COUNTRY, getCountryTerms } from '@/lib/country';

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function buildUniqueSlug(baseSlug) {
  const base = slugify(baseSlug) || `company-${Date.now()}`;
  const matches = await prisma.business.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });

  if (!matches.some((item) => item.slug === base)) {
    return base;
  }

  let suffix = 2;
  while (matches.some((item) => item.slug === `${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();
    const location = searchParams.get('location')?.trim();
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const verifiedOnly = searchParams.get('verified') === 'true';
    const country = searchParams.get('country')?.trim() || DEFAULT_COUNTRY;
    const sort = searchParams.get('sort') || 'most-relevant';
    const latitude = parseFloat(searchParams.get('lat') || '');
    const longitude = parseFloat(searchParams.get('lng') || '');
    const radiusKm = parseFloat(searchParams.get('radiusKm') || '25');
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(searchParams.get('pageSize') || '12', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 50)
      : 12;
    const hasPaging = searchParams.has('page') || searchParams.has('pageSize');
    const hasGeoSearch =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Number.isFinite(radiusKm) &&
      radiusKm > 0;

    const whereConditions = [];

    if (category && category !== 'all') {
      whereConditions.push({ category });
    }

    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { state: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (location) {
      whereConditions.push({
        OR: [
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { country: { contains: location, mode: 'insensitive' } },
        ],
      });
    }

    if (verifiedOnly) {
      whereConditions.push({ verified: true });
    }

    const countryTerms = getCountryTerms(country);
    if (countryTerms.length > 0) {
      whereConditions.push({
        OR: countryTerms.map((term) => ({
          country: { contains: term, mode: 'insensitive' },
        })),
      });
    }

    if (hasGeoSearch) {
      whereConditions.push({
        latitude: { not: null },
        longitude: { not: null },
      });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const businesses = await prisma.business.findMany({
      where,
      include: {
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true, createdAt: true },
        },
        _count: {
          select: { reviews: { where: { status: 'APPROVED' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const scoredBusinesses = businesses
      .map((business) => {
      const totalRating = business.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating =
        business.reviews.length > 0
          ? (totalRating / business.reviews.length).toFixed(1)
          : 0;

      const reviewDates = business.reviews
        .map((review) => review.createdAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      const reviewCount = business._count.reviews;
      const lastReviewAt = reviewDates.length > 0 ? reviewDates[0] : null;

      let relevance = 0;
      if (search) {
        const q = search.toLowerCase();
        const name = business.name.toLowerCase();
        const description = (business.description || '').toLowerCase();
        const businessCategory = business.category.toLowerCase();
        const city = (business.city || '').toLowerCase();
        const state = (business.state || '').toLowerCase();
        const country = (business.country || '').toLowerCase();

        if (name.startsWith(q)) relevance += 120;
        if (name.includes(q)) relevance += 70;
        if (description.includes(q)) relevance += 20;
        if (businessCategory.includes(q)) relevance += 30;
        if (city.includes(q) || state.includes(q) || country.includes(q)) relevance += 50;
        relevance += Math.min(reviewCount, 50);
      }

      if (location) {
        const lq = location.toLowerCase();
        const locationLabel = `${business.city || ''} ${business.state || ''} ${business.country || ''}`.toLowerCase();
        if (locationLabel.includes(lq)) relevance += 100;
      }

      return {
        ...business,
        averageRating: parseFloat(avgRating),
        reviewCount,
        lastReviewAt,
        distanceKm:
          hasGeoSearch && Number.isFinite(business.latitude) && Number.isFinite(business.longitude)
            ? haversineDistanceKm(latitude, longitude, business.latitude, business.longitude)
            : null,
        relevance,
        reviews: undefined,
        _count: undefined,
      };
      })
      .filter((business) => {
        if (!hasGeoSearch) return true;
        return Number.isFinite(business.distanceKm) && business.distanceKm <= radiusKm;
      })
      .filter((business) => business.averageRating >= (isNaN(minRating) ? 0 : minRating));

    switch (sort) {
      case 'nearest':
        scoredBusinesses.sort((a, b) => {
          const aDistance = Number.isFinite(a.distanceKm) ? a.distanceKm : Number.MAX_SAFE_INTEGER;
          const bDistance = Number.isFinite(b.distanceKm) ? b.distanceKm : Number.MAX_SAFE_INTEGER;
          return aDistance - bDistance;
        });
        break;
      case 'most-reviewed':
        scoredBusinesses.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'recently-reviewed':
        scoredBusinesses.sort(
          (a, b) =>
            new Date(b.lastReviewAt || b.createdAt).getTime() -
            new Date(a.lastReviewAt || a.createdAt).getTime()
        );
        break;
      case 'newest':
        scoredBusinesses.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'most-relevant':
      default:
        if (hasGeoSearch) {
          scoredBusinesses.sort((a, b) => {
            const aDistance = Number.isFinite(a.distanceKm) ? a.distanceKm : Number.MAX_SAFE_INTEGER;
            const bDistance = Number.isFinite(b.distanceKm) ? b.distanceKm : Number.MAX_SAFE_INTEGER;
            return aDistance - bDistance;
          });
        } else if (search) {
          scoredBusinesses.sort((a, b) => b.relevance - a.relevance);
        } else {
          scoredBusinesses.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        break;
    }

    if (!hasPaging) {
      return NextResponse.json(scoredBusinesses);
    }

    const total = scoredBusinesses.length;
    const start = (page - 1) * pageSize;
    const items = scoredBusinesses.slice(start, start + pageSize);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      website,
      category,
      description,
      logo,
      banner,
      city,
      state,
      country,
      latitude,
      longitude,
    } = body;

    const normalizedName = String(name || '').trim();
    const normalizedCategory = String(category || '').trim();
    const normalizedSlug = String(slug || '').trim();

    if (!normalizedName || !normalizedCategory) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const uniqueSlug = await buildUniqueSlug(normalizedSlug || normalizedName);

    const business = await prisma.business.create({
      data: {
        name: normalizedName,
        slug: uniqueSlug,
        website: website ? String(website).trim() : null,
        category: normalizedCategory,
        city: city ? String(city).trim() : null,
        state: state ? String(state).trim() : null,
        country: country ? String(country).trim() : null,
        latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
        longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
        description: description ? String(description).trim() : null,
        logo: logo ? String(logo).trim() : null,
        banner: banner ? String(banner).trim() : null,
        claimedById: null,
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
