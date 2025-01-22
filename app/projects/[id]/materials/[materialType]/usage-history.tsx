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
  materialType: string;
  initialData: any;
}

export default function UsageHistory({
  projectId,
  materialType,
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
    params.append('materialType', materialType);
    if (range.from) params.append('fromDate', range.from.toISOString());
    if (range.to) params.append('toDate', range.to.toISOString());

    const response = await fetch(`/api/materials/usage?${params.toString()}`);
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
              <tr className="border-b border-[rgb(0,0,0,0.08)]">
                <th className="text-left py-4 px-6 font-medium text-gray-500 w-1/5">
                  Date
                </th>
                <th className="text-center py-4 px-6 font-medium text-gray-500 w-1/5">
                  Volume
                </th>
                <th className="text-center py-4 px-6 font-medium text-gray-500 w-1/5">
                  Rate
                </th>
                <th className="text-right py-4 px-6 font-medium text-gray-500 w-1/5">
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((entry: any) => (
                <tr
                  key={entry.id}
                  className="border-b border-[rgb(0,0,0,0.08)] hover:bg-white/[0.15]"
                >
                  <td className="py-4 px-6 text-left">{formatDate(entry.date)}</td>
                  <td className="py-4 px-6 text-center">{entry.volume} units</td>
                  <td className="py-4 px-6 text-center">
                    {formatCurrency(Math.round(entry.cost / entry.volume))}
                    /unit
                  </td>
                  <td className="py-4 px-6 text-right">
                    {formatCurrency(entry.cost)}
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
