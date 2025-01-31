import AddProjectForm from "@/components/projects/add-project-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateProjectPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Create New Project</h2>
        </div>
        <div className="grid gap-4">
          <div className="space-y-4">
            <AddProjectForm />
          </div>
        </div>
      </div>
    </div>
  );
} 