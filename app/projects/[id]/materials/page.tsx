import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return {
    ...project,
    aggregatedMaterials: Object.values(aggregatedMaterials),
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
          {project.aggregatedMaterials.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No materials found in this project</p>
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
