"use client";

import { useState, useEffect } from "react";
import { ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Tooltip,
  Legend,
} from "recharts";

interface StatsProps {
  projectId: string;
}

export default function StatsSection({ projectId }: StatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/stats`)
      .then((res) => res.json())
      .then((data) => {
        // Log daily stats for past 30 days
        console.log("Daily attendance stats for past 30 days:");
        data.dailyStats.forEach((stat: any) => {
          const percentage = stat.assigned
            ? ((stat.present / stat.assigned) * 100).toFixed(1)
            : 0;
          console.log(
            `${stat.date}: ${stat.present}/${stat.assigned} workers present (${percentage}%)`
          );
        });
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <Skeleton className="h-5 w-32 mb-2 bg-black/[0.08]" />
            <Skeleton className="h-[200px] w-full bg-black/[0.08]" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return <p>Failed to load stats.</p>;

  const attendanceData = stats.attendance.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    hours: item.hoursWorked,
  }));
  const materialData = stats.materials.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    cost: item.cost,
  }));
  const machineryData = stats.machinery.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    cost: item.totalCost,
  }));

  const labourData = stats.attendance.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    cost: (item.hoursWorked || 0) * (item.worker?.hourlyRate || 0),
  }));

  const aggregateCosts = (
    data: { date: string; cost: number }[]
  ): Record<string, number> => {
    return data.reduce((acc, { date, cost }) => {
      acc[date] = (acc[date] || 0) + cost;
      return acc;
    }, {} as Record<string, number>);
  };

  const labourAgg = aggregateCosts(labourData);
  const materialAgg = aggregateCosts(materialData);
  const machineryAgg = aggregateCosts(machineryData);

  const dates = new Set([
    ...Object.keys(labourAgg),
    ...Object.keys(materialAgg),
    ...Object.keys(machineryAgg),
  ]);
  const barData = Array.from(dates)
    .map((date) => ({
      date,
      labour: labourAgg[date] || 0,
      materials: materialAgg[date] || 0,
      machinery: machineryAgg[date] || 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
      <div>
        <h3 className="text-lg font-bold mb-2">
          Attendance Rate (Last 30 Days)
        </h3>
        <ChartContainer
          config={{ dailyStats: { color: "#E65F2B", label: "Attendance %" } }}
        >
          <AreaChart
            // Sort order: oldest on left, latest on right
            data={[...stats.dailyStats]
              .filter((stat) => new Date(stat.date).getDay() !== 0) // Filter out Sundays (0 = Sunday)
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              )}
            width={300}
            height={200}
          >
            <defs>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E65F2B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#E65F2B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke="#E65F2B"
              fill="url(#colorAttendance)"
              name="Attendance %"
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Material Usage (Cost)</h3>
        <ChartContainer
          config={{ materials: { color: "#1E90FF", label: "Cost" } }}
        >
          <AreaChart data={materialData}>
            <defs>
              <linearGradient id="colorMaterial" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E90FF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1E90FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#1E90FF"
              fill="url(#colorMaterial)"
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Machinery Usage (Cost)</h3>
        <ChartContainer
          config={{ machinery: { color: "#32CD32", label: "Cost" } }}
        >
          <AreaChart data={machineryData}>
            <defs>
              <linearGradient id="colorMachinery" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#32CD32" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#32CD32" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#32CD32"
              fill="url(#colorMachinery)"
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Costs Breakdown</h3>
        <ChartContainer config={{ costs: { color: "#FFD700", label: "Cost" } }}>
          <BarChart data={barData} width={300} height={200}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="labour" fill="#FF6347" />
            <Bar dataKey="materials" fill="#1E90FF" />
            <Bar dataKey="machinery" fill="#32CD32" />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
