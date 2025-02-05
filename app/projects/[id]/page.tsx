import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateNumeric, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Package2, Truck, Plus, ChartColumn } from "lucide-react";
import Link from "next/link";
import { checkRole } from "@/utils/roles";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";

const StatsSection = dynamic(() => import("@/components/stats-section"), {
  ssr: false,
});

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const project = await getProject(params.id);
  if (!project) {
    return {
      title: "Project Not Found",
    };
  }
  return {
    title: `${project.projectId} | New Era Construction`,
    description: `Project details for ${project.projectId}`,
  };
}

// Update the getProject function to include payment records
async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      workers: {
        where: {
          worker: {
            isActive: true,
          },
        },
        include: {
          worker: true,
        },
        orderBy: {
          startDate: "desc",
        },
      },
      attendance: {
        include: {
          worker: true,
        },
      },
      materials: {
        orderBy: {
          date: "desc",
        },
      },
      machinery: {
        orderBy: {
          date: "desc",
        },
      },
      advances: true,
    },
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  const isAdmin = await checkRole("admin");

  // Update the labor cost calculation to use project.attendance
  const totalLaborCost = project.attendance.reduce((total, record) => {
    const worker = project.workers.find(
      (w) => w.worker.id === record.workerId
    )?.worker;

    if (!worker) return total;

    const regularHoursCost = record.hoursWorked * worker.hourlyRate;
    const overtimeCost = record.overtime * (worker.hourlyRate * 1.5); // Overtime at 1.5x rate

    return total + regularHoursCost + overtimeCost;
  }, 0);

  // Calculate total advances
  const totalAdvances = project.advances.reduce((total, advance) => {
    return total + advance.amount;
  }, 0);

  // Final labor cost is total worked hours minus advances
  const finalLaborCost = totalLaborCost - totalAdvances;

  const totalMaterialCost = project.materials.reduce(
    (total, material) => total + material.cost,
    0
  );

  const totalMachineryCost = project.machinery.reduce(
    (total, machine) => total + machine.totalCost,
    0
  );

  // Update the total project cost calculation
  const totalProjectCost =
    finalLaborCost + totalMaterialCost + totalMachineryCost;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold">
                {project.projectId}
              </CardTitle>
              <CardDescription className="text-base md:text-lg mt-1">
                {project.clientName}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "px-4 py-1.5",
                project.status === "ONGOING" &&
                  "border-[#E65F2B] text-[#E65F2B]",
                project.status === "COMPLETED" &&
                  "border-blue-500 text-blue-500",
                project.status === "SUSPENDED" &&
                  "border-orange-500 text-orange-500"
              )}
            >
              {project.status.toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p className="mt-1 text-lg font-medium">{project.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p className="mt-1 text-lg font-medium">
                {formatDateNumeric(project.startDate)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p className="mt-1 text-lg font-medium">
                {project.endDate ? formatDate(project.endDate) : "-"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Duration</h3>
              <p className="mt-1 text-lg font-medium">
                {project.endDate
                  ? `${Math.ceil(
                      (new Date(project.endDate).getTime() -
                        new Date(project.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days`
                  : `${Math.ceil(
                      (new Date().getTime() -
                        new Date(project.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days`}
              </p>
            </div>
          </div>

          <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <svg
                className="h-8 w-8 text-[#E65F2B]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-2xl font-semibold">
                  ₹{totalProjectCost.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Project expenses</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Labor Cost</p>
                <p className="text-2xl font-semibold">
                  ₹{finalLaborCost.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalLaborCost > 0 &&
                    `${Math.round(
                      (finalLaborCost / totalProjectCost) * 100
                    )}% of total`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <Package2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Materials Cost
                </p>
                <p className="text-2xl font-semibold">
                  ₹{totalMaterialCost.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalMaterialCost > 0 &&
                    `${Math.round(
                      (totalMaterialCost / totalProjectCost) * 100
                    )}% of total`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <Truck className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Machinery Cost
                </p>
                <p className="text-2xl font-semibold">
                  ₹{totalMachineryCost.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalMachineryCost > 0 &&
                    `${Math.round(
                      (totalMachineryCost / totalProjectCost) * 100
                    )}% of total`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <Users className="h-8 w-8 text-[#E65F2B]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Workers</p>
                <p className="text-2xl font-semibold">
                  {project.workers.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Currently assigned</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-500">Advances</p>
                <p className="text-2xl font-semibold">
                  ₹{totalAdvances.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total paid out</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ChartColumn className="h-5 w-5" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatsSection projectId={params.id} />
        </CardContent>
      </Card>

      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5" />
              Workers
            </CardTitle>
            <Link
              href={`/projects/${params.id}/workers/add`}
              className="inline-flex items-center gap-1 rounded-md bg-[#060606] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]"
            >
              <Plus className="h-4 w-4" />
              Add Worker
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.workers.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/projects/${params.id}/workers/${assignment.worker.id}`}
                className="flex items-start justify-between rounded-lg bg-white/[0.15] p-4 hover:bg-white/[0.25] transition border border-[rgba(0,0,0,0.08)]"
              >
                <div>
                  <p className="font-medium text-lg">
                    {assignment.worker.name}
                  </p>
                  <p className="text-sm text-gray-500 capitalize mt-1">
                    {assignment.worker.type.toLowerCase().replace("_", " ")}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Since {formatDate(assignment.startDate)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Rate: ₹{assignment.worker.hourlyRate}/hr
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-fit",
                    assignment.worker.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {assignment.worker.isActive ? "Active" : "Inactive"}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package2 className="h-5 w-5" />
              Materials
            </CardTitle>
            <Link
              href={`/projects/${params.id}/materials/add`}
              className="inline-flex items-center gap-1 rounded-md bg-[#060606] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]"
            >
              <Plus className="h-4 w-4" />
              Add Material
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[640px] table-fixed">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.08)]">
                  <th className="text-left py-4 px-4 font-medium text-gray-500 w-1/4">
                    Material
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-500 w-1/4 text-center">
                    Volume
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-500 w-1/4 text-center">
                    Cost
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-500 text-right w-1/4">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody>
                {project.materials.map((material) => (
                  <tr
                    key={material.id}
                    className="border-b border-[rgba(0,0,0,0.08)] hover:bg-white/[0.15]"
                  >
                    <td className="py-4 px-4 capitalize">
                      {material.type.toLowerCase().replace("_", " ")}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {material.volume} units
                    </td>
                    <td className="py-4 px-4 text-center">
                      ₹{material.cost.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {formatDate(material.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-5 w-5" />
              Machinery
            </CardTitle>
            <Link
              href={`/projects/${params.id}/machinery/add`}
              className="inline-flex items-center gap-1 rounded-md bg-[#060606] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]"
            >
              <Plus className="h-4 w-4" />
              Add Machinery
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[640px] table-fixed">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.08)]">
                  <th className="text-left py-4 px-4 font-medium text-gray-500 w-1/4">
                    Machinery
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-500 w-1/4 text-center">
                    Hours Used
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-500 w-1/4 text-center">
                    Rate
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-gray-500 w-1/4">
                    Total Cost
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-500 text-right w-1/4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {project.machinery.map((usage) => (
                  <tr
                    key={usage.id}
                    className="border-b border-[rgba(0,0,0,0.08)] hover:bg-white/[0.15]"
                  >
                    <td className="py-4 px-4 capitalize">
                      {usage.type.toLowerCase()}{" "}
                      {usage.jcbSubtype &&
                        `- ${usage.jcbSubtype.toLowerCase().replace("_", " ")}`}
                      {usage.slmSubtype &&
                        `- ${usage.slmSubtype.toLowerCase().replace("_", " ")}`}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {usage.hoursUsed} hrs
                    </td>
                    <td className="py-4 px-4 text-center">
                      ₹{usage.hourlyRate.toLocaleString()}/hr
                    </td>
                    <td className="py-4 px-4 text-center">
                      ₹{usage.totalCost.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {formatDate(usage.date)}
                    </td>
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
