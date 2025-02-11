import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { WorkerType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, hourlyRate, phoneNumber, projectId } = body;

    console.log("Received request body:", body);

    if (!name || !type || !hourlyRate || !projectId) {
      console.error("Missing required fields:", {
        name,
        type,
        hourlyRate,
        projectId,
      });
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    if (!Object.values(WorkerType).includes(type)) {
      console.error("Invalid worker type:", type);
      return new NextResponse(
        JSON.stringify({ error: "Invalid worker type" }),
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { projectId },
    });

    if (!project) {
      console.error("Project not found:", projectId);
      return new NextResponse(JSON.stringify({ error: "Project not found" }), {
        status: 404,
      });
    }

    console.log("Creating worker with data:", {
      name,
      type,
      hourlyRate,
      phoneNumber,
      projectId,
    });

    const worker = await prisma.worker.create({
      data: {
        name,
        type: type as WorkerType,
        hourlyRate,
        phoneNumber: phoneNumber || null,
        isActive: true,
      },
    });

    console.log("Worker created:", worker);

    const assignment = await prisma.workerAssignment.create({
      data: {
        workerId: worker.id,
        projectId: project.id,
        startDate: new Date(),
      },
    });

    console.log("Worker assignment created:", assignment);

    return NextResponse.json({ worker, assignment });
  } catch (error) {
    console.error("Error creating worker:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Error creating worker",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
}
