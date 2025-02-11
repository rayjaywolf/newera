import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MaterialType } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const materialType = searchParams.get("materialType");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  if (!projectId || !materialType) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const dateFilter =
    fromDate && toDate
      ? {
          date: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        }
      : {};

  try {
    const materials = await prisma.materialUsage.findMany({
      where: {
        projectId,
        type: materialType.toUpperCase().replace(/-/g, "_") as MaterialType,
        ...dateFilter,
      },
      orderBy: {
        date: "desc",
      },
    });

    const totalVolume = materials.reduce((acc, mat) => acc + mat.volume, 0);
    const totalCost = materials.reduce((acc, mat) => acc + mat.cost, 0);
    const averageRate = Math.round(totalCost / totalVolume);

    const currentMonth = new Date();
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const monthlyUsage = materials.filter(
      (mat) =>
        new Date(mat.date) >= monthStart && new Date(mat.date) <= monthEnd
    );

    const monthlyVolume = monthlyUsage.reduce(
      (acc, mat) => acc + mat.volume,
      0
    );
    const monthlyCost = monthlyUsage.reduce((acc, mat) => acc + mat.cost, 0);

    return NextResponse.json({
      type: materialType,
      totalVolume,
      totalCost,
      averageRate,
      entries: materials.length,
      lastUpdated: materials[0]?.date,
      history: materials,
      monthlyVolume,
      monthlyCost,
    });
  } catch (error) {
    console.error("Error fetching material usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch material usage" },
      { status: 500 }
    );
  }
}
