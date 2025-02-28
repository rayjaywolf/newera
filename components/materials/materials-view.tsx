"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MaterialType } from "@prisma/client";

interface Material {
  type: string;
  totalVolume: number;
  totalCost: number;
  lastUpdated: string;
  entries: number;
  costPerUnit: number;
}

interface MaterialsViewProps {
  materials: Material[];
  projectId: string;
}

export function MaterialsView({ materials, projectId }: MaterialsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "list"
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const setViewType = (newView: "grid" | "list") => {
    setView(newView);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`?${params.toString()}`);
  };

  console.log(
    "Material Types:",
    materials.map((material) => material.type)
  );

  const unitMapping: Record<MaterialType, string> = {
    STEEL: "kg",
    CEMENT: "bags",
    WASHING_SAND: "cubic ft",
    FINE_SAND: "cubic ft",
    GRIT_10MM: "cubic ft",
    GRIT_20MM: "cubic ft",
    GRIT_40MM: "cubic ft",
    BRICK: "units",
    STONE: "cubic ft",
    WATER: "litre",
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
          {materials.map((material) => (
            <Link
              href={`/projects/${projectId}/materials/${encodeURIComponent(
                material.type.toLowerCase()
              )}`}
              key={material.type}
              className="rounded-lg bg-white/[0.15] p-4 border border-[rgba(0,0,0,0.08)] hover:bg-white/[0.25] transition-colors"
            >
              <div className="flex flex-col">
                <h3 className="font-medium text-lg capitalize">
                  {material.type.toLowerCase().replace("_", " ")}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-500">
                    Total Volume: {material.totalVolume}{" "}
                    {unitMapping[material.type] || "units"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Cost per Unit: {formatCurrency(material.costPerUnit)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total Cost: {formatCurrency(material.totalCost)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Number of Entries: {material.entries}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last Updated: {formatDate(material.lastUpdated)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[rgba(0,0,0,0.08)] bg-white/[0.15]">
          <table className="w-full divide-y divide-[rgba(0,0,0,0.08)]">
            <thead>
              <tr>
                <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Type
                </th>
                <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Total Volume
                </th>
                <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Total Cost
                </th>
                <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                  Entries
                </th>
                <th className="px-4 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
              {materials.map((material) => (
                <tr
                  key={material.type}
                  className="hover:bg-white/[0.25] transition cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/materials/${encodeURIComponent(
                        material.type.toLowerCase()
                      )}`
                    )
                  }
                >
                  <td className="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-medium capitalize">
                      {material.type.toLowerCase().replace("_", " ")}
                    </div>
                  </td>
                  <td className="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {material.totalVolume}{" "}
                    {unitMapping[material.type] || "units"}
                  </td>
                  <td className="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {formatCurrency(material.totalCost)}
                  </td>
                  <td className="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {material.entries}
                  </td>
                  <td className="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatDate(material.lastUpdated)}
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
