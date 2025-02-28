import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { WorkersView } from "@/components/workers/workers-view";

interface WorkersPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: WorkersPageProps): Promise<Metadata> {
  const project = await getProject(params.id);
  if (!project) {
    return {
      title: "Project Not Found",
    };
  }
  return {
    title: `Workers - ${project.projectId} | New Era Construction`,
    description: `Workers in project ${project.projectId}`,
  };
}

async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      workers: {
        where: {},
        select: {
          id: true,
          workerId: true,
          startDate: true,
          endDate: true,
          isActive: true,
          worker: {
            select: {
              id: true,
              name: true,
              type: true,
              photoUrl: true,
            },
          },
        },
        orderBy: [
          {
            isActive: "desc",
          },
          {
            startDate: "desc",
          },
        ],
      },
    },
  });
}

export default async function WorkersPage({ params }: WorkersPageProps) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  // Transform the data to match the expected format
  const workersData = project.workers.map((assignment) => ({
    workerId: assignment.workerId,
    worker: {
      ...assignment.worker,
    },
    isActive: assignment.isActive,
    startDate: assignment.startDate.toISOString(),
    endDate: assignment.endDate?.toISOString() || null,
  }));

  return (
    <div className="p-4 sm:p-8 space-y-8">
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
          {project.workers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No workers found in this project</p>
            </div>
          ) : (
            <WorkersView workers={workersData} projectId={params.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
