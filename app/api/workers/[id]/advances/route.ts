import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const advance = await prisma.advance.create({
      data: {
        workerId: params.id,
        projectId: body.projectId,
        amount: body.amount,
        date: new Date(),
        notes: body.notes || null,
      },
    });

    return NextResponse.json(advance);
  } catch (error) {
    console.error("Failed to add advance:", error);
    return NextResponse.json(
      { error: "Failed to add advance" },
      { status: 500 }
    );
  }
}
