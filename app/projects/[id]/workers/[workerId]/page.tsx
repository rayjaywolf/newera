import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Wallet, Calendar } from "lucide-react";
import cn from "classnames";

interface WorkerPageProps {
  params: {
    id: string;
    workerId: string;
  };
}

export const metadata: Metadata = {
  title: "Worker Details",
  description: "Details of the selected worker",
};

async function getWorkerDetails(projectId: string, workerId: string) {
  return await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      assignments: {
        where: { projectId },
        include: {
          project: true,
        },
      },
      attendance: {
        where: {
          projectId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(),
          },
        },
      },
      advances: {
        where: {
          projectId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(),
          },
        },
      },
    },
  });
}

export default async function WorkerPage({ params }: WorkerPageProps) {
  const { id: projectId, workerId } = params;
  const worker = await getWorkerDetails(projectId, workerId);

  if (!worker) {
    notFound();
  }

  const currentMonthAttendance = worker.attendance;
  const currentMonthAdvances = worker.advances;

  const daysPresent = currentMonthAttendance.length;
  const totalHours = currentMonthAttendance.reduce((acc, record) => acc + record.hoursWorked, 0);
  const totalOvertime = currentMonthAttendance.reduce((acc, record) => acc + record.overtime, 0);
  const monthlyEarnings = (totalHours + totalOvertime) * worker.hourlyRate;
  const monthlyAdvances = currentMonthAdvances.reduce((acc, advance) => acc + advance.amount, 0);

  return (
    <div className="p-8 space-y-8">
      {/* Worker Details Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <User className="h-7 w-7" />
                {worker.name}
              </CardTitle>
              <CardDescription className="text-lg mt-1 capitalize">
                {worker.type.toLowerCase().replace("_", " ")}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "px-4 py-1.5",
                worker.assignments.length > 0
                  ? "border-green-500 text-green-500"
                  : "border-gray-500 text-gray-500"
              )}
            >
              {worker.assignments.length > 0 ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-8 sm:grid-cols-3">
            <div>
              <dt className="font-medium text-gray-500 mb-1">Hourly Rate</dt>
              <dd className="text-lg">₹{worker.hourlyRate.toLocaleString()}/hr</dd>
            </div>
            {worker.assignments.length > 0 && (
              <>
                <div>
                  <dt className="font-medium text-gray-500 mb-1">Start Date</dt>
                  <dd className="text-lg">{formatDate(worker.assignments[0].startDate)}</dd>
                </div>
                {worker.assignments[0].endDate && (
                  <div>
                    <dt className="font-medium text-gray-500 mb-1">End Date</dt>
                    <dd className="text-lg">{formatDate(worker.assignments[0].endDate)}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Monthly Overview Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Days Present
              </p>
              <p className="text-2xl font-semibold mt-2">{daysPresent}</p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Total Hours
              </p>
              <p className="text-2xl font-semibold mt-2">{totalHours}</p>
              <p className="text-sm text-gray-500 mt-1">
                Regular: {totalHours - totalOvertime} | Overtime: {totalOvertime}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Monthly Earnings
              </p>
              <p className="text-2xl font-semibold mt-2">₹{monthlyEarnings.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/[0.15] p-4">
              <p className="font-medium text-gray-500 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Monthly Advances
              </p>
              <p className="text-2xl font-semibold mt-2">₹{monthlyAdvances.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Date</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Hours</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Overtime</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {currentMonthAttendance
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-white/[0.15]">
                    <td className="py-4 px-6">{formatDate(record.date)}</td>
                    <td className="py-4 px-6">{record.hoursWorked}</td>
                    <td className="py-4 px-6">{record.overtime}</td>
                    <td className="py-4 px-6">
                      ₹{((record.hoursWorked + record.overtime) * worker.hourlyRate).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
