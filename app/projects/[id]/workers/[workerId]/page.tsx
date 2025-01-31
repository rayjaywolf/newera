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
import { User, Clock, Wallet, Calendar, UserCheck, UserX, Percent } from "lucide-react";
import cn from "classnames";
import { AddAdvanceDialog } from "@/components/workers/add-advance-dialog";
import dynamic from "next/dynamic";

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

function getWorkingDaysInMonth(year: number, month: number): number {
  const date = new Date(year, month, 1);
  let workingDays = 0;
  
  while (date.getMonth() === month) {
    // Skip Sundays (0 is Sunday)
    if (date.getDay() !== 0) {
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }
  
  return workingDays;
}

export default async function WorkerPage({ params }: WorkerPageProps) {
  const { id: projectId, workerId } = params;

  const AttendanceHistoryWithFilter = dynamic(() => import("./attendance-history"), {
    ssr: false,
  });

  const worker = await getWorkerDetails(projectId, workerId);

  if (!worker) {
    notFound();
  }

  const currentMonthAttendance = worker.attendance;
  const currentMonthAdvances = worker.advances;

  // Calculate attendance statistics
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const totalWorkingDays = getWorkingDaysInMonth(currentYear, currentMonth);
  const daysPresent = currentMonthAttendance.length;
  const allowedHolidays = 4; // 4 Sundays per month
  const totalAbsents = Math.max(0, totalWorkingDays - daysPresent);
  const attendancePercentage = (daysPresent / totalWorkingDays) * 100;

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

      {/* Attendance Statistics Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <UserCheck className="h-5 w-5" />
            Attendance Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Working Days</span>
              </div>
              <p className="text-2xl font-semibold">{totalWorkingDays}</p>
              <p className="text-sm text-gray-500">This month</p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <UserCheck className="h-4 w-4" />
                <span>Days Present</span>
              </div>
              <p className="text-2xl font-semibold">{daysPresent}</p>
              <p className="text-sm text-gray-500">Out of {totalWorkingDays}</p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <UserX className="h-4 w-4" />
                <span>Days Absent</span>
              </div>
              <p className="text-2xl font-semibold">{totalAbsents}</p>
              <p className="text-sm text-gray-500">Excluding {allowedHolidays} holidays</p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <Percent className="h-4 w-4" />
                <span>Attendance Rate</span>
              </div>
              <p className="text-2xl font-semibold">{attendancePercentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Monthly average</p>
            </div>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Hours Worked</span>
              </div>
              <p className="text-2xl font-semibold">{totalHours.toFixed(1)}h</p>
              <p className="text-sm text-gray-500">
                Overtime: {totalOvertime.toFixed(1)}h
              </p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
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

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
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
        <AttendanceHistoryWithFilter 
          projectId={projectId}
          workerId={workerId}
          worker={worker}
          initialData={currentMonthAttendance}
        />
      </Card>
    </div>
  );
}
