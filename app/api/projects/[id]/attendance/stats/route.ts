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

    const assignedWorkers = await prisma.workerAssignment.findMany({
      where: {
        projectId,
        isActive: true,
        endDate: null,
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

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        projectId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        worker: true,
      },
    });

    const presentWorkers = todayAttendance
      .filter((record) => record.present)
      .map((record) => ({
        id: record.worker.id,
        name: record.worker.name,
      }));

    const fullyVerifiedWorkers = todayAttendance
      .filter((record) => record.workerInPhoto && record.workerOutPhoto)
      .map((record) => ({
        id: record.worker.id,
        name: record.worker.name,
        inConfidence: record.inConfidence,
        outConfidence: record.outConfidence,
      }));

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

    const unverifiedWorkers = todayAttendance
      .filter(
        (record) =>
          record.present && !record.workerInPhoto && !record.workerOutPhoto
      )
      .map((record) => ({
        id: record.worker.id,
        name: record.worker.name,
      }));

    const presentOrPartiallyVerifiedIds = new Set([
      ...presentWorkers.map((w) => w.id),
      ...partiallyVerifiedWorkers.map((w) => w.id),
    ]);

    const absentWorkers = assignedWorkers
      .filter(
        (assignment) => !presentOrPartiallyVerifiedIds.has(assignment.worker.id)
      )
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
