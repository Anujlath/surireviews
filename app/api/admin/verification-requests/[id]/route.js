export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const status = body?.status;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const verificationRequest = await prisma.businessVerificationRequest.findUnique({
      where: { id: params.id },
      include: { business: { select: { id: true, verified: true } } },
    });

    if (!verificationRequest) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    if (verificationRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    if (status === 'APPROVED') {
      await prisma.$transaction([
        prisma.business.update({
          where: { id: verificationRequest.businessId },
          data: { verified: true },
        }),
        prisma.businessVerificationRequest.update({
          where: { id: verificationRequest.id },
          data: { status: 'APPROVED' },
        }),
        prisma.businessVerificationRequest.updateMany({
          where: {
            businessId: verificationRequest.businessId,
            status: 'PENDING',
            id: { not: verificationRequest.id },
          },
          data: { status: 'REJECTED' },
        }),
      ]);
      return NextResponse.json({ status: 'APPROVED' });
    }

    await prisma.businessVerificationRequest.update({
      where: { id: verificationRequest.id },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({ status: 'REJECTED' });
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json(
      { error: 'Failed to update verification request' },
      { status: 500 }
    );
  }
}
