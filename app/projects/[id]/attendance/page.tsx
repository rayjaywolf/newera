"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { format as formatTZ, toZonedTime } from "date-fns-tz";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  type: string;
  photoUrl: string | null;
  hourlyRate?: number;
  dailyIncome?: number;
  startDate: string;
}

interface AttendanceRecord {
  present: boolean;
  hoursWorked: number;
  overtime: number;
  dailyIncome: number;
  workerInPhoto?: string | null;
  workerOutPhoto?: string | null;
  isPartiallyMarked: boolean;
}

interface AttendanceState {
  [workerId: string]: AttendanceRecord;
}

export default function AttendancePage() {
  const params = useParams();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return new Date();
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [timeZone, setTimeZone] = useState<string>("UTC");

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [workersResponse, attendanceResponse] = await Promise.all([
        fetch(`/api/projects/${params.id}/workers`),
        fetch(
          `/api/attendance?projectId=${params.id}&date=${format(
            selectedDate,
            "yyyy-MM-dd"
          )}&timeZone=${timeZone}`
        ),
      ]);

      if (!workersResponse.ok) throw new Error("Failed to fetch workers");
      if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance");

      const workersData = await workersResponse.json();
      const attendanceData = await attendanceResponse.json();

      setWorkers(workersData);

      const attendanceState: AttendanceState = {};
      attendanceData.forEach((record: any) => {
        attendanceState[record.workerId] = {
          present: record.present,
          hoursWorked: record.hoursWorked,
          overtime: record.overtime,
          dailyIncome: calculateDailyIncome(
            record.hoursWorked,
            record.overtime,
            record.worker
          ),
          workerInPhoto: record.workerInPhoto,
          workerOutPhoto: record.workerOutPhoto,
          isPartiallyMarked: record.isPartiallyMarked,
        };
      });
      setAttendance(attendanceState);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [params.id, selectedDate, timeZone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateDailyIncome = (
    hours: number,
    overtime: number,
    worker: Worker
  ) => {
    if (worker.dailyIncome) {
      return worker.dailyIncome;
    }
    return (hours + overtime) * (worker.hourlyRate || 0);
  };

  const handleAttendanceChange = (
    workerId: string,
    field: keyof AttendanceRecord,
    value: any
  ) => {
    setAttendance((prev) => {
      const workerRecord = prev[workerId] || {
        present: false,
        hoursWorked: 0,
        overtime: 0,
        dailyIncome: 0,
        isPartiallyMarked: false,
      };

      const worker = workers.find((w) => w.id === workerId);
      const updatedRecord = {
        ...workerRecord,
        [field]: value,
      };

      if (worker && (field === "hoursWorked" || field === "overtime")) {
        updatedRecord.dailyIncome = calculateDailyIncome(
          updatedRecord.hoursWorked,
          updatedRecord.overtime,
          worker
        );
      }

      return {
        ...prev,
        [workerId]: updatedRecord,
      };
    });
  };

  const handleTotalHoursChange = (workerId: string, totalHours: number) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker || worker.dailyIncome) return;

    const hoursWorked = Math.min(8, totalHours);
    const overtime = Math.max(0, totalHours - 8);

    setAttendance((prev) => {
      const workerRecord = prev[workerId] || {
        present: false,
        hoursWorked: 0,
        overtime: 0,
        dailyIncome: 0,
        isPartiallyMarked: false,
      };

      const updatedRecord = {
        ...workerRecord,
        hoursWorked,
        overtime,
      };

      updatedRecord.dailyIncome = calculateDailyIncome(
        updatedRecord.hoursWorked,
        updatedRecord.overtime,
        worker
      );

      return {
        ...prev,
        [workerId]: updatedRecord,
      };
    });
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    try {
      const records = Object.entries(attendance).map(([workerId, record]) => ({
        workerId,
        ...record,
      }));

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: params.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          records,
          timeZone,
        }),
      });

      if (!response.ok) throw new Error("Failed to save attendance");

      toast.success("Attendance saved successfully");
      await fetchData();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFaceRecognition = (attendanceRecord: any) => {
    fetchData();
  };

  const getActiveWorkers = () => {
    return workers.filter((worker) => {
      const workerStartDate = new Date(worker.startDate);
      workerStartDate.setHours(0, 0, 0, 0);
      const selectedDateCopy = new Date(selectedDate);
      selectedDateCopy.setHours(0, 0, 0, 0);
      return workerStartDate <= selectedDateCopy;
    });
  };

  const isWithinAttendanceWindow = useCallback((date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);

    return selectedDate >= yesterday && selectedDate <= todayDate;
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4 md:space-y-8">
        <Card className="bg-white/[0.34] border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-32 md:w-48 bg-black/[0.08]" />
                <Skeleton className="h-4 w-48 md:w-64 bg-black/[0.08]" />
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0">
                <Skeleton className="h-10 w-32 md:w-40 bg-black/[0.08]" />
                <Skeleton className="h-10 w-24 md:w-32 bg-black/[0.08]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 rounded-lg border border-[rgba(0,0,0,0.08)] overflow-hidden">
              <div className="w-full overflow-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-white/[0.15]">
                    <tr>
                      <th className="px-4 md:px-6 py-2 md:py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-16 md:w-24 bg-black/[0.08]" />
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-16 md:w-20 bg-black/[0.08]" />
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-16 md:w-24 bg-black/[0.08]" />
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-20 md:w-28 bg-black/[0.08]" />
                      </th>
                      <th className="px-4 md:px-6 py-2 md:py-4 text-left text-sm font-medium text-gray-500">
                        <Skeleton className="h-4 w-16 md:w-24 bg-black/[0.08]" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24 md:w-32 bg-black/[0.08]" />
                            <Skeleton className="h-4 w-12 md:w-16 bg-black/[0.08]" />
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <Skeleton className="h-5 w-5 bg-black/[0.08]" />
                        </td>
                        <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <Skeleton className="h-9 w-20 md:w-24 bg-black/[0.08]" />
                        </td>
                        <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <Skeleton className="h-9 w-20 md:w-24 bg-black/[0.08]" />
                        </td>
                        <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-16 md:w-20 bg-black/[0.08]" />
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
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl md:text-3xl font-bold">
                Daily Attendance
              </CardTitle>
              <CardDescription>
                Manage worker attendance and hours
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
              <div className="w-full md:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full md:w-auto justify-start text-left font-normal border-black/20",
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
                  <PopoverContent
                    className="w-full md:w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                onClick={saveAttendance}
                disabled={isSaving || !isWithinAttendanceWindow(selectedDate)}
                className={cn(
                  "w-full md:w-auto bg-[#060606] text-white font-semibold hover:bg-white hover:text-[#E65F2B] transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]",
                  !isWithinAttendanceWindow(selectedDate) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <div className="flex justify-center mb-4">
              <TabsList className="flex p-1 bg-black/10 rounded-lg w-fit">
                <TabsTrigger
                  value="manual"
                  disabled={!isWithinAttendanceWindow(selectedDate)}
                  className={cn(
                    "w-full md:w-auto rounded-md transition-colors hover:bg-black hover:text-white data-[state=active]:shadow-none",
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
                  disabled={!isWithinAttendanceWindow(selectedDate)}
                  className={cn(
                    "w-full md:w-auto rounded-md transition-colors hover:bg-black hover:text-white data-[state=active]:shadow-none",
                    "data-[state=active]:bg-white data-[state=active]:text-primary-accent"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Facial Recognition
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="manual">
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] overflow-hidden">
                <div className="w-full overflow-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-[rgba(0,0,0,0.08)]">
                        <th className="w-[20%] px-4 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Name
                        </th>
                        <th className="w-[20%] px-4 md:px-4 py-1.5 md:py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Worker Type
                        </th>
                        <th className="w-[20%] px-4 md:px-4 py-1.5 md:py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Present
                        </th>
                        <th className="w-[20%] px-4 md:px-4 py-1.5 md:py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Total Hours/Daily Income
                        </th>
                        <th className="w-[20%] px-4 md:px-4 py-1.5 md:py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Daily Income
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
                      {getActiveWorkers().map((worker) => {
                        const record = attendance[worker.id] || {
                          present: false,
                          hoursWorked: 0,
                          overtime: 0,
                          dailyIncome: 0,
                          isPartiallyMarked: false,
                        };

                        return (
                          <tr
                            key={worker.id}
                            className="border-b border-[rgba(0,0,0,0.08)]"
                          >
                            <td className="px-4 md:px-4 py-1.5 md:py-2">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  {worker.photoUrl ? (
                                    <AvatarImage
                                      src={worker.photoUrl}
                                      alt={worker.name}
                                    />
                                  ) : (
                                    <AvatarFallback className="bg-black/[0.08] text-gray-500">
                                      {getInitials(worker.name)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/projects/${params.id}/workers/${worker.id}`}
                                    className="font-medium hover:text-[#E65F2B] transition-colors"
                                  >
                                    {worker.name}
                                  </Link>
                                  {record.isPartiallyMarked && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Partial
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-4 py-1.5 md:py-2 whitespace-nowrap text-sm text-muted-foreground text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                {worker.type}
                              </span>
                            </td>
                            <td className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 whitespace-nowrap text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={record.present}
                                  disabled={!isWithinAttendanceWindow(selectedDate)}
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
                                    "hover:border-black transition-colors",
                                    !isWithinAttendanceWindow(selectedDate) &&
                                      "opacity-50 cursor-not-allowed"
                                  )}
                                />
                              </div>
                            </td>
                            <td className="w-[20%] px-4 md:px-4 py-1.5 md:py-2 whitespace-nowrap">
                              <div className="flex justify-center">
                                {worker.dailyIncome ? (
                                  <span>₹{worker.dailyIncome.toLocaleString()}</span>
                                ) : (
                                  <Input
                                    type="number"
                                    value={record.hoursWorked + record.overtime || ""}
                                    disabled={
                                      !isWithinAttendanceWindow(selectedDate) ||
                                      !record.present
                                    }
                                    onChange={(e) =>
                                      handleTotalHoursChange(
                                        worker.id,
                                        parseFloat(e.target.value)
                                      )
                                    }
                                    className={cn(
                                      "h-8 w-16 md:w-20 text-center",
                                      "focus-visible:ring-0 focus-visible:ring-offset-0",
                                      "border-black/20 focus-visible:border-black",
                                      (!isWithinAttendanceWindow(selectedDate) ||
                                        !record.present) &&
                                        "opacity-50 cursor-not-allowed"
                                    )}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="w-[20%] px-4 md:px-4 py-1.5 md:py-2 text-right">
                              ₹{record.dailyIncome.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="facial">
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] p-4 md:p-6">
                <div className="max-w-full md:max-w-2xl mx-auto">
                  {isWithinAttendanceWindow(selectedDate) ? (
                    <AttendanceCamera
                      projectId={params.id as string}
                      onSuccess={handleFaceRecognition}
                    />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      Facial recognition is only available for today and yesterday
                    </div>
                  )}
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
