import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

export default async function AdminWorkersPage() {
  const workers = await prisma.adminWorker.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <Card className="bg-white/[0.34] border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5" />
              Admin Workers
            </CardTitle>
            <Link
              href="/admin/workers/new"
              className="inline-flex items-center gap-1 rounded-md bg-[#060606] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-[#E65F2B] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Worker
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker) => (
              <Link
                key={worker.id}
                href={`/admin/workers/${worker.id}`}
                className="flex items-center gap-4 rounded-lg bg-white/[0.15] p-4 hover:bg-white/[0.25] transition border border-[rgba(0,0,0,0.08)]"
              >
                <Avatar className="h-16 w-16">
                  {worker.photoUrl ? (
                    <AvatarImage src={worker.photoUrl} alt={worker.name} />
                  ) : (
                    <AvatarFallback className="bg-black/[0.08] text-gray-500">
                      {getInitials(worker.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-row sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-lg">{worker.name}</p>
                      <p className="text-sm text-gray-500 capitalize mt-1">
                        {worker.type.toLowerCase().replace("_", " ")}
                      </p>
                      <p className="text-sm font-medium text-[#E65F2B] mt-1">
                        ₹{worker.dailyIncome}/day
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        worker.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {worker.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
