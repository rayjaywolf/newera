"use client";

import { useRouter } from "next/navigation";
import { markWorkerInactive } from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate, getInitials } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Wallet,
  Calendar,
  UserCheck,
  UserX,
  Percent,
} from "lucide-react";
import cn from "classnames";
import { AddAdvanceDialog } from "@/components/workers/add-advance-dialog";
import { UploadPhotoDialog } from "@/components/workers/upload-photo-dialog";
import dynamic from "next/dynamic";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

interface WorkerDetailsProps {
  worker: any; // Replace with proper type
  params: {
    id: string;
    workerId: string;
  };
}

/**
 * Returns the number of working days between two dates (inclusive)
 * by skipping Sundays.
 */
function getWorkingDays(start: Date, end: Date): number {
  let workingDays = 0;
  const date = new Date(start);
  while (date <= end) {
    // Exclude Sundays (0 represents Sunday)
    if (date.getDay() !== 0) {
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }
  return workingDays;
}

export function WorkerDetails({ worker, params }: WorkerDetailsProps) {
  const router = useRouter();
  const { id: projectId, workerId } = params;
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleMarkInactive = async () => {
    setDialogOpen(true);
  };

  const handleConfirmMarkInactive = async () => {
    const result = await markWorkerInactive(workerId, projectId);
    if (result.success) {
      toast.success("Worker marked as inactive");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to mark worker as inactive");
    }
  };

  const AttendanceHistoryWithFilter = dynamic(
    () => import("./attendance-history"),
    { ssr: false }
  );

  // Attendance and advances for the current month
  const currentMonthAttendance = worker.attendance;
  const currentMonthAdvances = worker.advances;

  // Get current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Calculate full month details (for reference)
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const fullMonthWorkingDays = totalDaysInMonth - 4; // as per your fixed holiday rule

  // Define the effective period for calculating attendance so far.
  // The effective start is the later of the 1st of the month or the worker's join date.
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const joinDate = new Date(worker.assignments[0].startDate);
  const effectiveStart = joinDate > startOfMonth ? joinDate : startOfMonth;

  // The effective end is the current date, so that only days that have passed are considered.
  const effectiveEnd = currentDate;

  // Calculate elapsed working days (up to today) by skipping Sundays.
  const elapsedWorkingDays = getWorkingDays(effectiveStart, effectiveEnd);

  // Count days present within the elapsed period.
  const daysPresent = currentMonthAttendance.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= effectiveStart && recordDate <= effectiveEnd;
  }).length;

  // Calculate days absent as the elapsed working days minus the days present.
  const daysAbsent = Math.max(0, elapsedWorkingDays - daysPresent);

  // Attendance percentage based on days that have already passed.
  const attendancePercentage =
    elapsedWorkingDays > 0 ? (daysPresent / elapsedWorkingDays) * 100 : 0;

  // Calculate hours, overtime, earnings, and advances (for the full month)
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

  const refreshData = () => {
    router.refresh();
  };

  return (
    <div className="p-8 space-y-8">
      {/* Worker Details Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {worker.photoUrl ? (
                <Avatar className="h-20 w-20">
                  <AvatarImage src={worker.photoUrl} alt={worker.name} />
                  <AvatarFallback className="bg-black/[0.08] text-gray-500 text-2xl">
                    {getInitials(worker.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <UploadPhotoDialog
                  workerId={workerId}
                  projectId={projectId}
                  workerName={worker.name}
                  onPhotoUploaded={refreshData}
                />
              )}
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                  {worker.name}
                </CardTitle>
                <CardDescription className="text-lg">
                  {worker.type.toLowerCase().replace("_", " ")}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className={cn(
                  "px-6 py-2",
                  worker.isActive
                    ? "border-[#E65F2B] text-[#E65F2B]"
                    : "border-gray-500 text-gray-500"
                )}
              >
                {worker.isActive ? "Active" : "Inactive"}
              </Badge>
              {worker.isActive && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleMarkInactive}
                >
                  Mark as Inactive
                </Button>
              )}
            </div>
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
                    {new Date(
                      worker.assignments[0].startDate
                    ).toLocaleDateString()}
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
            Attendance Statistics{" "}
            <span className="text-gray-500 text-sm font-medium">
              (this month)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Working Days</span>
              </div>
              <p className="text-2xl font-semibold">{fullMonthWorkingDays}</p>
              <p className="text-sm text-gray-500">
                Total working days in month
              </p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <UserCheck className="h-4 w-4" />
                <span>Days Present</span>
              </div>
              <p className="text-2xl font-semibold">{daysPresent}</p>
              <p className="text-sm text-gray-500">Recorded up to today</p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <UserX className="h-4 w-4" />
                <span>Days Absent</span>
              </div>
              <p className="text-2xl font-semibold">{daysAbsent}</p>
              <p className="text-sm text-gray-500">Absences so far</p>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.15] space-y-3 border border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 text-gray-500">
                <Percent className="h-4 w-4" />
                <span>Attendance Rate</span>
              </div>
              <p className="text-2xl font-semibold">
                {attendancePercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Based on days elapsed</p>
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
                Balance:{" "}
                {remainingBalance % 1 === 0
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

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmMarkInactive}
        title="Confirm Mark as Inactive"
        message="Are you sure you want to mark this worker as inactive?"
      />
    </div>
  );
}
