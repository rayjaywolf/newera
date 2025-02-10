import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fromZonedTime } from "date-fns-tz";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(req.url);
    const timeZone = searchParams.get("timeZone") || "UTC";

    // Get current date and convert to client's timezone
    const now = new Date();
    const today = fromZonedTime(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
      timeZone
    );
    const tomorrow = fromZonedTime(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      ),
      timeZone
    );

    // Get all active workers assigned to the project with their details
    const assignedWorkers = await prisma.workerAssignment.findMany({
      where: {
        projectId,
        endDate: null,
        worker: {
          isActive: true,
        },
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalWorkers = assignedWorkers.length;
    const allWorkerIds = assignedWorkers.map(
      (assignment) => assignment.worker.id
    );

    // Get attendance records for today with worker details
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        projectId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        worker: true
      }
    });

    // Calculate statistics and group workers
    const presentWorkers = todayAttendance
      .filter((record) => record.present)
      .map((record) => ({
        id: record.worker.id,
        name: record.worker.name,
      }));

    // Workers with both check-in and check-out photos
    const fullyVerifiedWorkers = todayAttendance
      .filter((record) => record.workerInPhoto && record.workerOutPhoto)
      .map((record) => ({
        id: record.worker.id,
        name: record.worker.name,
        inConfidence: record.inConfidence,
        outConfidence: record.outConfidence,
      }));

    // Workers with only one photo (either check-in or check-out)
    const partiallyVerifiedWorkers = todayAttendance
      .filter(
        (record) =>
          (record.workerInPhoto && !record.workerOutPhoto) ||
          (!record.workerInPhoto && record.workerOutPhoto)
      )
      .map((record) => ({
        id: record.worker.id,
        name: record.worker.name,
        confidence: record.workerInPhoto
          ? record.inConfidence
          : record.outConfidence,
      }));

    // Workers marked present but without any photos
    const unverifiedWorkers = todayAttendance
      .filter(
        (record) =>
          record.present && !record.workerInPhoto && !record.workerOutPhoto
      )
      .map((record) => ({
        id: record.worker.id,
        name: record.worker.name,
      }));

    // Calculate absent workers (workers who are assigned but not present or partially verified)
    const presentOrPartiallyVerifiedIds = new Set([
      ...presentWorkers.map((w) => w.id),
      ...partiallyVerifiedWorkers.map((w) => w.id)
    ]);

    const absentWorkers = assignedWorkers
      .filter((assignment) => !presentOrPartiallyVerifiedIds.has(assignment.worker.id))
      .map((assignment) => ({
        id: assignment.worker.id,
        name: assignment.worker.name,
      }));

    return NextResponse.json({
      totalWorkers,
      workersPresent: presentWorkers.length,
      verifiedWorkers: fullyVerifiedWorkers.length,
      partiallyVerifiedWorkers: partiallyVerifiedWorkers.length,
      unverifiedWorkers: unverifiedWorkers.length,
      absentWorkers: absentWorkers.length,
      workerDetails: {
        all: assignedWorkers.map((a) => ({
          id: a.worker.id,
          name: a.worker.name,
        })),
        present: presentWorkers,
        verified: fullyVerifiedWorkers,
        partiallyVerified: partiallyVerifiedWorkers,
        unverified: unverifiedWorkers,
        absent: absentWorkers,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance stats" },
      { status: 500 }
    );
  }
}
