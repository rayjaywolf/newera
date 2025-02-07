import { NextResponse } from "next/server";
import {
  searchFaceForAttendance,
  ensureCollection,
} from "@/lib/face-recognition";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    await ensureCollection();
    const formData = await req.formData();
    const photoFile = formData.get("photo") as File;
    const projectId = formData.get("projectId") as string;
    if (!photoFile || !projectId) {
      return NextResponse.json(
        { error: "Photo and project ID are required" },
        { status: 400 }
      );
    }
    const photoBuffer = Buffer.from(await photoFile.arrayBuffer());
    const { matched, workerId, confidence } = await searchFaceForAttendance(
      photoBuffer
    );
    if (!matched || !workerId) {
      return NextResponse.json(
        { error: "No matching face found" },
        { status: 404 }
      );
    }
    const workerExists = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { assignments: { where: { projectId } } },
    });
    if (!workerExists) {
      return NextResponse.json(
        { error: "Worker not found in the database" },
        { status: 404 }
      );
    }
    const hasValidAssignment = workerExists.assignments.some(
      (assignment) =>
        assignment.projectId === projectId &&
        (!assignment.endDate || new Date(assignment.endDate) > new Date())
    );
    if (!hasValidAssignment) {
      return NextResponse.json(
        { error: "Worker is not currently assigned to this project" },
        { status: 404 }
      );
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        workerId,
        projectId,
        date: { gte: today, lt: tomorrow },
        present: true,
      },
      include: {
        worker: {
          select: { id: true, name: true, hourlyRate: true, photoUrl: true },
        },
        project: { select: { id: true, projectId: true } },
      },
    });
    if (existingAttendance) {
      return NextResponse.json(
        {
          error: "Already marked present",
          attendance: existingAttendance,
          alreadyPresent: true,
        },
        { status: 409 }
      );
    }
    const filename = `attendance/${projectId}/${workerId}/${Date.now()}-${
      photoFile.name
    }`;
    const { url } = await put(filename, photoFile, { access: "public" });
    const attendance = await prisma.attendance.create({
      data: {
        workerId,
        projectId,
        date: new Date(),
        present: true,
        photoUrl: url,
        confidence,
        hoursWorked: 8,
        overtime: 0,
      },
      include: {
        worker: {
          select: { id: true, name: true, hourlyRate: true, photoUrl: true },
        },
        project: { select: { id: true, projectId: true } },
      },
    });
    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    console.error("Error verifying attendance:", error);
    return NextResponse.json(
      {
        error: "Failed to verify attendance",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
