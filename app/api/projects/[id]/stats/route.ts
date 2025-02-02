import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const endDate = new Date();
  console.log(endDate);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  const dailyStats = await Promise.all(
    Array.from({ length: 30 }, (_, i) => {
      const iterationDate = new Date(endDate);
      iterationDate.setDate(iterationDate.getDate() - i);

      const dayStart = new Date(iterationDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(iterationDate);
      dayEnd.setHours(23, 59, 59, 999);

      return Promise.all([
        prisma.workerAssignment.count({
          where: {
            projectId: id,
            startDate: { lte: dayEnd },
            OR: [{ endDate: null }, { endDate: { gt: dayStart } }],
          },
        }),
        prisma.attendance.count({
          where: {
            projectId: id,
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
            present: true,
          },
        }),
      ]).then(([assigned, present]) => ({
        date: dayStart.toLocaleDateString("en-US"),
        percentage: assigned
          ? Number(((present / assigned) * 100).toFixed(1))
          : 0,
      }));
    })
  );

  const attendance = await prisma.attendance.findMany({
    where: { projectId: id },
    include: {
      worker: {
        select: { hourlyRate: true },
      },
    },
  });

  const materials = await prisma.materialUsage.findMany({
    where: { projectId: id },
  });

  const machinery = await prisma.machineryUsage.findMany({
    where: { projectId: id },
  });

  const workers = await prisma.workerAssignment.findMany({
    where: { projectId: id },
    include: { worker: true },
  });

  const advances = await prisma.advance.findMany({
    where: { projectId: id },
  });

  const worker = await prisma.worker.findMany({
    where: {
      assignments: {
        some: {
          projectId: id,
        },
      },
    },
  });

  return NextResponse.json({
    attendance,
    materials,
    machinery,
    worker,
    workers,
    advances,
    dailyStats,
  });
}
