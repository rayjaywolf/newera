import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const attendance = await prisma.adminAttendance.findMany({
      where: {
        date: {
          gte: new Date(`${date}T00:00:00Z`),
          lt: new Date(`${date}T23:59:59Z`),
        },
      },
      select: {
        workerId: true,
        present: true,
        photoUrl: true,
        confidence: true,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, records } = body;

    if (!date || !records) {
      return NextResponse.json(
        { error: "Date and records are required" },
        { status: 400 }
      );
    }

    // Process all attendance records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing records for the date
      await tx.adminAttendance.deleteMany({
        where: {
          date: {
            gte: new Date(`${date}T00:00:00Z`),
            lt: new Date(`${date}T23:59:59Z`),
          },
        },
      });

      // Create new attendance records
      await tx.adminAttendance.createMany({
        data: records.map((record: any) => ({
          workerId: record.workerId,
          present: record.present,
          photoUrl: record.photoUrl,
          confidence: record.confidence,
          date: new Date(`${date}T00:00:00Z`),
        })),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
