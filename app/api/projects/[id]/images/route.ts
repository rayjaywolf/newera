import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        images: {
          where: type ? { type } : undefined,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project.images);
  } catch (error) {
    console.error('Error fetching project images:', error);
    return NextResponse.json(
      { error: 'Error fetching project images' },
      { status: 500 }
    );
  }
}
