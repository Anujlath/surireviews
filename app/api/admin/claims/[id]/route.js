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
    const status = body?.status;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const claim = await prisma.businessClaimRequest.findUnique({
      where: { id: params.id },
      include: { business: true },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim request not found' }, { status: 404 });
    }

    if (status === 'APPROVED') {
      if (claim.business.claimedById) {
        return NextResponse.json({ error: 'Business already claimed' }, { status: 400 });
      }

      const existingClaim = await prisma.business.findFirst({
        where: { claimedById: claim.userId },
        select: { id: true },
      });

      if (existingClaim) {
        return NextResponse.json({ error: 'User already claimed a business' }, { status: 400 });
      }

      const updated = await prisma.$transaction([
        prisma.business.update({
          where: { id: claim.businessId },
          data: { claimedById: claim.userId },
        }),
        prisma.businessClaimRequest.update({
          where: { id: claim.id },
          data: { status: 'APPROVED' },
        }),
      ]);

      return NextResponse.json({ status: 'APPROVED', business: updated[0] });
    }

    await prisma.businessClaimRequest.update({
      where: { id: claim.id },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({ status: 'REJECTED' });
  } catch (error) {
    console.error('Error updating claim request:', error);
    return NextResponse.json(
      { error: 'Failed to update claim request' },
      { status: 500 }
    );
  }
}
