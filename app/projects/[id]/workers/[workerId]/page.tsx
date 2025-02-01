import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, getInitials } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { WorkerDetails } from "./worker-details";

interface WorkerPageProps {
  params: {
    id: string;
    workerId: string;
  };
}

export const metadata: Metadata = {
  title: "Worker Details",
  description: "Details of the selected worker",
};

async function getWorkerDetails(projectId: string, workerId: string) {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      assignments: {
        where: { projectId },
        include: {
          project: true,
        },
      },
      attendance: {
        where: {
          projectId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(),
          },
        },
      },
      advances: {
        where: {
          projectId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(),
          },
        },
      },
    },
  });

  if (worker) {
    worker.attendance = worker.attendance.map((attendance) => ({
      ...attendance,
      date: new Date(attendance.date).toLocaleString(),
    }));

    worker.advances = worker.advances.map((advance) => ({
      ...advance,
      date: new Date(advance.date).toLocaleString(),
    }));
  }

  return worker;
}

export default async function WorkerPage({ params }: WorkerPageProps) {
  const { id: projectId, workerId } = params;
  const worker = await getWorkerDetails(projectId, workerId);

  if (!worker) {
    notFound();
  }

  return <WorkerDetails worker={worker} params={params} />;
}
