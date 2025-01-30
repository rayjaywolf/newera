import { NextResponse } from "next/server";
import { deleteFaceFromCollection } from "@/lib/face-recognition";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { faceId } = await req.json();

    if (!faceId) {
      return NextResponse.json(
        { error: "Face ID is required" },
        { status: 400 }
      );
    }

    // Delete face from Rekognition collection
    await deleteFaceFromCollection(faceId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting face:", error);
    return NextResponse.json(
      { error: "Failed to delete face" },
      { status: 500 }
    );
  }
}
