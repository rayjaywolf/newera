"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markWorkerInactive(workerId: string, projectId: string) {
  try {
    // Update worker assignment to mark as inactive
    await prisma.workerAssignment.updateMany({
      where: {
        workerId,
        projectId,
        endDate: null // Only update active assignment
      },
      data: {
        isActive: false,
        endDate: new Date()
      }
    });

    revalidatePath(`/projects/${projectId}/workers/${workerId}`);
    return { success: true };
  } catch (error) {
    console.error("Error marking worker as inactive:", error);
    return { success: false, error: "Failed to mark worker as inactive" };
  }
}

export async function migrateWorker(workerId: string, currentProjectId: string, targetProjectId: string) {
  try {
    // Update current assignment to mark as inactive and set end date
    await prisma.workerAssignment.updateMany({
      where: {
        workerId: workerId,
        projectId: currentProjectId,
        endDate: null, // Only update active assignment
      },
      data: {
        endDate: new Date(),
        isActive: false, // Mark as inactive in current project
      },
    });

    // Create new assignment for target project
    await prisma.workerAssignment.create({
      data: {
        workerId: workerId,
        projectId: targetProjectId,
        startDate: new Date(),
        isActive: true, // Mark as active in new project
      },
    });

    revalidatePath("/projects/[id]/workers/[workerId]");
    return { success: true };
  } catch (error) {
    console.error("Error migrating worker:", error);
    return { success: false, error: "Failed to migrate worker" };
  }
}
