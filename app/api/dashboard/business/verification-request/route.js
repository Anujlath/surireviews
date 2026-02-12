export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const note = String(body?.note || '').trim() || null;

    const business = await prisma.business.findFirst({
      where: { claimedById: user.id },
      select: { id: true, verified: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'No claimed business found' }, { status: 404 });
    }

    if (business.verified) {
      return NextResponse.json({ error: 'Business is already verified' }, { status: 400 });
    }

    const pending = await prisma.businessVerificationRequest.findFirst({
      where: { businessId: business.id, status: 'PENDING' },
      select: { id: true },
    });

    if (pending) {
      return NextResponse.json({ error: 'A verification request is already pending' }, { status: 400 });
    }

    const requestRow = await prisma.businessVerificationRequest.create({
      data: {
        businessId: business.id,
        requestedById: user.id,
        status: 'PENDING',
        note,
      },
    });

    return NextResponse.json(requestRow, { status: 201 });
  } catch (error) {
    console.error('Error creating verification request:', error);
    return NextResponse.json(
      { error: 'Failed to create verification request' },
      { status: 500 }
    );
  }
}
