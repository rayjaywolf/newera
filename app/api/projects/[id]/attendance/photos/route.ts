import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's attendance records with photos and worker information
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        projectId,
        date: {
          gte: today,
          lt: tomorrow,
        },
        OR: [
          { workerInPhoto: { not: null } },
          { workerOutPhoto: { not: null } },
        ],
      },
      select: {
        id: true,
        workerInPhoto: true,
        workerOutPhoto: true,
        inConfidence: true,
        outConfidence: true,
        date: true,
        createdAt: true,
        isPartiallyMarked: true,
        worker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
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
