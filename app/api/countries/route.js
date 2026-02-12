export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_COUNTRY, sanitizeCountryList } from '@/lib/country';

export async function GET() {
  try {
    const rows = await prisma.business.findMany({
      select: { country: true },
      where: { country: { not: null } },
      distinct: ['country'],
    });

    const countries = sanitizeCountryList(rows.map((row) => row.country));

    return NextResponse.json({
      defaultCountry: DEFAULT_COUNTRY,
      countries,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { defaultCountry: DEFAULT_COUNTRY, countries: [DEFAULT_COUNTRY] },
      { status: 200 }
    );
  }
}
