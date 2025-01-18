import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, hourlyRate } = body;

    const updatedWorker = await prisma.worker.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        hourlyRate,
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
