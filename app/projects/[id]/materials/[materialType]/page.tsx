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

async function getMaterialDetails(projectId: string, materialType: string) {
  const materials = await prisma.materialUsage.findMany({
    where: {
      projectId,
      type: materialType.toUpperCase().replace(/-/g, "_") as MaterialType,
    },
    orderBy: {
      date: "desc",
    },
  });

  if (!materials.length) return null;

  // Calculate aggregated data
  const totalVolume = materials.reduce((acc, mat) => acc + mat.volume, 0);
  const totalCost = materials.reduce((acc, mat) => acc + mat.cost, 0);
  const averageRate = Math.round(totalCost / totalVolume);

  // Calculate monthly usage
  const currentMonth = new Date();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

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
  const material = await getMaterialDetails(projectId, decodeURIComponent(materialType));

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

  return (
    <div className="p-8 space-y-8">
      {/* Material Details Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <Package2 className="h-7 w-7" />
                {material.type.toLowerCase().replace("_", " ")}
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                {material.entries} total entries
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="px-4 py-1.5 border-gray-500 text-gray-500"
            >
              Last Updated: {formatDate(material.lastUpdated)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-8 sm:grid-cols-3">
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
              <dd className="text-lg">{material.totalVolume} units</dd>
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

      {/* Monthly Overview Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Monthly Volume
              </p>
              <p className="text-2xl font-semibold mt-2">
                {material.monthlyVolume} units
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Monthly Cost
              </p>
              <p className="text-2xl font-semibold mt-2">
                {formatCurrency(material.monthlyCost)}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Rate
              </p>
              <p className="text-2xl font-semibold mt-2">
                {formatCurrency(material.monthlyCost / material.monthlyVolume)}/unit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage History Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5" />
            Usage History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Volume
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Rate
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {material.history.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-100 hover:bg-white/[0.15]"
                  >
                    <td className="py-4 px-6">{formatDate(entry.date)}</td>
                    <td className="py-4 px-6">{entry.volume} units</td>
                    <td className="py-4 px-6">
                      {formatCurrency(Math.round(entry.cost / entry.volume))}/unit
                    </td>
                    <td className="py-4 px-6">{formatCurrency(entry.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
