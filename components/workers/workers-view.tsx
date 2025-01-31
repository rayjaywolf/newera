"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

interface Worker {
  workerId: string;
  worker: {
    id: string;
    name: string;
    isActive: boolean;
    type: string;
    photoUrl?: string | null;
  };
  startDate: string;
  endDate: string | null;
}

interface WorkersViewProps {
  workers: Worker[];
  projectId: string;
}

export function WorkersView({ workers, projectId }: WorkersViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "grid"
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const setViewType = (newView: "grid" | "list") => {
    setView(newView);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              {view === "grid" ? (
                <LayoutGrid className="h-4 w-4 mr-2" />
              ) : (
                <List className="h-4 w-4 mr-2" />
              )}
              {view === "grid" ? "Grid View" : "List View"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewType("grid")}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewType("list")}>
              <List className="h-4 w-4 mr-2" />
              List View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((projectWorker) => (
            <Link
              key={projectWorker.workerId}
              href={`/projects/${projectId}/workers/${projectWorker.workerId}`}
              className="flex items-start gap-4 rounded-lg bg-white/[0.15] p-4 hover:bg-white/[0.25] transition border border-[rgba(0,0,0,0.08)]"
            >
              <Avatar className="h-12 w-12">
                {projectWorker.worker.photoUrl ? (
                  <AvatarImage 
                    src={projectWorker.worker.photoUrl} 
                    alt={projectWorker.worker.name} 
                  />
                ) : (
                  <AvatarFallback className="bg-black/[0.08] text-gray-500">
                    {getInitials(projectWorker.worker.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-lg">{projectWorker.worker.name}</p>
                    <p className="text-sm text-gray-500 capitalize mt-1">
                      {projectWorker.worker.type.toLowerCase().replace("_", " ")}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Since {formatDate(projectWorker.startDate)}
                    </p>
                    {projectWorker.endDate && (
                      <p className="text-sm text-gray-500">
                        Until {formatDate(projectWorker.endDate)}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-fit",
                      projectWorker.worker.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {projectWorker.worker.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white/[0.15]">
          <table className="min-w-full divide-y divide-[rgba(0,0,0,0.08)]">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Start Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  End Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
              {workers.map((projectWorker) => (
                <tr
                  key={projectWorker.workerId}
                  className="hover:bg-white/[0.25] transition cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/workers/${projectWorker.workerId}`
                    )
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {projectWorker.worker.photoUrl ? (
                          <AvatarImage 
                            src={projectWorker.worker.photoUrl} 
                            alt={projectWorker.worker.name} 
                          />
                        ) : (
                          <AvatarFallback className="bg-black/[0.08] text-gray-500">
                            {getInitials(projectWorker.worker.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-sm font-medium">
                        {projectWorker.worker.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 capitalize">
                      {projectWorker.worker.type.toLowerCase().replace("_", " ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(projectWorker.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {projectWorker.endDate ? formatDate(projectWorker.endDate) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-fit",
                        projectWorker.worker.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {projectWorker.worker.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
