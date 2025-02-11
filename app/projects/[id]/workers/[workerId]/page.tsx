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
  const worker = await prisma.worker.findUnique({
    where: { id: params.workerId },
    include: {
      assignments: {
        where: { projectId: params.id },
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          isActive: true,
          projectId: true,
          workerId: true,
        },
      },
      attendance: {
        where: {
          projectId: params.id,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ),
          },
        },
      },
      advances: {
        where: {
          projectId: params.id,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ),
          },
        },
      },
    },
  });

  if (!worker) {
    notFound();
  }

  const workerWithDates = {
    ...worker,
    createdAt: new Date(worker.createdAt),
    updatedAt: new Date(worker.updatedAt),
    assignments: worker.assignments.map((assignment) => ({
      ...assignment,
      startDate: new Date(assignment.startDate),
      endDate: assignment.endDate ? new Date(assignment.endDate) : null,
    })),
    attendance: worker.attendance.map((record) => ({
      ...record,
      date: new Date(record.date),
      createdAt: new Date(record.createdAt),
    })),
    advances: worker.advances.map((advance) => ({
      ...advance,
      date: new Date(advance.date),
      createdAt: new Date(advance.createdAt),
    })),
  };

  const projects = await prisma.project.findMany({
    where: {
      status: "ONGOING",
    },
    select: {
      id: true,
      projectId: true,
      location: true,
      clientName: true,
    },
  });

  return (
    <WorkerDetails
      worker={workerWithDates}
      params={params}
      projects={projects}
    />
  );
}
