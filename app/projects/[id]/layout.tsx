"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Calendar, Group, Package, Truck } from "lucide-react";
import { ProjectSidebar } from "@/components/project-sidebar";
import { ProjectHeader } from "@/components/header";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

const navigation = [
  {
    name: "Overview",
    href: "",
    icon: BarChart3,
  },
  {
    name: "Attendance",
    href: "/attendance",
    icon: Calendar,
  },
  {
    name: "Workers",
    href: "/workers",
    icon: Group,
  },
  {
    name: "Materials",
    href: "/materials",
    icon: Package,
  },
  {
    name: "Machinery",
    href: "/machinery",
    icon: Truck,
  },
];

export default function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const pathname = usePathname();
  const projectId = params.id;

  return (
    <div className="flex h-screen">
      <ProjectSidebar projectId={params.id} />
      <div className="flex-1 overflow-auto">
        <div className="flex-col">
          <ProjectHeader />
          {children}
        </div>
      </div>
    </div>
  );
}
