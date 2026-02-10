export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ status: 'UNAUTHENTICATED' });
    }
    if (user.role !== 'BUSINESS') {
      return NextResponse.json({ status: 'BUSINESS_REQUIRED' });
    }

    const slug = params.slug;
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, claimedById: true },
    });

    if (!business) {
      return NextResponse.json({ status: 'NOT_FOUND' }, { status: 404 });
    }

    if (business.claimedById) {
      return NextResponse.json({
        status: business.claimedById === user.id ? 'CLAIMED_BY_YOU' : 'ALREADY_CLAIMED',
      });
    }

    const existingRequest = await prisma.businessClaimRequest.findUnique({
      where: {
        businessId_userId: { businessId: business.id, userId: user.id },
      },
      select: { status: true },
    });

    return NextResponse.json({ status: existingRequest?.status || 'NONE' });
  } catch (error) {
    console.error('Error fetching claim status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim status' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Business account required', code: 'BUSINESS_REQUIRED' },
        { status: 403 }
      );
    }

    const slug = params.slug;

    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, claimedById: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (business.claimedById) {
      return NextResponse.json(
        { error: 'Business is already claimed' },
        { status: 400 }
      );
    }

    const existingClaim = await prisma.business.findFirst({
      where: { claimedById: user.id },
      select: { id: true },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: 'You have already claimed a business' },
        { status: 400 }
      );
    }

    const pendingRequest = await prisma.businessClaimRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
      select: { id: true },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending claim request' },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.businessClaimRequest.findUnique({
      where: {
        businessId_userId: { businessId: business.id, userId: user.id },
      },
    });

    if (existingRequest) {
      return NextResponse.json({ status: existingRequest.status });
    }

    const requestRow = await prisma.businessClaimRequest.create({
      data: {
        businessId: business.id,
        userId: user.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ status: requestRow.status });
  } catch (error) {
    console.error('Error creating claim request:', error);
    return NextResponse.json(
      { error: 'Failed to claim business' },
      { status: 500 }
    );
  }
}
