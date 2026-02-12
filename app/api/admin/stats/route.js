export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalUsers, totalBusinesses, totalReviews, pendingReviews] =
      await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.review.count({ where: { status: 'APPROVED' } }),
        prisma.review.count({ where: { status: 'PENDING' } }),
      ]);

    const recentReviews = await prisma.review.findMany({
      where: { status: 'PENDING' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalBusinesses,
        totalReviews,
        pendingReviews,
      },
      recentReviews,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
