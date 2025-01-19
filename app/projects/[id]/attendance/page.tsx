"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { Calendar as CalendarIcon } from "lucide-react";
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
      setWorkers(data);
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
      const worker = workers.find((w) => w.id === record.workerId);
      const hourlyRate = worker?.hourlyRate || 0;
      const totalHours = (record.hoursWorked || 0) + (record.overtime || 0);
      return totalHours * hourlyRate;
    },
    []
  );

  const fetchAttendance = useCallback(
    async (date: string, currentWorkers: Worker[]) => {
      try {
        const response = await fetch(
          `/api/attendance?projectId=${params.id}&date=${date}`
        );
        const data = await response.json();
        const attendanceMap: { [key: string]: AttendanceRecord } = {};
        data.forEach((record: AttendanceRecord) => {
          record.dailyIncome = calculateDailyIncome(record, currentWorkers);
          attendanceMap[record.workerId] = record;
        });
        setAttendance(attendanceMap);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        toast.error("Failed to fetch attendance records");
      } finally {
        setLoading(false);
      }
    },
    [params.id, calculateDailyIncome]
  );

  useEffect(() => {
    const initializeData = async () => {
      const fetchedWorkers = await fetchWorkers();
      await fetchAttendance(format(selectedDate, "yyyy-MM-dd"), fetchedWorkers);
    };
    initializeData();
  }, [selectedDate, fetchAttendance, fetchWorkers]);

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
      await fetchAttendance(format(selectedDate, "yyyy-MM-dd"), workers);
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

  if (loading) {
    return <div className="p-8">Loading...</div>;
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
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal border-[#E65F2B] text-[#E65F2B]"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                onClick={saveAttendance}
                className={cn(
                  "text-white bg-black hover:bg-white hover:text-[#E65F2B] border border-transparent hover:border-[#E65F2B] transition-colors",
                  isSaving && "bg-white text-[#E65F2B] border-[#E65F2B]"
                )}
                disabled={isSaving}
              >
                {isSaving ? "Saving Attendance..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/80 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                    Worker Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                    Present
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                    Hours Worked
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                    Overtime
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-secondary/40">
                    Daily Income
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {workers.map((worker) => {
                  const record = attendance[worker.id];
                  return (
                    <tr
                      key={worker.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                        {worker.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {worker.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          value={record?.hoursWorked || ""}
                          onChange={(e) =>
                            handleAttendanceChange(
                              worker.id,
                              "hoursWorked",
                              e.target.value
                            )
                          }
                          disabled={!record?.present}
                          className={cn(
                            "w-24 bg-transparent border border-black/20 rounded-md shadow-none",
                            "focus:border-black focus:ring-0 focus:ring-offset-0",
                            !record?.present && "opacity-50 cursor-not-allowed"
                          )}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          value={record?.overtime || ""}
                          onChange={(e) =>
                            handleAttendanceChange(
                              worker.id,
                              "overtime",
                              e.target.value
                            )
                          }
                          disabled={!record?.present}
                          className={cn(
                            "w-24 bg-transparent border border-black/20 rounded-md shadow-none",
                            "focus:border-black focus:ring-0 focus:ring-offset-0",
                            !record?.present && "opacity-50 cursor-not-allowed"
                          )}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={cn(
                            "font-medium",
                            record?.dailyIncome > 0
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
        </CardContent>
      </Card>
    </div>
  );
}
