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
  Truck,
  Clock,
  IndianRupee,
  Calendar,
  TrendingUp,
  History,
  Timer,
} from "lucide-react";
import cn from "classnames";
import { MachineryType, JCBSubtype, SLMSubtype } from "@prisma/client";
import dynamic from "next/dynamic";

interface MachineryPageProps {
  params: {
    id: string;
    machineryType: string;
  };
}

export const metadata: Metadata = {
  title: "Machinery Details",
  description: "Details of the selected machinery",
};

async function getMachineryDetails(projectId: string, machineryType: string) {
  const [type, subtype] = decodeURIComponent(machineryType)
    .toUpperCase()
    .replace(/-/g, "_")
    .split("_SUBTYPE_");

  const machinery = await prisma.machineryUsage.findMany({
    where: {
      projectId,
      type: type as MachineryType,
      ...(type === "JCB" && subtype
        ? { jcbSubtype: subtype as JCBSubtype }
        : type === "SLM" && subtype
          ? { slmSubtype: subtype as SLMSubtype }
          : {}),
    },
    orderBy: {
      date: "desc",
    },
  });

  if (!machinery.length) return null;

  // Calculate aggregated data
  const totalHours = machinery.reduce((acc, m) => acc + m.hoursUsed, 0);
  const totalCost = machinery.reduce((acc, m) => acc + m.totalCost, 0);
  const averageRate = Math.round(
    machinery.reduce((acc, m) => acc + m.hourlyRate, 0) / machinery.length
  );

  // Calculate monthly usage
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

  return {
    type,
    subtype,
    totalHours,
    totalCost,
    averageRate,
    entries: machinery.length,
    lastUpdated: machinery[0].date,
    history: machinery,
    monthlyHours,
    monthlyCost,
    monthlyAverageRate,
  };
}

export default async function MachineryPage({ params }: MachineryPageProps) {
  const { id: projectId, machineryType } = params;

  // Create a client component wrapper for the date filter
  const UsageHistoryWithFilter = dynamic(() => import("./usage-history"), {
    ssr: false,
  });

  const machinery = await getMachineryDetails(projectId, machineryType);

  if (!machinery) {
    notFound();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMachineryName = () => {
    const parts = [
      machinery.type.toLowerCase(),
      machinery.subtype?.toLowerCase().replace(/_/g, " "),
    ].filter(Boolean);
    return parts.join(" - ");
  };

  return (
    <div className="p-8 space-y-8">
      {/* Machinery Details Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <Truck className="h-7 w-7" />
                {getMachineryName()}
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                {machinery.entries} total entries
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="px-4 py-1.5 border-gray-500 text-gray-500"
            >
              Last Used: {formatDate(machinery.lastUpdated)}
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
                {formatCurrency(machinery.averageRate)}/hr
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 mb-1 flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Total Hours
              </dt>
              <dd className="text-lg">{machinery.totalHours} hrs</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 mb-1 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Cost
              </dt>
              <dd className="text-lg">{formatCurrency(machinery.totalCost)}</dd>
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
                Monthly Hours
              </p>
              <p className="text-2xl font-semibold mt-2">
                {machinery.monthlyHours} hrs
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Monthly Cost
              </p>
              <p className="text-2xl font-semibold mt-2">
                {formatCurrency(machinery.monthlyCost)}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Rate
              </p>
              <p className="text-2xl font-semibold mt-2">
                {formatCurrency(machinery.monthlyAverageRate)}/hr
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage History Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <UsageHistoryWithFilter 
          projectId={projectId}
          machineryType={machineryType}
          initialData={machinery}
        />
      </Card>
    </div>
  );
}
