'use client';

import { useState } from 'react';
import { DateRangeFilter } from '@/components/date-range-filter';
import { formatDate } from '@/lib/utils';
import { History } from 'lucide-react';
import {
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

interface UsageHistoryProps {
  projectId: string;
  machineryType: string;
  initialData: any;
}

export default function UsageHistory({
  projectId,
  machineryType,
  initialData,
}: UsageHistoryProps) {
  const [data, setData] = useState(initialData);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDateRangeChange = async (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    const params = new URLSearchParams();
    params.append('projectId', projectId);
    params.append('machineryType', machineryType);
    if (range.from) params.append('fromDate', range.from.toISOString());
    if (range.to) params.append('toDate', range.to.toISOString());

    const response = await fetch(`/api/machinery/usage?${params.toString()}`);
    const newData = await response.json();
    setData(newData);
  };

  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5" />
            Usage History
          </CardTitle>
          <DateRangeFilter onRangeChange={handleDateRangeChange} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.08)]">
                <th className="text-left py-4 px-6 font-medium text-gray-500 w-1/4">
                  Date
                </th>
                <th className="text-center py-4 px-6 font-medium text-gray-500 w-1/4">
                  Hours Used
                </th>
                <th className="text-center py-4 px-6 font-medium text-gray-500 w-1/4">
                  Rate
                </th>
                <th className="text-right py-4 px-6 font-medium text-gray-500 w-1/4">
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((entry: any) => (
                <tr
                  key={entry.id}
                  className="border-b border-[rgba(0,0,0,0.08)] hover:bg-white/[0.15]"
                >
                  <td className="py-4 px-6 text-left">{formatDate(entry.date)}</td>
                  <td className="py-4 px-6 text-center">{entry.hoursUsed} hrs</td>
                  <td className="py-4 px-6 text-center">
                    {formatCurrency(entry.hourlyRate)}/hr
                  </td>
                  <td className="py-4 px-6 text-right">
                    {formatCurrency(entry.totalCost)}
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
