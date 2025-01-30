import { NextResponse } from "next/server";
import { indexWorkerFace, ensureCollection } from "@/lib/face-recognition";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Ensure collection exists
    await ensureCollection();

    const formData = await req.formData();
    const photoFile = formData.get("photo") as File;
    const workerId = formData.get("workerId") as string;

    if (!photoFile || !workerId) {
      return NextResponse.json(
        { error: "Photo and worker ID are required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

    // Index the face
    const faceId = await indexWorkerFace(photoBuffer, workerId);

    if (!faceId) {
      return NextResponse.json(
        { error: "Failed to index face" },
        { status: 500 }
      );
    }

    // Update worker with faceId if needed
    await prisma.worker.update({
      where: { id: workerId },
      data: { 
        faceId: faceId,
      },
    });

    return NextResponse.json({
      success: true,
      faceId,
    });
  } catch (error) {
    console.error("Error indexing face:", error);
    return NextResponse.json(
      { error: "Failed to index face" },
      { status: 500 }
    );
  }
}
