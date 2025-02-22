"use client";

import { useState, useEffect } from "react";
import { DateRangeFilter } from "@/components/date-range-filter";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AttendanceHistoryProps {
  projectId: string;
  workerId: string;
  worker: {
    hourlyRate?: number;
    dailyIncome?: number;
  };
  initialData: any;
}

export default function AttendanceHistory({
  projectId,
  workerId,
  worker,
  initialData,
}: AttendanceHistoryProps) {
  const [attendance, setAttendance] = useState(initialData);

  useEffect(() => {
    const fetchAllAttendance = async () => {
      const params = new URLSearchParams();
      params.append("projectId", projectId);
      params.append("workerId", workerId);
      const response = await fetch(
        `/api/workers/attendance?${params.toString()}`
      );
      const allData = await response.json();
      setAttendance(allData);
    };
    fetchAllAttendance();
  }, [projectId, workerId]);

  const handleDateRangeChange = async (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    const params = new URLSearchParams();
    params.append("projectId", projectId);
    params.append("workerId", workerId);
    if (range.from) params.append("fromDate", range.from.toISOString());
    if (range.to) params.append("toDate", range.to.toISOString());

    const response = await fetch(
      `/api/workers/attendance?${params.toString()}`
    );
    const newData = await response.json();
    setAttendance(newData);
  };

  return (
    <>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Calendar className="hidden sm:block h-5 w-5" />
            Attendance Records
          </CardTitle>
          <DateRangeFilter onRangeChange={handleDateRangeChange} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(0,0,0,0.08)]">
                <th className="text-left py-4 px-6 font-medium text-gray-500 w-1/4">
                  Date
                </th>
                {!worker.dailyIncome && (
                  <>
                    <th className="text-center py-4 px-6 font-medium text-gray-500 w-1/4">
                      Hours
                    </th>
                    <th className="text-center py-4 px-6 font-medium text-gray-500 w-1/4">
                      Overtime
                    </th>
                  </>
                )}
                <th className="text-right py-4 px-6 font-medium text-gray-500 w-1/4">
                  Earnings
                </th>
              </tr>
            </thead>
            <tbody>
              {attendance
                .sort(
                  (a: any, b: any) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((record: any) => (
                  <tr
                    key={record.id}
                    className="border-b border-[rgb(0,0,0,0.08)] hover:bg-white/[0.15]"
                  >
                    <td className="py-4 px-6 text-left">
                      {formatDate(record.date)}
                    </td>
                    {!worker.dailyIncome && (
                      <>
                        <td className="py-4 px-6 text-center">
                          {record.hoursWorked}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {record.overtime}
                        </td>
                      </>
                    )}
                    <td className="py-4 px-6 text-right">
                      ₹
                      {worker.dailyIncome
                        ? worker.dailyIncome.toLocaleString()
                        : (
                            (record.hoursWorked + record.overtime) *
                            (worker.hourlyRate || 0)
                          ).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </>
  );
}
