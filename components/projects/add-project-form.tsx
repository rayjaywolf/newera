"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ProjectStatus } from "@prisma/client";
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
import { Card } from "@/components/ui/card";

// Function to generate a short, readable ID
function generateShortId() {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36
  const randomStr = Math.random().toString(36).substring(2, 5); // Get 3 random chars
  return `${timestamp.slice(-4)}${randomStr}`.toUpperCase(); // Combine last 4 chars of timestamp with random string
}

const projectSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  location: z.string().min(1, "Location is required"),
  clientName: z.string().min(1, "Client name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ONGOING),
});

export default function AddProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectId: "",
      location: "",
      clientName: "",
      startDate: new Date().toISOString().split('T')[0],
      status: ProjectStatus.ONGOING,
    },
  });

  async function onSubmit(values: z.infer<typeof projectSchema>) {
    try {
      setLoading(true);

      const shortId = generateShortId();

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          id: shortId, // Add the generated short ID
          startDate: new Date(values.startDate),
          endDate: values.endDate ? new Date(values.endDate) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      toast.success('Project created successfully');
      router.push('/projects');
      router.refresh();
    } catch (error) {
      toast.error('Failed to create project');
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 space-y-4 bg-white/[0.34] border-[rgb(0,0,0,0.08)] shadow-none">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Project ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter project ID"
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter project location"
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
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Client Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter client name"
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/[0.15] border-0">
                        <SelectValue placeholder="Select project status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ProjectStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.toLowerCase().replace("_", " ")}
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
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
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
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-white/[0.15] border-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              variant="ghost"
              className="bg-black text-white font-semibold hover:bg-white hover:text-primary-accent transition-colors"
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
} 