"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AttendanceCamera } from "@/components/attendance/attendance-camera";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminWorker {
  id: string;
  name: string;
  type: string;
  dailyIncome: number;
}

interface AttendanceRecord {
  present: boolean;
  photoUrl?: string | null;
}

export default function AdminAttendancePage() {
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, attendanceRes] = await Promise.all([
        fetch("/api/admin/workers"),
        fetch(
          `/api/admin/attendance?date=${format(selectedDate, "yyyy-MM-dd")}`
        ),
      ]);

      if (!workersRes.ok || !attendanceRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const workersData = await workersRes.json();
      const attendanceData = await attendanceRes.json();

      setWorkers(workersData);
      setAttendance(
        attendanceData.reduce((acc: any, record: any) => {
          acc[record.workerId] = {
            present: record.present,
            photoUrl: record.photoUrl,
          };
          return acc;
        }, {})
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          records: Object.entries(attendance).map(([workerId, record]) => ({
            workerId,
            ...record,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save attendance");

      toast.success("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Admin Attendance
            </CardTitle>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-black/20 hover:border-black"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white hover:bg-white hover:text-[#E65F2B]"
              >
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="facial">Facial Recognition</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary/40">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-center">Present</th>
                      <th className="px-4 py-2 text-right">Daily Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((worker) => (
                      <tr key={worker.id}>
                        <td className="px-4 py-2">{worker.name}</td>
                        <td className="px-4 py-2 capitalize">
                          {worker.type.toLowerCase().replace("_", " ")}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Checkbox
                            checked={attendance[worker.id]?.present}
                            onCheckedChange={(checked) => {
                              setAttendance((prev) => ({
                                ...prev,
                                [worker.id]: {
                                  ...prev[worker.id],
                                  present: !!checked,
                                },
                              }));
                            }}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          ₹{worker.dailyIncome}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="facial">
              <div className="rounded-lg border p-4">
                <AttendanceCamera onSuccess={fetchData} projectId="admin" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
