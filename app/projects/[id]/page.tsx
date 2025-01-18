import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Package2, Truck, Plus } from "lucide-react";
import Link from "next/link";

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

async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      workers: {
        include: {
          worker: true,
        },
        orderBy: {
          startDate: "desc",
        },
      },
      materials: {
        orderBy: {
          date: "desc",
        },
        take: 5,
      },
      machinery: {
        orderBy: {
          date: "desc",
        },
        take: 5,
      },
    },
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-8 space-y-8">
      {/* Project Details Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold">
                {project.projectId}
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                {project.clientName}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "px-4 py-1.5",
                project.status === "ONGOING" && "border-[#E65F2B] text-[#E65F2B]",
                project.status === "COMPLETED" && "border-blue-500 text-blue-500",
                project.status === "SUSPENDED" && "border-orange-500 text-orange-500"
              )}
            >
              {project.status.toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-8 sm:grid-cols-3">
            <div>
              <dt className="font-medium text-gray-500 mb-1">Location</dt>
              <dd className="text-lg">{project.location}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 mb-1">Start Date</dt>
              <dd className="text-lg">{formatDate(project.startDate)}</dd>
            </div>
            {project.endDate && (
              <div>
                <dt className="font-medium text-gray-500 mb-1">End Date</dt>
                <dd className="text-lg">{formatDate(project.endDate)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Workers Card */}
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
                className="flex items-start justify-between rounded-lg bg-white/[0.15] p-4 hover:bg-white/[0.25] transition"
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

      {/* Materials Card */}
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
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200">
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
                    className="border-b border-gray-100 hover:bg-white/[0.15]"
                  >
                    <td className="py-4 px-4 capitalize">
                      {material.type.toLowerCase().replace("_", " ")}
                    </td>
                    <td className="py-4 px-4 text-center">{material.volume} units</td>
                    <td className="py-4 px-4 text-center">
                      ₹{material.cost.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">{formatDate(material.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Machinery Card */}
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
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200">
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
                    className="border-b border-gray-100 hover:bg-white/[0.15]"
                  >
                    <td className="py-4 px-4 capitalize">
                      {usage.type.toLowerCase()}{" "}
                      {usage.jcbSubtype &&
                        `- ${usage.jcbSubtype.toLowerCase().replace("_", " ")}`}
                      {usage.slmSubtype &&
                        `- ${usage.slmSubtype.toLowerCase().replace("_", " ")}`}
                    </td>
                    <td className="py-4 px-4 text-center">{usage.hoursUsed} hrs</td>
                    <td className="py-4 px-4 text-center">
                      ₹{usage.hourlyRate.toLocaleString()}/hr
                    </td>
                    <td className="py-4 px-4 text-center">
                      ₹{usage.totalCost.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">{formatDate(usage.date)}</td>
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
