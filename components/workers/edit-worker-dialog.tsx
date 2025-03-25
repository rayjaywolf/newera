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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { WorkerType } from "@prisma/client";

interface EditWorkerDialogProps {
  worker: {
    id: string;
    name: string;
    type: string;
    hourlyRate: number;
    phoneNumber: string | null;
  };
  trigger?: React.ReactNode;
}

export function EditWorkerDialog({
  worker,
  trigger
}: EditWorkerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(worker.name);
  const [type, setType] = useState(worker.type);
  const [hourlyRate, setHourlyRate] = useState(worker.hourlyRate?.toString() || "0");
  const [phoneNumber, setPhoneNumber] = useState(worker.phoneNumber || "");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workers/${worker.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type,
          hourlyRate: parseFloat(hourlyRate),
          phoneNumber: phoneNumber || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update worker");
      }

      toast.success("Worker updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating worker:", error);
      toast.error("Failed to update worker");
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Worker</DialogTitle>
            <DialogDescription>
              Update the worker's details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={type}
                onValueChange={setType}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select worker type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(WorkerType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toLowerCase().replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourlyRate" className="text-right">
                Hourly Rate
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="col-span-3"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                Phone
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 