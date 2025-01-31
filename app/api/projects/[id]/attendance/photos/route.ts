import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Fetch attendance records with photos and worker information
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        projectId,
        photoUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        photoUrl: true,
        confidence: true,
        date: true,
        createdAt: true,
        worker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching attendance photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance photos" },
      { status: 500 }
    );
  }
}
