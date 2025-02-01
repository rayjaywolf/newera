import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package2 } from "lucide-react";
import Link from "next/link";
import { MaterialsView } from "@/components/materials/materials-view";

interface MaterialsPageProps {
  params: {
    id: string;
  };
}

interface AggregatedMaterial {
  type: string;
  totalVolume: number;
  totalCost: number;
  lastUpdated: string;
  entries: number;
  costPerUnit?: number;
}

export async function generateMetadata({
  params,
}: MaterialsPageProps): Promise<Metadata> {
  const project = await getProject(params.id);
  if (!project) {
    return {
      title: "Project Not Found",
    };
  }
  return {
    title: `Materials - ${project.projectId} | New Era Construction`,
    description: `Materials in project ${project.projectId}`,
  };
}

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      materials: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!project) return null;

  // Aggregate materials by type
  const aggregatedMaterials = project.materials.reduce((acc, material) => {
    if (!acc[material.type]) {
      acc[material.type] = {
        type: material.type,
        totalVolume: 0,
        totalCost: 0,
        lastUpdated: material.date,
        entries: 0,
      };
    }

    acc[material.type].totalVolume += material.volume;
    acc[material.type].totalCost += material.cost;
    acc[material.type].entries += 1;

    // Keep the most recent date
    if (new Date(material.date) > new Date(acc[material.type].lastUpdated)) {
      acc[material.type].lastUpdated = material.date;
    }

    return acc;
  }, {} as Record<string, AggregatedMaterial>);

  const materialsArray = Object.values(aggregatedMaterials).map((material) => ({
    ...material,
    costPerUnit:
      material.totalVolume > 0 ? material.totalCost / material.totalVolume : 0,
  }));

  const totalStats = materialsArray.reduce(
    (acc, curr) => ({
      totalCost: acc.totalCost + curr.totalCost,
      totalEntries: acc.totalEntries + curr.entries,
      totalTypes: acc.totalTypes + 1,
    }),
    { totalCost: 0, totalEntries: 0, totalTypes: 0 }
  );

  const totalVolume = materialsArray.reduce(
    (acc, curr) => acc + curr.totalVolume,
    0
  );

  return {
    ...project,
    aggregatedMaterials: materialsArray,
    materialStats: totalStats,
    totalVolume,
  };
}

export default async function MaterialsPage({ params }: MaterialsPageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="p-8 space-y-8">
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package2 className="h-5 w-5" />
              Materials
            </CardTitle>
            {/* Hide button on mobile */}
            <Link
              href={`/projects/${params.id}/materials/add`}
              className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[#060606] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]"
            >
              <Plus className="h-4 w-4" />
              Add Material
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
                  }).format(project.materialStats.totalCost)}
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
                <p className="text-sm font-medium text-gray-500">
                  Total Volume
                </p>
                <p className="text-2xl font-semibold">
                  {project.totalVolume} units
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)]">
              <Package2 className="h-8 w-8 text-[#E65F2B]" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Material Types
                </p>
                <p className="text-2xl font-semibold">
                  {project.materialStats.totalTypes}
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
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                  <path d="M12 11h4" />
                  <path d="M12 16h4" />
                  <path d="M8 11h.01" />
                  <path d="M8 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Entries
                </p>
                <p className="text-2xl font-semibold">
                  {project.materialStats.totalEntries}
                </p>
              </div>
            </div>
          </div>
          {/* Mobile-only Add Material button */}
          <div className="sm:hidden mb-4">
            <Link
              href={`/projects/${params.id}/materials/add`}
              className="w-full inline-flex items-center gap-1 rounded-md bg-[#060606] px-3 py-2 -mt-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]"
            >
              <Plus className="h-4 w-4" />
              Add Material
            </Link>
          </div>
          {project.aggregatedMaterials.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No materials found in this project
              </p>
            </div>
          ) : (
            <MaterialsView
              materials={project.aggregatedMaterials}
              projectId={params.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
