export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the business owned by this user
    const business = await prisma.business.findFirst({
      where: { claimedById: user.id },
      include: {
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            reply: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'No business claimed' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const ratings = business.reviews.map((r) => r.rating);
    const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
    const avgRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    const ratingDistribution = {
      5: ratings.filter((r) => r === 5).length,
      4: ratings.filter((r) => r === 4).length,
      3: ratings.filter((r) => r === 3).length,
      2: ratings.filter((r) => r === 2).length,
      1: ratings.filter((r) => r === 1).length,
    };

    return NextResponse.json({
      business,
      stats: {
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: ratings.length,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching business dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
