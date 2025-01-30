import { formatDistanceToNow } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

interface AttendanceListProps {
  attendance: any[]; // Replace with proper type from your Prisma schema
}

export function AttendanceList({ attendance }: AttendanceListProps) {
  if (attendance.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No attendance records found for today
      </div>
    );
  }

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker</TableHead>
            <TableHead>Present</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={record.photoUrl} alt={record.worker.name} />
                  <AvatarFallback>
                    {record.worker.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/projects/${record.projectId}/workers/${record.worker.id}`}
                  className="hover:underline text-primary cursor-pointer"
                >
                  {record.worker.name}
                </Link>
              </TableCell>
              <TableCell>
                <Checkbox checked={record.present} disabled />
              </TableCell>
              <TableCell>
                {record.hoursWorked + (record.overtime || 0)}h
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(record.date), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                {record.confidence && (
                  <Badge
                    variant={record.confidence >= 95 ? "success" : "warning"}
                  >
                    {record.confidence.toFixed(1)}%
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
