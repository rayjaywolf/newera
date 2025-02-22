"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Wallet,
  Calendar,
  UserCheck,
  UserX,
  Percent,
  Trash2,
  MoreVertical,
  UserPlus,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import cn from "classnames";
import dynamic from "next/dynamic";
import { markWorkerInactive, migrateWorker } from "./actions";
import { AddAdvanceDialog } from "@/components/workers/add-advance-dialog";
import { UploadPhotoDialog } from "@/components/workers/upload-photo-dialog";
import { MigrateWorkerDialog } from "@/components/workers/migrate-worker-dialog";
import { EditWorkerDialog } from "@/components/workers/edit-worker-dialog";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

interface Project {
  id: string;
  projectId: string;
  location: string;
  clientName: string;
}

interface Attendance {
  id: string;
  date: Date;
  present: boolean;
  hoursWorked: number;
  overtime: number;
  projectId: string;
  workerId: string;
  photoUrl: string | null;
  confidence: number | null;
  workerInPhoto: string | null;
  workerOutPhoto: string | null;
  inConfidence: number | null;
  outConfidence: number | null;
  isPartiallyMarked: boolean;
  createdAt: Date;
}

interface Advance {
  id: string;
  amount: number;
  date: Date;
  notes: string | null;
  isPaid: boolean;
  projectId: string;
  workerId: string;
  createdAt: Date;
}

interface WorkerAssignment {
  id: string;
  projectId: string;
  workerId: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
}

interface Worker {
  id: string;
  name: string;
  type: string;
  hourlyRate: number;
  dailyIncome: number | null;
  phoneNumber: string | null;
  photoUrl: string | null;
  faceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  attendance: Attendance[];
  advances: Advance[];
  assignments: WorkerAssignment[];
}

interface WorkerDetailsProps {
  worker: Worker;
  params: {
    id: string;
    workerId: string;
  };
  projects: Project[];
}

function getWorkingDays(start: Date, end: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
}

export function WorkerDetails({
  worker,
  params,
  projects,
}: WorkerDetailsProps) {
  const router = useRouter();
  const { id: projectId, workerId } = params;
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);

  const currentAssignment = worker.assignments.find(
    (a) => a.projectId === projectId
  );
  const isActiveInProject = currentAssignment?.isActive ?? false;

  const handleMarkInactive = async () => {
    setDialogOpen(true);
  };

  const handleConfirmMarkInactive = async () => {
    const result = await markWorkerInactive(workerId, projectId);
    if (result.success) {
      toast.success("Worker marked as inactive in this project");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to mark worker as inactive");
    }
  };

  const handleMigrate = async (targetProjectId: string) => {
    return migrateWorker(workerId, projectId, targetProjectId);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workers/${worker.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete worker");
      }

      toast.success("Worker deleted successfully");
      router.push(`/projects/${params.id}/workers`);
      router.refresh();
    } catch (error) {
      console.error("Error deleting worker:", error);
      toast.error("Failed to delete worker");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const AttendanceHistoryWithFilter = dynamic(
    () => import("./attendance-history"),
    { ssr: false }
  );

  const currentMonthAttendance = worker.attendance;
  const currentMonthAdvances = worker.advances;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const fullMonthWorkingDays = totalDaysInMonth;

  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const joinDate = new Date(worker.assignments[0].startDate);
  const effectiveStart = joinDate > startOfMonth ? joinDate : startOfMonth;

  const effectiveEnd = currentDate;

  const elapsedWorkingDays = getWorkingDays(effectiveStart, effectiveEnd);

  const daysPresent = currentMonthAttendance.filter((record: Attendance) => {
    const recordDate = new Date(record.date);
    return recordDate >= effectiveStart && recordDate <= effectiveEnd;
  }).length;

  const daysAbsent = Math.max(0, elapsedWorkingDays - daysPresent);

  const attendancePercentage =
    elapsedWorkingDays > 0 ? (daysPresent / elapsedWorkingDays) * 100 : 0;

  const totalHours = currentMonthAttendance.reduce(
    (acc: number, record: Attendance) => acc + record.hoursWorked,
    0
  );
  const totalOvertime = currentMonthAttendance.reduce(
    (acc: number, record: Attendance) => acc + record.overtime,
    0
  );
  const monthlyEarnings = worker.dailyIncome
    ? daysPresent * worker.dailyIncome
    : (totalHours + totalOvertime) * (worker.hourlyRate || 0);
  const monthlyAdvances = currentMonthAdvances.reduce(
    (acc: number, advance: Advance) => acc + advance.amount,
    0
  );
  const remainingBalance = monthlyEarnings - monthlyAdvances;

  const refreshData = () => {
    router.refresh();
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this worker? This action cannot be undone.
              This will permanently delete the worker and all related data including:
              <ul className="list-disc list-inside mt-2">
                <li>Project assignments</li>
                <li>Attendance records</li>
                <li>Advance payments</li>
                <li>Photos and face recognition data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Worker"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Worker Details Card */}
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-6">
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
            <div className="flex items-start sm:items-center gap-4">
              <Badge
                variant="outline"
                className={cn(
                  "px-6 py-2",
                  isActiveInProject
                    ? "border-[#E65F2B] text-[#E65F2B]"
                    : "border-gray-500 text-gray-500"
                )}
              >
                {isActiveInProject ? "Active" : "Inactive"}
              </Badge>
              {isActiveInProject && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <MoreVertical className="h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <EditWorkerDialog
                      worker={worker}
                      trigger={
                        <button className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Worker
                        </button>
                      }
                    />
                    <MigrateWorkerDialog
                      workerId={workerId}
                      currentProjectId={projectId}
                      projects={projects}
                      onMigrate={handleMigrate}
                      trigger={
                        <button className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Migrate Worker
                        </button>
                      }
                    />
                    <DropdownMenuItem onClick={handleMarkInactive}>
                      <UserX className="h-4 w-4" />
                      Mark as Inactive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Worker
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-8 sm:grid-cols-3">
            <div>
              <dt className="font-medium text-gray-500 mb-1">
                {worker.dailyIncome ? "Daily Income" : "Hourly Rate"}
              </dt>
              <dd className="text-lg">
                ₹{(worker.dailyIncome || worker.hourlyRate || 0).toLocaleString()}
                {worker.dailyIncome ? "/day" : "/hr"}
              </dd>
            </div>
            {worker.assignments.length > 0 && (
              <>
                <div>
                  <dt className="font-medium text-gray-500 mb-1">Start Date</dt>
                  <dd className="text-lg">
                    {new Date(worker.assignments[0].startDate).toLocaleDateString()}
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
            {/* Icon hidden on mobile */}
            <UserCheck className="hidden sm:block h-5 w-5" />
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
                <Calendar className="h-4 w-4 " />
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
              {/* Icon hidden on mobile */}
              <Wallet className="hidden sm:block h-5 w-5" />
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
        title="Mark Worker as Inactive"
        message="Are you sure you want to mark this worker as inactive in this project? This action cannot be undone."
      />
    </div>
  );
}
