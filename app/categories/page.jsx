export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { TRUSTPILOT_CATEGORY_GROUPS, TRUSTPILOT_CATEGORY_NAMES, getCategorySlugByName } from '@/lib/categories';
import CategoryAccordion from '@/components/category-accordion';
import CategorySearch from '@/components/category-search';

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

export default async function CategoriesPage({ searchParams }) {
  const countryFromQuery = searchParams?.country;
  const selectedCountry = countryFromQuery || cookies().get('sr_country')?.value || 'UK';
  const countryTerms = getCountryTerms(selectedCountry);
  const query = normalize(searchParams?.q);

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

  const groups = TRUSTPILOT_CATEGORY_GROUPS.map((group) => {
    const groupMatches = query ? normalize(group.name).includes(query) : false;
    const subcategories = group.subcategories
      .map((name) => ({
        name,
        slug: getCategorySlugByName(name),
        count: countMap.get(name) || 0,
      }))
      .filter((item) => item.slug)
      .filter((item) => (!query ? true : groupMatches || normalize(item.name).includes(query)));

    return {
      ...group,
      subcategories,
      totalCount: subcategories.reduce((sum, item) => sum + item.count, 0),
      groupMatches,
    };
  }).filter((group) => group.subcategories.length > 0 || !query);

  return (
    <div className="container max-w-6xl space-y-6 py-6 md:py-8">
      <div className="space-y-3">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Categories</h1>
        <p className="text-muted-foreground">
          Browse companies by category. Expand a section to explore subcategories.
        </p>
        <p className="text-xs text-muted-foreground mt-1">Country scope: {selectedCountry}</p>

        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <CategorySearch
            initialValue={searchParams?.q || ''}
            suggestions={TRUSTPILOT_CATEGORY_NAMES}
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      <CategoryAccordion groups={groups} />
    </div>
  );
}
