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

    // Get today's attendance records - using start and end of current day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findMany({
      where: {
        projectId: projectId,
        date: {
          gte: today,
          lt: tomorrow,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, attendance } = body;

    if (!projectId || !attendance) {
      return Response.json(
        { error: "Project ID and attendance data are required" },
        { status: 400 }
      );
    }

    // Process each attendance record with current timestamp
    const promises = attendance.map(async (record: any) => {
      const now = new Date(); // Get current timestamp for each record

      return prisma.attendance.upsert({
        where: {
          workerId_projectId_date: {
            workerId: record.id,
            projectId: projectId,
            date: now, // Use exact timestamp
          },
        },
        create: {
          workerId: record.id,
          projectId: projectId,
          date: now, // Use exact timestamp
          present: record.present,
          hoursWorked: record.hoursWorked,
        },
        update: {
          present: record.present,
          hoursWorked: record.hoursWorked,
        },
      });
    });

    await Promise.all(promises);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving attendance:", error);
    return Response.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
