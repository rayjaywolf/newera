import { prisma } from "@/lib/prisma";
import { Search, Users, Package2, Truck } from "lucide-react";
import { Suspense } from "react";
import {
  MaterialType,
  MachineryType,
  JCBSubtype,
  SLMSubtype,
} from "@prisma/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function isValidEnum<T extends { [key: string]: string }>(
  enumObj: T,
  value: string
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

async function SearchResults({
  query,
  projectId,
}: {
  query: string;
  projectId: string;
}) {
  const upperQuery = query.toUpperCase();

  const [
    projectResults,
    workerResults,
    materialUsageResults,
    machineryUsageResults,
  ] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          { clientName: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
          { projectId: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        workers: {
          include: {
            worker: true,
          },
        },
        machinery: true,
        materials: true,
      },
    }),
    prisma.worker.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        assignments: {
          include: {
            project: true,
          },
        },
      },
    }),

    prisma.materialUsage.findMany({
      where: {
        OR: [
          {
            type: {
              in: Object.values(MaterialType).filter((type) =>
                type.toLowerCase().includes(query.toLowerCase())
              ),
            },
          },

          ...(isValidEnum(MaterialType, upperQuery)
            ? [
                {
                  type: upperQuery as MaterialType,
                },
              ]
            : []),
        ],
      },
      include: {
        project: true,
      },
    }),

    prisma.machineryUsage.findMany({
      where: {
        OR: [
          {
            type: {
              in: Object.values(MachineryType).filter((type) =>
                type.toLowerCase().includes(query.toLowerCase())
              ),
            },
          },

          {
            jcbSubtype: {
              in: Object.values(JCBSubtype).filter((type) =>
                type.toLowerCase().includes(query.toLowerCase())
              ),
            },
          },

          {
            slmSubtype: {
              in: Object.values(SLMSubtype).filter((type) =>
                type.toLowerCase().includes(query.toLowerCase())
              ),
            },
          },

          ...(isValidEnum(MachineryType, upperQuery)
            ? [
                {
                  type: upperQuery as MachineryType,
                },
              ]
            : []),
          ...(isValidEnum(JCBSubtype, upperQuery)
            ? [
                {
                  jcbSubtype: upperQuery as JCBSubtype,
                },
              ]
            : []),
          ...(isValidEnum(SLMSubtype, upperQuery)
            ? [
                {
                  slmSubtype: upperQuery as SLMSubtype,
                },
              ]
            : []),
        ],
      },
      include: {
        project: true,
      },
    }),
  ]);

  if (
    projectResults.length === 0 &&
    workerResults.length === 0 &&
    materialUsageResults.length === 0 &&
    machineryUsageResults.length === 0
  ) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">
          No results found for &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {workerResults.length > 0 && (
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5" />
              Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
              {workerResults.map((worker) => (
                <Link
                  key={worker.id}
                  href={`/projects/${projectId}/workers/${worker.id}`}
                  className="flex items-start justify-between rounded-lg border border-[rgb(0,0,0,0.08)] bg-white/[0.15] p-4 hover:bg-white/[0.25] transition"
                >
                  <div>
                    <p className="font-medium text-lg">{worker.name}</p>
                    <p className="text-sm text-gray-500 capitalize mt-1">
                      {worker.type.toLowerCase().replace("_", " ")}
                    </p>
                    {worker.phoneNumber && (
                      <p className="text-sm text-gray-500 mt-1">
                        Phone: {worker.phoneNumber}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Rate: ₹{worker.hourlyRate}/hr
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-fit",
                      worker.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {worker.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {materialUsageResults.length > 0 && (
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package2 className="h-5 w-5" />
              Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {materialUsageResults.map((usage) => (
                <Link
                  key={usage.id}
                  href={`/projects/${projectId}/materials/${usage.type.toLowerCase()}`}
                  className="flex flex-col rounded-lg bg-white/[0.15] p-4 hover:bg-white/[0.25] transition border border-[rgb(0,0,0,0.08)]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-lg capitalize">
                        {usage.type.toLowerCase().replace("_", " ")}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Volume: {usage.volume}
                      </p>
                      <p className="text-sm text-gray-500">
                        Cost: ₹{usage.cost}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      {new Date(usage.date).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[rgba(0,0,0,0.08)]">
                    <p className="text-sm text-gray-500">
                      Project: {usage.project.clientName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {machineryUsageResults.length > 0 && (
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-5 w-5" />
              Machinery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {machineryUsageResults.map((usage) => {
                const machineryType = [
                  usage.type.toLowerCase(),
                  usage.jcbSubtype
                    ? `subtype_${usage.jcbSubtype.toLowerCase()}`
                    : null,
                  usage.slmSubtype
                    ? `subtype_${usage.slmSubtype.toLowerCase()}`
                    : null,
                ]
                  .filter(Boolean)
                  .join("_");

                return (
                  <Link
                    key={usage.id}
                    href={`/projects/${projectId}/machinery/${encodeURIComponent(
                      machineryType
                    )}`}
                    className="flex flex-col rounded-lg bg-white/[0.15] p-4 hover:bg-white/[0.25] transition border border-[rgb(0,0,0,0.08)]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-lg">
                          {usage.type}
                          {usage.jcbSubtype && ` - ${usage.jcbSubtype}`}
                          {usage.slmSubtype && ` - ${usage.slmSubtype}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Hours: {usage.hoursUsed}
                        </p>
                        <p className="text-sm text-gray-500">
                          Rate: ₹{usage.hourlyRate}/hr
                        </p>
                        <p className="text-sm text-gray-500">
                          Total: ₹{usage.totalCost}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                      >
                        {new Date(usage.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[rgba(0,0,0,0.08)]">
                      <p className="text-sm text-gray-500">
                        Project: {usage.project.clientName}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {projectResults.length > 0 && (
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projectResults.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex flex-col rounded-lg bg-white/[0.15] p-4 hover:bg-white/[0.25] transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-lg">
                        {project.clientName}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {project.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {project.projectId}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2 py-1",
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
                  <div className="mt-2 pt-2 border-t border-[rgba(0,0,0,0.08)]">
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-500">
                      <div>
                        <p>Workers</p>
                        <p className="font-medium">{project.workers.length}</p>
                      </div>
                      <div>
                        <p>Materials</p>
                        <p className="font-medium">
                          {project.materials.length}
                        </p>
                      </div>
                      <div>
                        <p>Machinery</p>
                        <p className="font-medium">
                          {project.machinery.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
  params,
}: {
  searchParams: { q: string };
  params: { id: string };
}) {
  const query = searchParams.q || "";

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex items-center gap-2 mb-8">
        <Search className="h-5 w-5 text-gray-400" />
        <h1 className="text-2xl font-semibold">
          Search Results for &quot;{query}&quot;
        </h1>
      </div>

      <Suspense
        fallback={
          <div className="text-center py-10">
            <p className="text-gray-500">Loading results...</p>
          </div>
        }
      >
        <SearchResults query={query} projectId={params.id} />
      </Suspense>
    </div>
  );
}
