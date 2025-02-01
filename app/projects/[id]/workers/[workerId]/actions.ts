"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markWorkerInactive(workerId: string, projectId: string) {
  try {
    // Start a transaction to update both worker and assignment
    await prisma.$transaction(async (tx) => {
      // Update worker status
      await tx.worker.update({
        where: { id: workerId },
        data: { isActive: false }
      });

      // Update worker assignment
      await tx.workerAssignment.updateMany({
        where: {
          workerId,
          projectId,
          endDate: null // Only update if there's no end date
        },
        data: {
          endDate: new Date()
        }
      });
    });

    revalidatePath(`/projects/${projectId}/workers/${workerId}`);
    return { success: true };
  } catch (error) {
    console.error("Error marking worker as inactive:", error);
    return { success: false, error: "Failed to mark worker as inactive" };
  }
}
