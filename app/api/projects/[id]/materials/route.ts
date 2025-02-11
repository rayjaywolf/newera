import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const material = await prisma.materialUsage.create({
      data: {
        projectId: params.id,
        type: body.type,
        volume: body.volume,
        cost: body.cost,
        date: body.date || new Date(),
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error("Failed to add material:", error);
    return NextResponse.json(
      { error: "Failed to add material" },
      { status: 500 }
    );
  }
}
