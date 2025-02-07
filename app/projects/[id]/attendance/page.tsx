"use client";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatDate(utcDateString?: string) {
  if (!utcDateString) return "";
  const localDate = new Date(utcDateString);
  return localDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface Worker {
  id: string;
  name: string;
  type: string;
  photoUrl: string | null;
  hourlyRate: number;
  present: boolean;
  hoursWorked: number;
  isModified?: boolean; // Add this new field
  date?: string;
}

export default function AttendancePage({ params }: { params: { id: string } }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch(`/api/attendance?projectId=${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch workers");
        const data = await response.json();
        setWorkers(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [params.id]);

  const updateWorkerAttendance = (workerId: string, present: boolean) => {
    setWorkers(
      workers.map((worker) =>
        worker.id === workerId
          ? { ...worker, present, isModified: true }
          : worker
      )
    );
  };

  const updateWorkerHours = (workerId: string, hours: number) => {
    setWorkers(
      workers.map((worker) =>
        worker.id === workerId
          ? { ...worker, hoursWorked: hours, isModified: true }
          : worker
      )
    );
  };

  const handleSave = async () => {
    const modifiedAttendance = workers.filter((worker) => worker.isModified);

    if (modifiedAttendance.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: params.id,
          attendance: modifiedAttendance.map(
            ({ id, present, hoursWorked }) => ({
              id,
              present,
              hoursWorked,
            })
          ),
        }),
      });

      if (!response.ok) throw new Error("Failed to save attendance");

      // Clear modification flags after successful save
      setWorkers(workers.map((worker) => ({ ...worker, isModified: false })));
      toast.success("Attendance saved successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Attendance</h1>
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Worker Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Working Hours</TableHead>
              <TableHead>Daily Income</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={worker.photoUrl || ""} />
                    <AvatarFallback>
                      {worker.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {worker.name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{worker.type}</Badge>
                </TableCell>
                <TableCell>{formatDate(worker.date)}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={worker.present}
                    onCheckedChange={(checked) =>
                      updateWorkerAttendance(worker.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-[100px]"
                    placeholder="0"
                    value={worker.hoursWorked || ""}
                    onChange={(e) =>
                      updateWorkerHours(
                        worker.id,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={!worker.present}
                  />
                </TableCell>
                <TableCell>
                  ₹{(worker.hourlyRate * (worker.hoursWorked || 0)).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
