"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "date-fns";
import cn from "classnames";
import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  projectId: string;
  location: string;
  clientName: string;
  startDate: string;
  endDate: string | null;
  status: "ONGOING" | "COMPLETED" | "SUSPENDED";
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "ONGOING":
        return "bg-green-500/10 text-green-500";
      case "COMPLETED":
        return "bg-blue-500/10 text-blue-500";
      case "SUSPENDED":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Projects</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-6">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button
          onClick={() => router.push('/projects/create')}
          className="bg-black text-white font-semibold hover:bg-white hover:text-primary-accent transition-colors"
        >
          Add Project
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="w-full hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <CardHeader className="pb-6">
              <div className="flex justify-between items-start gap-3">
                <CardTitle className="text-xl font-semibold">
                  {project.projectId}
                </CardTitle>
                <Badge 
                  className={cn(
                    getStatusColor(project.status),
                    "px-6 py-2"
                  )}
                >
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Client:</span>{" "}
                  {project.clientName}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Location:</span>{" "}
                  {project.location}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Started:</span>{" "}
                  {formatDistance(new Date(project.startDate), new Date(), {
                    addSuffix: true,
                  })}
                </p>
                {project.endDate && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Ended:</span>{" "}
                    {formatDistance(new Date(project.endDate), new Date(), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
