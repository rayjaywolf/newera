import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Truck } from "lucide-react";
import Link from "next/link";
import { MachineryView } from "@/components/machinery/machinery-view";

interface MachineryPageProps {
  params: {
    id: string;
  };
}

interface AggregatedMachinery {
  type: string;
  jcbSubtype: string | null;
  slmSubtype: string | null;
  totalHoursUsed: number;
  averageHourlyRate: number;
  totalCost: number;
  lastUpdated: string;
  entries: number;
}

export async function generateMetadata({
  params,
}: MachineryPageProps): Promise<Metadata> {
  const project = await getProject(params.id);
  if (!project) {
    return {
      title: "Project Not Found",
    };
  }
  return {
    title: `Machinery - ${project.projectId} | New Era Construction`,
    description: `Machinery in project ${project.projectId}`,
  };
}

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      machinery: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!project) return null;

  // Aggregate machinery by type and subtype
  const aggregatedMachinery = project.machinery.reduce((acc, machine) => {
    const key = `${machine.type}-${machine.jcbSubtype || ""}-${
      machine.slmSubtype || ""
    }`;

    if (!acc[key]) {
      acc[key] = {
        type: machine.type,
        jcbSubtype: machine.jcbSubtype,
        slmSubtype: machine.slmSubtype,
        totalHoursUsed: 0,
        totalCost: 0,
        totalRate: 0, // For calculating average
        lastUpdated: machine.date,
        entries: 0,
      };
    }

    acc[key].totalHoursUsed += machine.hoursUsed;
    acc[key].totalCost += machine.totalCost;
    acc[key].totalRate += machine.hourlyRate;
    acc[key].entries += 1;

    // Keep the most recent date
    if (new Date(machine.date) > new Date(acc[key].lastUpdated)) {
      acc[key].lastUpdated = machine.date;
    }

    return acc;
  }, {} as Record<string, any>);

  // Calculate average hourly rate and format the output
  const formattedMachinery = Object.values(aggregatedMachinery).map(
    (machine) => ({
      ...machine,
      averageHourlyRate: Math.round(machine.totalRate / machine.entries),
    })
  );

  // Calculate total stats
  const machineryStats = formattedMachinery.reduce(
    (acc, curr) => ({
      totalCost: acc.totalCost + curr.totalCost,
      totalHours: acc.totalHours + curr.totalHoursUsed,
      totalTypes: acc.totalTypes + 1,
      totalEntries: acc.totalEntries + curr.entries,
    }),
    { totalCost: 0, totalHours: 0, totalTypes: 0, totalEntries: 0 }
  );

  // Calculate overall average hourly rate
  machineryStats.averageHourlyRate =
    machineryStats.totalEntries > 0
      ? Math.round(
          formattedMachinery.reduce(
            (acc, curr) => acc + curr.averageHourlyRate * curr.entries,
            0
          ) / machineryStats.totalEntries
        )
      : 0;

  return {
    ...project,
    aggregatedMachinery: formattedMachinery,
    machineryStats,
  };
}

export default async function MachineryPage({ params }: MachineryPageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-5 w-5" />
              Machinery
            </CardTitle>
            <Link
              href={`/projects/${params.id}/machinery/add`}
              className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[#060606] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]"
            >
              <Plus className="h-4 w-4" />
              Add Machinery
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <div className="h-8 w-8 text-[#E65F2B] flex items-center justify-center text-2xl font-bold">
                ₹
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-2xl font-semibold">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(project.machineryStats.totalCost)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <div className="h-8 w-8 text-[#E65F2B] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <p className="text-2xl font-semibold">
                  {Math.round(project.machineryStats.totalHours)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <div className="h-8 w-8 text-[#E65F2B] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Avg Rate/Hour
                </p>
                <p className="text-2xl font-semibold">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(project.machineryStats.averageHourlyRate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <Truck className="h-8 w-8 text-[#E65F2B]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Types Used</p>
                <p className="text-2xl font-semibold">
                  {project.machineryStats.totalTypes}
                </p>
              </div>
            </div>
          </div>
          <div className="sm:hidden mb-4">
            <Link
              href={`/projects/${params.id}/machinery/add`}
              className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-[#060606] px-3 py-2 -mt-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]"
            >
              <Plus className="h-4 w-4" />
              Add Machinery
            </Link>
          </div>
          {project.aggregatedMachinery.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No machinery found in this project
              </p>
            </div>
          ) : (
            <MachineryView
              machinery={project.aggregatedMachinery}
              projectId={params.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
