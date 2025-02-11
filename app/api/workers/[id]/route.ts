import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, hourlyRate, faceId, photoUrl } = body;

    const updatedWorker = await prisma.worker.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name && { name }),
        ...(hourlyRate && { hourlyRate }),
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
    const worker = await prisma.worker.findUnique({
      where: { id: params.id },
      select: { faceId: true },
    });

    await prisma.worker.delete({
      where: { id: params.id },
    });

    if (worker?.faceId) {
      try {
        await fetch("/api/workers/delete-face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ faceId: worker.faceId }),
        });
      } catch (error) {
        console.error("Failed to delete face from Rekognition:", error);
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
