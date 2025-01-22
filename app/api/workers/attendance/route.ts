import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const workerId = searchParams.get('workerId');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  if (!projectId || !workerId) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const dateFilter = fromDate && toDate ? {
    date: {
      gte: new Date(fromDate),
      lte: new Date(toDate),
    },
  } : {};

  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        projectId,
        workerId,
        ...dateFilter,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching worker attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker attendance' },
      { status: 500 }
    );
  }
}
