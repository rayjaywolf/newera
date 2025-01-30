import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const id = searchParams.get('id');

  if (!filename || !id) {
    return NextResponse.json(
      { error: 'Filename and id are required' },
      { status: 400 }
    );
  }

  try {
    // Find project by id directly since that's what we're using in the route
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const blob = await request.blob();
    const response = await put(filename, blob, {
      access: 'public',
    });

    // Save image information to database
    const image = await prisma.projectImage.create({
      data: {
        url: response.url,
        filename: filename.split('/').pop() || filename,
        projectId: project.id,
      },
    });

    return NextResponse.json({ ...response, image });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Error uploading image' },
      { status: 500 }
    );
  }
}
