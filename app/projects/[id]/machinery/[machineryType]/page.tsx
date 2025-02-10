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
import { MachineryType, JCBSubtype, SLMSubtype, JCBPartType } from "@prisma/client";
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
  const parts = decodeURIComponent(machineryType)
    .toUpperCase()
    .replace(/-/g, "_")
    .split("_");

  const type = parts[0] as MachineryType;
  let jcbSubtype: JCBSubtype | null = null;
  let jcbPartType: JCBPartType | null = null;
  let slmSubtype: SLMSubtype | null = null;

  if (type === "JCB") {
    // Find JCB subtype and part type
    for (let i = 1; i < parts.length; i++) {
      if (parts[i] === "SUBTYPE" && parts[i + 1]) {
        jcbSubtype = parts[i + 1] as JCBSubtype;
        i++; // Skip the next part as we've used it
      } else if (parts[i] === "PARTTYPE" && parts[i + 1]) {
        jcbPartType = parts[i + 1] as JCBPartType;
        i++; // Skip the next part as we've used it
      }
    }
  } else if (type === "SLM") {
    // Find SLM subtype
    const subtypeIndex = parts.indexOf("SUBTYPE");
    if (subtypeIndex !== -1 && parts[subtypeIndex + 1]) {
      slmSubtype = parts[subtypeIndex + 1] as SLMSubtype;
    }
  }

  const machinery = await prisma.machineryUsage.findMany({
    where: {
      projectId,
      type,
      ...(jcbSubtype ? { jcbSubtype } : {}),
      ...(jcbPartType ? { jcbPartType } : {}),
      ...(slmSubtype ? { slmSubtype } : {}),
    },
    orderBy: {
      date: "desc",
    },
  });

  if (!machinery.length) return null;

  const totalHours = machinery.reduce((acc, m) => acc + m.hoursUsed, 0);
  const totalCost = machinery.reduce((acc, m) => acc + m.totalCost, 0);
  const averageRate = Math.round(
    machinery.reduce((acc, m) => acc + m.hourlyRate, 0) / machinery.length
  );

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
    jcbSubtype,
    jcbPartType,
    slmSubtype,
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
      machinery.jcbSubtype?.toLowerCase().replace(/_/g, " "),
      machinery.jcbPartType?.toLowerCase().replace(/_/g, " "),
      machinery.slmSubtype?.toLowerCase().replace(/_/g, " "),
    ].filter(Boolean);
    return parts.join(" - ");
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
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
              className="hidden sm:inline-block px-4 py-1.5 border-gray-500 text-gray-500"
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

      {}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Monthly Hours
              </p>
              <p className="text-2xl font-semibold mt-2">
                {machinery.monthlyHours} hrs
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Monthly Cost
              </p>
              <p className="text-2xl font-semibold mt-2">
                {formatCurrency(machinery.monthlyCost)}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
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

      {}
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
