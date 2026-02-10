export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { verified } = body;

    const business = await prisma.business.update({
      where: { slug: params.slug },
      data: { verified },
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error verifying business:', error);
    return NextResponse.json(
      { error: 'Failed to verify business' },
      { status: 500 }
    );
  }
}
