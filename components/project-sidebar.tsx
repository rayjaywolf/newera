"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  Group,
  Package,
  Truck,
  Image,
  Users,
} from "lucide-react";

interface ProjectSidebarProps {
  projectId: string;
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
    icon: Users,
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
  {
    name: "Gallery",
    href: "/gallery",
    icon: Image,
  },
];

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-primary-text border-r border-[rgba(0,0,0,0.08)]">
      <nav className="flex flex-col h-full">
        <div className="space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === `/projects/${projectId}${item.href}`;
            const href = `/projects/${projectId}${item.href}`;

            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white text-primary-accent"
                    : "text-white hover:bg-gray-800"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary-accent" : "text-white"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
