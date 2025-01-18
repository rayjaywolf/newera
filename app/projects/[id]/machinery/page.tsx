import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const formattedMachinery = Object.values(aggregatedMachinery).map((machine) => ({
    ...machine,
    averageHourlyRate: Math.round(machine.totalRate / machine.entries),
  }));

  return {
    ...project,
    aggregatedMachinery: formattedMachinery,
  };
}

export default async function MachineryPage({ params }: MachineryPageProps) {
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
          {project.aggregatedMachinery.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No machinery found in this project</p>
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
