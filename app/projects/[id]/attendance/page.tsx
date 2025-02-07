"use client";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

interface Worker {
  id: string;
  name: string;
  type: string;
  photoUrl: string | null;
  hourlyRate: number;
  present: boolean;
  hoursWorked: number;
}

export default function AttendancePage({ params }: { params: { id: string } }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Attendance</h1>
        <div className="text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Worker Type</TableHead>
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
                <TableCell>
                  <Checkbox checked={worker.present} />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-[100px]"
                    placeholder="0"
                    value={worker.hoursWorked || ""}
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
