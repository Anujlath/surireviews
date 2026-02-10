export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

function matchesCountry(countryValue, selectedCountry) {
  const terms = getCountryTerms(selectedCountry);
  if (!terms.length) return true;
  const source = normalize(countryValue);
  return terms.some((term) => source.includes(term));
}

export async function GET(request, { params }) {
  try {
    const slug = params.slug;
    const { searchParams } = new URL(request.url);
    const selectedCountry =
      searchParams.get('country') ||
      request.cookies.get('sr_country')?.value ||
      'UK';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '8', 10), 1), 20);
    const rating = searchParams.get('rating') || 'all';
    const sort = searchParams.get('sort') || 'newest';

    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, country: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (!matchesCountry(business.country, selectedCountry)) {
      return NextResponse.json({ error: 'Business not found in selected country' }, { status: 404 });
    }

    const where = {
      businessId: business.id,
      status: 'APPROVED',
      ...(rating !== 'all' ? { rating: Number(rating) } : {}),
    };

    let orderBy = [{ createdAt: 'desc' }];
    if (sort === 'oldest') orderBy = [{ createdAt: 'asc' }];
    if (sort === 'highest') orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'lowest') orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];

    const [total, items] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          reply: true,
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
      items,
    });
  } catch (error) {
    console.error('Error fetching paginated reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
