export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await prisma.businessClaimRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        business: { select: { id: true, name: true, slug: true, category: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error('Error fetching claim requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim requests' },
      { status: 500 }
    );
  }
}
