"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar as CalendarIcon, Users, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceCamera } from "@/components/attendance/attendance-camera";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Worker {
  id: string;
  name: string;
  type: string;
  hourlyRate: number;
}

interface AttendanceRecord {
  workerId: string;
  date: string;
  present: boolean;
  hoursWorked: number;
  overtime: number;
  dailyIncome: number;
}

export default function AttendancePage() {
  const params = useParams();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<{
    [key: string]: AttendanceRecord;
  }>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/workers`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("Failed to fetch workers");
      return [];
    }
  };

  const calculateDailyIncome = useCallback(
    (record: AttendanceRecord, workers: Worker[]) => {
      if (!record.present) return 0;
      const worker = workers.find((w: Worker) => w.id === record.workerId);
      const hourlyRate = worker?.hourlyRate || 0;
      const totalHours = (record.hoursWorked || 0) + (record.overtime || 0);
      return totalHours * hourlyRate;
    },
    []
  );

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      // Make API calls in parallel
      const [workersResponse, attendanceResponse] = await Promise.all([
        fetchWorkers(),
        fetch(
          `/api/attendance?projectId=${params.id}&date=${formattedDate}`
        ).then((res) => res.json()),
      ]);

      // Process attendance records on client
      const attendanceMap: { [key: string]: AttendanceRecord } = {};
      const attendanceRecords = Array.isArray(attendanceResponse)
        ? attendanceResponse
        : [];
      attendanceRecords.forEach((record: AttendanceRecord) => {
        const worker = workersResponse.find(
          (w: Worker) => w.id === record.workerId
        );
        const totalHours = (record.hoursWorked || 0) + (record.overtime || 0);
        record.dailyIncome = record.present
          ? totalHours * (worker?.hourlyRate || 0)
          : 0;
        attendanceMap[record.workerId] = record;
      });

      setWorkers(workersResponse);
      setAttendance(attendanceMap);
      setLoading(false);
    };

    initializeData();
  }, [selectedDate, params.id]);

  const handleAttendanceChange = (
    workerId: string,
    field: string,
    value: any
  ) => {
    setAttendance((prev) => {
      const current = prev[workerId] || {
        workerId,
        date: format(selectedDate, "yyyy-MM-dd"),
        present: false,
        hoursWorked: 0,
        overtime: 0,
        dailyIncome: 0,
      };

      const updated = {
        ...current,
        [field]: value,
      };

      if (updated.present) {
        const worker = workers.find((w) => w.id === workerId);
        const hourlyRate = worker?.hourlyRate || 0;
        const regularHours = Number(updated.hoursWorked) || 0;
        const overtimeHours = Number(updated.overtime) || 0;
        updated.dailyIncome = (regularHours + overtimeHours) * hourlyRate;
      } else {
        updated.hoursWorked = 0;
        updated.overtime = 0;
        updated.dailyIncome = 0;
      }

      return { ...prev, [workerId]: updated };
    });
  };

  const saveAttendance = async () => {
    const toastId = toast.loading("Saving attendance...");
    setIsSaving(true);
    try {
      const records = Object.values(attendance).map((record) => ({
        workerId: record.workerId,
        present: record.present,
        hoursWorked: record.hoursWorked || 0,
        overtime: record.overtime || 0,
      }));

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: params.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          records,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to save attendance");
      }

      toast.success("Attendance saved successfully", {
        id: toastId,
      });

      // Refresh attendance data to ensure we have the latest state
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const attendanceResponse = await fetch(
        `/api/attendance?projectId=${params.id}&date=${formattedDate}`
      ).then((res) => res.json());
      const attendanceMap: { [key: string]: AttendanceRecord } = {};
      const attendanceRecords = Array.isArray(attendanceResponse)
        ? attendanceResponse
        : [];
      attendanceRecords.forEach((record: AttendanceRecord) => {
        const worker = workers.find((w) => w.id === record.workerId);
        const totalHours = (record.hoursWorked || 0) + (record.overtime || 0);
        record.dailyIncome = record.present
          ? totalHours * (worker?.hourlyRate || 0)
          : 0;
        attendanceMap[record.workerId] = record;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save attendance",
        {
          id: toastId,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFaceRecognition = async (attendance: any) => {
    // Update attendance state with the new record
    setAttendance((prev) => ({
      ...prev,
      [attendance.workerId]: {
        ...attendance,
        dailyIncome:
          attendance.hoursWorked * (attendance.worker?.hourlyRate || 0),
      },
    }));
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48 bg-black/[0.08]" />
                <Skeleton className="h-4 w-64 bg-black/[0.08]" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-40 bg-black/[0.08]" />
                <Skeleton className="h-10 w-32 bg-black/[0.08]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 rounded-lg border border-[rgba(0,0,0,0.08)] overflow-hidden">
              <div className="w-full overflow-auto">
                <table className="w-full">
                  <thead className="bg-white/[0.15]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-24 bg-black/[0.08]" />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-20 bg-black/[0.08]" />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-24 bg-black/[0.08]" />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-28 bg-black/[0.08]" />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-24 bg-black/[0.08]" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-32 bg-black/[0.08]" />
                            <Skeleton className="h-4 w-16 bg-black/[0.08]" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-5 w-5 bg-black/[0.08]" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-9 w-24 bg-black/[0.08]" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-9 w-24 bg-black/[0.08]" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-20 bg-black/[0.08]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold">
                Daily Attendance
              </CardTitle>
              <CardDescription>
                Manage worker attendance and hours
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal border-black/20",
                      "hover:border-black transition-colors bg-transparent",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date: Date | undefined) =>
                      date && setSelectedDate(date)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                onClick={saveAttendance}
                disabled={isSaving}
                className={cn(
                  "bg-[#060606] text-white font-semibold hover:bg-white hover:text-[#E65F2B] transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]"
                )}
              >
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="flex p-1 bg-black/10 rounded-lg mb-4 w-fit">
              <TabsTrigger
                value="manual"
                className={cn(
                  "rounded-md transition-colors hover:bg-black hover:text-white data-[state=active]:shadow-none",
                  "data-[state=active]:bg-white data-[state=active]:text-primary-accent"
                )}
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manual Entry
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="facial"
                className={cn(
                  "rounded-md transition-colors hover:bg-black hover:text-white data-[state=active]:shadow-none",
                  "data-[state=active]:bg-white data-[state=active]:text-primary-accent"
                )}
              >
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Facial Recognition
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(0,0,0,0.08)]">
                      <th className="w-[16.66%] px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                        Name
                      </th>
                      <th className="w-[16.66%] px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                        Worker Type
                      </th>
                      <th className="w-[16.66%] px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                        Present
                      </th>
                      <th className="w-[16.66%] px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                        Hours Worked
                      </th>
                      <th className="w-[16.66%] px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                        Overtime
                      </th>
                      <th className="w-[16.66%] px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                        Daily Income
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
                    {workers.map((worker) => {
                      const record = attendance[worker.id];
                      return (
                        <tr
                          key={worker.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="w-[16.66%] px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                            <Link
                              href={`/projects/${params.id}/workers/${worker.id}`}
                              className="hover:underline cursor-pointer"
                            >
                              {worker.name}
                            </Link>
                          </td>
                          <td className="w-[16.66%] px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {worker.type}
                            </span>
                          </td>
                          <td className="w-[16.66%] px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={record?.present || false}
                                onCheckedChange={(checked) =>
                                  handleAttendanceChange(
                                    worker.id,
                                    "present",
                                    checked
                                  )
                                }
                                className={cn(
                                  "h-5 w-5 border border-black/20 rounded-sm shadow-none",
                                  "data-[state=checked]:bg-black data-[state=checked]:border-black [&>span]:text-white",
                                  "hover:border-black transition-colors"
                                )}
                              />
                            </div>
                          </td>
                          <td className="w-[16.66%] px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center">
                              <Input
                                type="number"
                                value={record?.hoursWorked || ""}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    worker.id,
                                    "hoursWorked",
                                    parseFloat(e.target.value)
                                  )
                                }
                                className={cn(
                                  "h-8 w-20 text-center",
                                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                                  "border-black/20 focus-visible:border-black"
                                )}
                              />
                            </div>
                          </td>
                          <td className="w-[16.66%] px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center">
                              <Input
                                type="number"
                                value={record?.overtime || ""}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    worker.id,
                                    "overtime",
                                    parseFloat(e.target.value)
                                  )
                                }
                                className={cn(
                                  "h-8 w-20 text-center",
                                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                                  "border-black/20 focus-visible:border-black"
                                )}
                              />
                            </div>
                          </td>
                          <td className="w-[16.66%] px-6 py-4 whitespace-nowrap text-right">
                            <span
                              className={cn(
                                "font-medium",
                                record?.dailyIncome
                                  ? "text-[#E65F2B]"
                                  : "text-muted-foreground"
                              )}
                            >
                              ₹{record?.dailyIncome?.toFixed(2) || "0.00"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="facial">
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] p-6">
                <div className="max-w-2xl mx-auto">
                  <AttendanceCamera
                    projectId={params.id as string}
                    onSuccess={handleFaceRecognition}
                  />
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Position your face in front of the camera to mark your
                    attendance
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
