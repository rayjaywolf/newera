import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const workers = await prisma.adminWorker.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(workers);
  } catch (error) {
    console.error("Error fetching admin workers:", error);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, dailyIncome, phoneNumber } = body;

    const worker = await prisma.adminWorker.create({
      data: {
        name,
        type,
        dailyIncome: parseFloat(dailyIncome),
        phoneNumber,
      },
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Error creating admin worker:", error);
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 }
    );
  }
}
