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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  type: string;
  photoUrl: string | null;
  hourlyRate: number;
  startDate: string;
}

interface AttendanceRecord {
  present: boolean;
  hoursWorked: number;
  overtime: number;
  dailyIncome: number;
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

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/workers`);
      if (!response.ok) throw new Error("Failed to fetch workers");
      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("Failed to load workers");
    }
  }, [params.id]);

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/attendance?projectId=${
          params.id
        }&date=${selectedDate.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const data = await response.json();

      const attendanceState: AttendanceState = {};
      data.forEach((record: any) => {
        attendanceState[record.workerId] = {
          present: record.present,
          hoursWorked: record.hoursWorked,
          overtime: record.overtime,
          dailyIncome: calculateDailyIncome(
            record.hoursWorked,
            record.overtime,
            record.worker.hourlyRate
          ),
        };
      });

      setAttendance(attendanceState);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance records");
    }
  }, [params.id, selectedDate]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchWorkers(), fetchAttendance()]).finally(() =>
      setLoading(false)
    );
  }, [fetchWorkers, fetchAttendance]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, fetchAttendance]);

  const calculateDailyIncome = (
    hours: number,
    overtime: number,
    rate: number
  ) => {
    return (hours + overtime * 1.5) * rate;
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
          worker.hourlyRate
        );
      }

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
          date: selectedDate.toISOString(),
          records,
        }),
      });

      if (!response.ok) throw new Error("Failed to save attendance");

      toast.success("Attendance saved successfully");
      await fetchAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFaceRecognition = (attendanceRecord: any) => {
    fetchAttendance();
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

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    console.log(`Date: ${today}`);
    const localToday = new Date(today.toLocaleString());
    console.log(`Local Date: ${localToday}`);

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
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
              <Popover className="w-full md:w-auto">
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
                <PopoverContent className="w-full md:w-auto p-0" align="start">
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
              <Button
                onClick={saveAttendance}
                disabled={isSaving || !isToday(selectedDate)}
                className={cn(
                  "w-full md:w-auto bg-[#060606] text-white font-semibold hover:bg-white hover:text-[#E65F2B] transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#060606]",
                  !isToday(selectedDate) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="flex p-1 bg-black/10 rounded-lg mb-4 w-full md:w-fit">
              <TabsTrigger
                value="manual"
                disabled={!isToday(selectedDate)}
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
                disabled={!isToday(selectedDate)}
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

            <TabsContent value="manual">
              <div className="rounded-lg border border-[rgba(0,0,0,0.08)] overflow-hidden">
                <div className="w-full overflow-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-[rgba(0,0,0,0.08)]">
                        <th className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Name
                        </th>
                        <th className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Worker Type
                        </th>
                        <th className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Present
                        </th>
                        <th className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Hours Worked
                        </th>
                        <th className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                          Overtime
                        </th>
                        <th className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
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
                                <Link
                                  href={`/projects/${params.id}/workers/${worker.id}`}
                                  className="font-medium hover:text-[#E65F2B] transition-colors"
                                >
                                  {worker.name}
                                </Link>
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
                                  disabled={!isToday(selectedDate)}
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
                                    !isToday(selectedDate) &&
                                      "opacity-50 cursor-not-allowed"
                                  )}
                                />
                              </div>
                            </td>
                            <td className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 whitespace-nowrap">
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  value={record.hoursWorked || ""}
                                  disabled={
                                    !isToday(selectedDate) || !record.present
                                  }
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      worker.id,
                                      "hoursWorked",
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  className={cn(
                                    "h-8 w-16 md:w-20 text-center",
                                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "border-black/20 focus-visible:border-black",
                                    (!isToday(selectedDate) ||
                                      !record.present) &&
                                      "opacity-50 cursor-not-allowed"
                                  )}
                                />
                              </div>
                            </td>
                            <td className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 whitespace-nowrap">
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  value={record.overtime || ""}
                                  disabled={
                                    !isToday(selectedDate) || !record.present
                                  }
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      worker.id,
                                      "overtime",
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  className={cn(
                                    "h-8 w-16 md:w-20 text-center",
                                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "border-black/20 focus-visible:border-black",
                                    (!isToday(selectedDate) ||
                                      !record.present) &&
                                      "opacity-50 cursor-not-allowed"
                                  )}
                                />
                              </div>
                            </td>
                            <td className="w-[16.66%] px-4 md:px-4 py-1.5 md:py-2 whitespace-nowrap text-right">
                              <span
                                className={cn(
                                  "font-medium",
                                  record.dailyIncome
                                    ? "text-[#E65F2B]"
                                    : "text-muted-foreground"
                                )}
                              >
                                ₹{record.dailyIncome?.toFixed(2) || "0.00"}
                              </span>
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
                  {isToday(selectedDate) ? (
                    <AttendanceCamera
                      projectId={params.id as string}
                      onSuccess={handleFaceRecognition}
                    />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      Facial recognition is only available for today's
                      attendance
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
