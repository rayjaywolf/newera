import { NextResponse } from "next/server";
import { listAllFaces } from "@/lib/face-recognition";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const faces = await listAllFaces();

    const workers = await prisma.worker.findMany({
      where: {
        faceId: { not: null },
      },
      select: {
        id: true,
        name: true,
        faceId: true,
        photoUrl: true,
      },
    });

    const facesWithWorkers = faces.map((face) => {
      const worker = workers.find((w) => w.faceId === face.FaceId);
      return {
        ...face,
        worker: worker || null,
      };
    });

    return NextResponse.json(facesWithWorkers, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching faces:", error);
    return NextResponse.json(
      { error: "Failed to fetch faces" },
      { status: 500 }
    );
  }
}
