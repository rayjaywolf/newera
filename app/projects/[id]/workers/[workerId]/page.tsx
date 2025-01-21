import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Wallet, Calendar } from "lucide-react";
import cn from "classnames";
import { AddAdvanceDialog } from "@/components/workers/add-advance-dialog";

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
  const totalHours = currentMonthAttendance.reduce(
    (acc, record) => acc + record.hoursWorked,
    0
  );
  const totalOvertime = currentMonthAttendance.reduce(
    (acc, record) => acc + record.overtime,
    0
  );
  const monthlyEarnings = (totalHours + totalOvertime) * worker.hourlyRate;
  const monthlyAdvances = currentMonthAdvances.reduce(
    (acc, advance) => acc + advance.amount,
    0
  );
  const remainingBalance = monthlyEarnings - monthlyAdvances;

  const refreshData = async () => {
    "use server";
    revalidatePath(`/projects/${projectId}/workers/${workerId}`);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Worker Details Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <User className="h-7 w-7" />
                {worker.name}
              </CardTitle>
              <CardDescription className="text-lg">
                {worker.type.toLowerCase().replace("_", " ")}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "px-6 py-2",
                worker.assignments.length > 0
                  ? "border-[#E65F2B] text-[#E65F2B]"
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
              <dd className="text-lg">
                ₹{worker.hourlyRate.toLocaleString()}/hr
              </dd>
            </div>
            {worker.assignments.length > 0 && (
              <>
                <div>
                  <dt className="font-medium text-gray-500 mb-1">Start Date</dt>
                  <dd className="text-lg">
                    {formatDate(worker.assignments[0].startDate)}
                  </dd>
                </div>
                {worker.assignments[0].endDate && (
                  <div>
                    <dt className="font-medium text-gray-500 mb-1">End Date</dt>
                    <dd className="text-lg">
                      {formatDate(worker.assignments[0].endDate)}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Earnings and Advances Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Wallet className="h-5 w-5" />
              Earnings and Advances
            </CardTitle>
            <AddAdvanceDialog
              workerId={workerId}
              projectId={projectId}
              onAdvanceAdded={refreshData}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3">
              <div className="flex items-center gap-3 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Hours Worked</span>
              </div>
              <p className="text-2xl font-semibold">{totalHours.toFixed(1)}h</p>
              <p className="text-sm text-gray-500">
                Overtime: {totalOvertime.toFixed(1)}h
              </p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3">
              <div className="flex items-center gap-3 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Days Present</span>
              </div>
              <p className="text-2xl font-semibold">{daysPresent} days</p>
              <p className="text-sm text-gray-500">This month</p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3">
              <div className="flex items-center gap-3 text-gray-500">
                <Wallet className="h-4 w-4" />
                <span>Monthly Earnings</span>
              </div>
              <p className="text-2xl font-semibold">
                {monthlyEarnings % 1 === 0
                  ? `₹${monthlyEarnings.toFixed(0)}`
                  : `₹${monthlyEarnings.toFixed(2)}`}
              </p>
              <p className="text-sm text-gray-500">
                Rate: ₹{worker.hourlyRate}/hour
              </p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3">
              <div className="flex items-center gap-3 text-gray-500">
                <Wallet className="h-4 w-4" />
                <span>Advances</span>
              </div>
              <p className="text-2xl font-semibold">
                {monthlyAdvances % 1 === 0
                  ? `₹${monthlyAdvances.toFixed(0)}`
                  : `₹${monthlyAdvances.toFixed(2)}`}
              </p>
              <p className="text-sm text-gray-500">
                Balance: {remainingBalance % 1 === 0
                  ? `₹${remainingBalance.toFixed(0)}`
                  : `₹${remainingBalance.toFixed(2)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Calendar className="h-5 w-5" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgb(0,0,0,0.08)]">
                  <th className="text-left py-4 px-6 font-medium text-gray-500 w-1/4">
                    Date
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-gray-500 w-1/4">
                    Hours
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-gray-500 w-1/4">
                    Overtime
                  </th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500 w-1/4">
                    Earnings
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentMonthAttendance
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-[rgb(0,0,0,0.08)] hover:bg-white/[0.15]"
                    >
                      <td className="py-4 px-6 text-left">{formatDate(record.date)}</td>
                      <td className="py-4 px-6 text-center">{record.hoursWorked}</td>
                      <td className="py-4 px-6 text-center">{record.overtime}</td>
                      <td className="py-4 px-6 text-right">
                        ₹
                        {(
                          (record.hoursWorked + record.overtime) *
                          worker.hourlyRate
                        ).toLocaleString()}
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
