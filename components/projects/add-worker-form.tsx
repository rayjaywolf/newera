"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Worker, WorkerType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const workerSchema = z.object({
  workerId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(WorkerType),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  phoneNumber: z.string().optional(),
  photo: z.instanceof(File).optional(),
});

interface AddWorkerFormProps {
  projectId: string;
  existingWorkers: Worker[];
}

export default function AddWorkerForm({
  projectId,
  existingWorkers,
}: AddWorkerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isExistingWorker, setIsExistingWorker] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof workerSchema>>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: "",
      hourlyRate: "",
      phoneNumber: "",
    },
  });

  async function onSubmit(values: z.infer<typeof workerSchema>) {
    try {
      setLoading(true);

      let photoUrl: string | undefined;

      if (photoFile) {
        const filename = `${projectId}/${Date.now()}-${photoFile.name}`;
        const response = await fetch(
          `/api/uploadImage?filename=${encodeURIComponent(
            filename
          )}&id=${projectId}&type=worker`,
          {
            method: "POST",
            body: photoFile,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload photo');
        }

        const { url } = await response.json();
        photoUrl = url;
      }

      const response = await fetch(`/api/projects/${projectId}/workers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          hourlyRate: parseFloat(values.hourlyRate),
          isExisting: isExistingWorker,
          photoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add worker");
      }

      const { id: workerId } = await response.json();

      // Index the worker's face if photo was uploaded
      if (photoFile && workerId) {
        const faceFormData = new FormData();
        faceFormData.append('photo', photoFile);
        faceFormData.append('workerId', workerId);

        const faceResponse = await fetch('/api/workers/index-face', {
          method: 'POST',
          body: faceFormData,
        });

        if (!faceResponse.ok) {
          console.error('Failed to index face:', await faceResponse.text());
          toast.error('Worker added but face indexing failed');
          return;
        }

        const { faceId } = await faceResponse.json();
        
        // Update worker with faceId
        const updateResponse = await fetch(`/api/workers/${workerId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ faceId }),
        });

        if (!updateResponse.ok) {
          console.error('Failed to update worker with faceId');
          toast.error('Worker added but face ID update failed');
          return;
        }
      }

      toast.success("Worker added successfully");
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to add worker");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="inline-flex p-1 bg-black/10 rounded-lg">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "rounded-md transition-colors hover:bg-black hover:text-white",
              isExistingWorker && "bg-white text-primary-accent"
            )}
            onClick={() => setIsExistingWorker(true)}
          >
            Existing Worker
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "rounded-md transition-colors hover:bg-black hover:text-white",
              !isExistingWorker && "bg-white text-primary-accent"
            )}
            onClick={() => setIsExistingWorker(false)}
          >
            New Worker
          </Button>
        </div>

        {isExistingWorker ? (
          <FormField
            control={form.control}
            name="workerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Select Worker
                </FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-white/[0.15] border-0">
                      <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {existingWorkers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name} -{" "}
                        {worker.type.toLowerCase().replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter worker name"
                      className="bg-white/[0.15] border-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Type</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-white/[0.15] border-0">
                        <SelectValue placeholder="Select worker type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(WorkerType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.toLowerCase().replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Hourly Rate
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="bg-white/[0.15] border-0"
                      placeholder="Enter hourly rate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Phone Number (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white/[0.15] border-0"
                      placeholder="Enter phone number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Reference Photo (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPhotoFile(file);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </>
        )}
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          variant="ghost"
          className="bg-black text-white hover:bg-white hover:text-primary-accent transition-colors"
        >
          {loading ? "Adding..." : "Add Worker"}
        </Button>
      </form>
    </Form>
  );
}
