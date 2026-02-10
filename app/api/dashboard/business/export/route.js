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
                name: true,
                email: true,
              },
            },
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

    // Format reviews for CSV
    const csvData = business.reviews.map((review) => ({
      date: new Date(review.createdAt).toLocaleDateString(),
      reviewer: review.user.name || review.user.email,
      rating: review.rating,
      title: review.title,
      content: review.content.replace(/[\r\n]+/g, ' '),
    }));

    // Create CSV content
    const headers = ['Date', 'Reviewer', 'Rating', 'Title', 'Content'];
    const csvRows = [
      headers.join(','),
      ...csvData.map((row) =>
        [
          row.date,
          `"${row.reviewer}"`,
          row.rating,
          `"${row.title}"`,
          `"${row.content}"`,
        ].join(',')
      ),
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${business.slug}-reviews-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting reviews:', error);
    return NextResponse.json(
      { error: 'Failed to export reviews' },
      { status: 500 }
    );
  }
}
