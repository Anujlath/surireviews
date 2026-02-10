export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: { business: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is the business owner
    if (review.business.claimedById !== user.id) {
      return NextResponse.json(
        { error: 'Only the business owner can reply' },
        { status: 403 }
      );
    }

    // Check if reply already exists
    const existingReply = await prisma.reply.findUnique({
      where: { reviewId: params.id },
    });

    if (existingReply) {
      return NextResponse.json(
        { error: 'Reply already exists' },
        { status: 400 }
      );
    }

    const reply = await prisma.reply.create({
      data: {
        reviewId: params.id,
        businessId: review.businessId,
        content,
      },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}
