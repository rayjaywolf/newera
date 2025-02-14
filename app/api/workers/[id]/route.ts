import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { deleteFaceFromCollection } from "@/lib/face-recognition";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, type, hourlyRate, phoneNumber, faceId, photoUrl } = body;

    const updatedWorker = await prisma.worker.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(hourlyRate && { hourlyRate }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(faceId && { faceId }),
        ...(photoUrl && { photoUrl }),
      },
    });

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error("Error updating worker:", error);
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get worker details including faceId
    const worker = await prisma.worker.findUnique({
      where: { id: params.id },
      select: {
        faceId: true,
        photoUrl: true
      },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Worker not found" },
        { status: 404 }
      );
    }

    // 2. Delete all related records in a transaction with increased timeout
    await prisma.$transaction(async (tx) => {
      // Delete all records in parallel for better performance
      await Promise.all([
        // Delete all worker assignments
        tx.workerAssignment.deleteMany({
          where: { workerId: params.id },
        }),

        // Delete all attendance records
        tx.attendance.deleteMany({
          where: { workerId: params.id },
        }),

        // Delete all advances
        tx.advance.deleteMany({
          where: { workerId: params.id },
        }),

        // Delete all worker photos
        tx.workerPhoto.deleteMany({
          where: { workerId: params.id },
        }),
      ]);

      // Finally delete the worker
      await tx.worker.delete({
        where: { id: params.id },
      });
    }, {
      timeout: 20000, // Increase timeout to 20 seconds
      maxWait: 25000, // Maximum time to wait for transaction to start
    });

    // 3. Delete face from AWS Rekognition if exists
    if (worker.faceId) {
      try {
        await deleteFaceFromCollection(worker.faceId);
      } catch (error) {
        console.error("Failed to delete face from Rekognition:", error);
        // Continue execution even if face deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting worker:", error);
    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 }
    );
  }
}
