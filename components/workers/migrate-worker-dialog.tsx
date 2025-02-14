import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  projectId: string;
  location: string;
  clientName: string;
}

interface MigrateWorkerDialogProps {
  workerId: string;
  currentProjectId: string;
  projects: Project[];
  onMigrate: (targetProjectId: string) => Promise<{ success: boolean; error?: string }>;
  trigger?: React.ReactNode;
}

export function MigrateWorkerDialog({
  workerId,
  currentProjectId,
  projects,
  onMigrate,
  trigger
}: MigrateWorkerDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const availableProjects = projects.filter(p => p.id !== currentProjectId);

  const handleMigrate = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project to migrate to");
      return;
    }

    setIsLoading(true);
    try {
      const result = await onMigrate(selectedProjectId);
      if (result.success) {
        toast.success("Worker migrated successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to migrate worker");
      }
    } catch (error) {
      toast.error("An error occurred while migrating the worker");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Migrate Worker</DialogTitle>
          <DialogDescription>
            Select a project to migrate this worker to. This will mark the worker as inactive in the current project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project to migrate to" />
            </SelectTrigger>
            <SelectContent>
              {availableProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.location} - {project.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={!selectedProjectId || isLoading}
          >
            {isLoading ? "Migrating..." : "Migrate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 