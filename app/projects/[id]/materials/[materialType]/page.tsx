import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package2,
  Clock,
  IndianRupee,
  Calendar,
  TrendingUp,
  History,
} from "lucide-react";
import cn from "classnames";
import { MaterialType } from "@prisma/client";
import dynamic from "next/dynamic";
import { DateRangeFilter } from "@/components/date-range-filter";

interface MaterialPageProps {
  params: {
    id: string;
    materialType: string;
  };
}

export const metadata: Metadata = {
  title: "Material Details",
  description: "Details of the selected material",
};

const unitMapping: Record<MaterialType, string> = {
  STEEL: "kg",
  CEMENT: "bags",
  WASHING_SAND: "cubic feet",
  FINE_SAND: "cubic feet",
  GRIT_10MM: "cubic feet",
  GRIT_20MM: "cubic feet",
  GRIT_40MM: "cubic feet",
  BRICK: "number",
  STONE: "cubic feet",
  WATER: "litre",
};

async function getMaterialDetails(
  projectId: string,
  materialType: string,
  fromDate?: Date,
  toDate?: Date
) {
  const dateFilter =
    fromDate && toDate
      ? {
          date: {
            gte: fromDate,
            lte: toDate,
          },
        }
      : {};

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

  if (!materials.length) return null;

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
    (mat) => new Date(mat.date) >= monthStart && new Date(mat.date) <= monthEnd
  );

  const monthlyVolume = monthlyUsage.reduce((acc, mat) => acc + mat.volume, 0);
  const monthlyCost = monthlyUsage.reduce((acc, mat) => acc + mat.cost, 0);

  return {
    type: materialType,
    totalVolume,
    totalCost,
    averageRate,
    entries: materials.length,
    lastUpdated: materials[0].date,
    history: materials,
    monthlyVolume,
    monthlyCost,
  };
}

export default async function MaterialPage({ params }: MaterialPageProps) {
  const { id: projectId, materialType } = params;

  const UsageHistoryWithFilter = dynamic(() => import("./usage-history"), {
    ssr: false,
  });

  const material = await getMaterialDetails(
    projectId,
    decodeURIComponent(materialType)
  );

  if (!material) {
    notFound();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const materialTypeUpperCase = materialType.toUpperCase();

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8">
      {}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              {}
              <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Package2 className="h-7 w-7" />
                {materialTypeUpperCase.toLowerCase().replace("_", " ")}
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                {material.entries} total entries
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="hidden sm:inline-block px-4 py-1.5 border-gray-500 text-gray-500"
            >
              Last Updated: {formatDate(material.lastUpdated)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {}
          <dl className="grid gap-4 sm:gap-8 sm:grid-cols-3">
            <div>
              <dt className="font-medium text-gray-500 mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Rate
              </dt>
              <dd className="text-lg">
                {formatCurrency(material.averageRate)}/unit
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Total Volume
              </dt>
              <dd className="text-lg">
                {material.totalVolume}{" "}
                {unitMapping[materialTypeUpperCase] || "units"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 mb-1 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Cost
              </dt>
              <dd className="text-lg">{formatCurrency(material.totalCost)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Monthly Volume
              </p>
              <p className="text-2xl font-semibold mt-2">
                {material.monthlyVolume}{" "}
                {unitMapping[materialTypeUpperCase] || "units"}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Monthly Cost
              </p>
              <p className="text-2xl font-semibold mt-2">
                {formatCurrency(material.monthlyCost)}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Rate
              </p>
              <p className="text-2xl font-semibold mt-2">
                {formatCurrency(material.monthlyCost / material.monthlyVolume)}/
                {unitMapping[materialTypeUpperCase] || "unit"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <UsageHistoryWithFilter
          projectId={projectId}
          materialType={decodeURIComponent(materialType)}
          initialData={material}
        />
      </Card>
    </div>
  );
}
