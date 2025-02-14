import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workers = await prisma.workerAssignment.findMany({
      where: {
        projectId: params.id,
        isActive: true,
        endDate: null,
      },
      select: {
        worker: {
          select: {
            id: true,
            name: true,
            type: true,
            photoUrl: true,
            hourlyRate: true,
          },
        },
        startDate: true,
      },
    });

    const transformedWorkers = workers.map((assignment) => ({
      ...assignment.worker,
      startDate: assignment.startDate.toISOString(),
    }));

    return NextResponse.json(transformedWorkers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      id,
      workerId,
      name,
      type,
      hourlyRate,
      phoneNumber,
      isExisting,
      photoUrl,
    } = body;

    if (isExisting && workerId) {
      await prisma.workerAssignment.create({
        data: {
          workerId,
          projectId: params.id,
          startDate: new Date(),
        },
      });
      return NextResponse.json({ success: true, id: workerId });
    } else {
      const worker = await prisma.worker.create({
        data: {
          id,
          name,
          type,
          hourlyRate,
          phoneNumber,
          photoUrl,
          assignments: {
            create: {
              projectId: params.id,
              startDate: new Date(),
            },
          },
        },
      });

      if (photoUrl) {
        await prisma.workerPhoto.create({
          data: {
            url: photoUrl,
            workerId: worker.id,
            projectId: params.id,
            tag: "reference-photo",
          },
        });
      }

      return NextResponse.json({ success: true, id: worker.id });
    }
  } catch (error) {
    console.error("Error adding worker:", error);
    return NextResponse.json(
      { error: "Failed to add worker" },
      { status: 500 }
    );
  }
}
