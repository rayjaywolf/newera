import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const dateStr = searchParams.get("date");

    if (!projectId || !dateStr) {
      return NextResponse.json(
        { error: "Project ID and date are required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await prisma.attendance.findMany({
      where: {
        projectId: projectId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        worker: true,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, date, records } = body;

    if (!projectId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(new Date(date).getTime() + 19800000);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await prisma.attendance.findMany({
      where: {
        projectId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const existingAttendanceMap = new Map(
      existingAttendance.map((record) => [record.workerId, record])
    );

    const workersToDelete = records
      .filter(
        (record) =>
          !record.present && existingAttendanceMap.has(record.workerId)
      )
      .map((record) => existingAttendanceMap.get(record.workerId)?.id)
      .filter(Boolean) as string[];

    if (workersToDelete.length > 0) {
      await prisma.attendance.deleteMany({
        where: {
          id: {
            in: workersToDelete,
          },
        },
      });
    }

    const attendanceRecords = await Promise.all(
      records
        .filter((record) => record.present)
        .map(async (record) => {
          const existing = existingAttendanceMap.get(record.workerId);

          if (existing) {
            return prisma.attendance.update({
              where: { id: existing.id },
              data: {
                hoursWorked: record.hoursWorked || 0,
                overtime: record.overtime || 0,
              },
            });
          } else {
            return prisma.attendance.create({
              data: {
                projectId,
                workerId: record.workerId,
                date: new Date(Date.now() + 19800000),
                present: true,
                hoursWorked: record.hoursWorked || 0,
                overtime: record.overtime || 0,
              },
            });
          }
        })
    );

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance records" },
      { status: 500 }
    );
  }
}
