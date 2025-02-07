import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return Response.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const workers = await prisma.workerAssignment.findMany({
      where: {
        projectId: projectId,
        endDate: null, // Only get currently assigned workers
      },
      include: {
        worker: true,
      },
    });

    // Get today's attendance records
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        projectId: projectId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const formattedWorkers = workers.map((assignment) => {
      const todayAttendance = attendance.find(
        (a) => a.workerId === assignment.worker.id
      );

      return {
        id: assignment.worker.id,
        name: assignment.worker.name,
        type: assignment.worker.type,
        photoUrl: assignment.worker.photoUrl,
        hourlyRate: assignment.worker.hourlyRate,
        present: todayAttendance?.present || false,
        hoursWorked: todayAttendance?.hoursWorked || 0,
      };
    });

    return Response.json(formattedWorkers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    return Response.json({ error: "Failed to fetch workers" }, { status: 500 });
  }
}
