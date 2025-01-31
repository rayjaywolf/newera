import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import AddWorkerForm from "@/components/projects/add-worker-form";

interface AddWorkerPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: "Add Worker | New Era Construction",
  description: "Add a worker to the project",
};

async function getExistingWorkers() {
  return await prisma.worker.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export default async function AddWorkerPage({ params }: AddWorkerPageProps) {
  const existingWorkers = await getExistingWorkers();

  return (
    <div className="p-8 space-y-8">
      <Card className="bg-white/[0.34] border-[rgb(0,0,0,0.08)] shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle className="text-2xl font-bold">Add Worker</CardTitle>
          </div>
          <CardDescription>
            Add a new worker or assign an existing worker to the project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddWorkerForm
            projectId={params.id}
            existingWorkers={existingWorkers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
