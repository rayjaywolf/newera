import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MachineryType, JCBSubtype, SLMSubtype } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const machineryType = searchParams.get("machineryType");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  if (!projectId || !machineryType) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const [type, subtype] = decodeURIComponent(machineryType)
    .toUpperCase()
    .replace(/-/g, "_")
    .split("_SUBTYPE_");

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
    const machinery = await prisma.machineryUsage.findMany({
      where: {
        projectId,
        type: type as MachineryType,
        ...(type === "JCB" && subtype
          ? { jcbSubtype: subtype as JCBSubtype }
          : type === "SLM" && subtype
          ? { slmSubtype: subtype as SLMSubtype }
          : {}),
        ...dateFilter,
      },
      orderBy: {
        date: "desc",
      },
    });

    const totalHours = machinery.reduce((acc, m) => acc + m.hoursUsed, 0);
    const totalCost = machinery.reduce((acc, m) => acc + m.totalCost, 0);
    const averageRate = machinery.length
      ? Math.round(
          machinery.reduce((acc, m) => acc + m.hourlyRate, 0) / machinery.length
        )
      : 0;

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

    const monthlyUsage = machinery.filter(
      (m) => new Date(m.date) >= monthStart && new Date(m.date) <= monthEnd
    );

    const monthlyHours = monthlyUsage.reduce((acc, m) => acc + m.hoursUsed, 0);
    const monthlyCost = monthlyUsage.reduce((acc, m) => acc + m.totalCost, 0);
    const monthlyAverageRate = monthlyUsage.length
      ? Math.round(
          monthlyUsage.reduce((acc, m) => acc + m.hourlyRate, 0) /
            monthlyUsage.length
        )
      : 0;

    return NextResponse.json({
      type,
      subtype,
      totalHours,
      totalCost,
      averageRate,
      entries: machinery.length,
      lastUpdated: machinery[0]?.date,
      history: machinery,
      monthlyHours,
      monthlyCost,
      monthlyAverageRate,
    });
  } catch (error) {
    console.error("Error fetching machinery usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch machinery usage" },
      { status: 500 }
    );
  }
}
