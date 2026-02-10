export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TRUSTPILOT_CATEGORIES, getCategoryFamilyName } from '@/lib/categories';

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedCountry = searchParams.get('country') || request.cookies.get('sr_country')?.value || 'UK';
    const countryTerms = getCountryTerms(selectedCountry);
    const grouped = await prisma.business.groupBy({
      by: ['category'],
      where: countryTerms.length
        ? {
            OR: countryTerms.map((term) => ({
              country: { contains: term, mode: 'insensitive' },
            })),
          }
        : undefined,
      _count: { _all: true },
    });

    const countMap = new Map(grouped.map((item) => [item.category, item._count._all]));

    const categories = TRUSTPILOT_CATEGORIES.map((item) => ({
      slug: item.slug,
      name: item.name,
      family: getCategoryFamilyName(item.name),
      companyCount: countMap.get(item.name) || 0,
    }));

    const familyMap = new Map();
    for (const category of categories) {
      const key = category.family || 'Other';
      if (!familyMap.has(key)) {
        familyMap.set(key, { name: key, companyCount: 0, categoryCount: 0 });
      }
      const family = familyMap.get(key);
      family.companyCount += category.companyCount;
      family.categoryCount += 1;
    }

    const families = Array.from(familyMap.values()).sort(
      (a, b) => b.companyCount - a.companyCount || a.name.localeCompare(b.name)
    );

    const groupedFamilies = families.map((family) => ({
      ...family,
      subcategories: categories
        .filter((item) => item.family === family.name)
        .sort((a, b) => b.companyCount - a.companyCount || a.name.localeCompare(b.name)),
    }));

    return NextResponse.json({
      categories: categories.sort(
        (a, b) => b.companyCount - a.companyCount || a.name.localeCompare(b.name)
      ),
      families,
      groupedFamilies,
      country: selectedCountry,
    });
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
