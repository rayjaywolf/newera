import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();

    const machinery = await prisma.machineryUsage.create({
      data: {
        project: { connect: { id: params.id } },
        type: json.type,
        jcbSubtype: json.jcbSubtype,
        slmSubtype: json.slmSubtype,
        hoursUsed: json.hoursUsed,
        hourlyRate: json.hourlyRate,
        date: json.date,
        totalCost: json.totalCost,
      },
    });

    return NextResponse.json(machinery);
  } catch (error) {
    console.error("Error adding machinery:", error);
    return NextResponse.json(
      { error: "Error adding machinery" },
      { status: 500 }
    );
  }
}
