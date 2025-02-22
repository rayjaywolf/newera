import Link from "next/link";
import {
  Users,
  CalendarCheck2,
  Truck,
  Construction,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

async function getAdminStats() {
  const [totalWorkers, todayAttendance] = await Promise.all([
    prisma.adminWorker.count({
      where: { isActive: true },
    }),
    prisma.adminAttendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        present: true,
      },
    }),
  ]);

  return {
    totalWorkers,
    todayAttendance,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const adminSections = [
    {
      title: "Workers",
      description: "Manage engineers, drivers, and operators",
      icon: Users,
      href: "/admin/workers",
      stats: `${stats.totalWorkers} active workers`,
    },
    {
      title: "Attendance",
      description: "Mark and view daily attendance",
      icon: CalendarCheck2,
      href: "/admin/attendance",
      stats: `${stats.todayAttendance} present today`,
    },
    {
      title: "Machinery",
      description: "Track machinery usage and maintenance",
      icon: Construction,
      href: "/admin/machinery",
      stats: "Coming soon",
    },
    {
      title: "Transport",
      description: "Manage vehicle assignments and trips",
      icon: Truck,
      href: "/admin/transport",
      stats: "Coming soon",
    },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">{format(new Date(), "PPP")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminSections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="hover:bg-white/[0.15] transition-colors border-0 bg-white/[0.08] cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  {section.title}
                </CardTitle>
                <section.icon className="h-5 w-5 text-[#E65F2B]" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{section.description}</p>
                <p className="text-sm font-medium mt-2">{section.stats}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-white/[0.08] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 text-sm text-gray-500"
              >
                <Clock className="h-4 w-4" />
                <span>Activity details will be added soon</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
