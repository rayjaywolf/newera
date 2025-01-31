import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;

        // Get current date and set to start of day in local timezone
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // Get all active workers assigned to the project with their details
        const assignedWorkers = await prisma.workerAssignment.findMany({
            where: {
                projectId,
                endDate: null,
                worker: {
                    isActive: true
                }
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        const totalWorkers = assignedWorkers.length;
        const allWorkerIds = assignedWorkers.map(assignment => assignment.worker.id);

        // Get attendance records for today with worker details
        const todayAttendance = await prisma.attendance.findMany({
            where: {
                projectId,
                date: {
                    gte: today,
                    lt: tomorrow,
                },
                present: true,
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        // Calculate statistics and group workers
        const presentWorkers = todayAttendance.map(record => ({
            id: record.worker.id,
            name: record.worker.name
        }));
        const verifiedWorkers = todayAttendance
            .filter(record => record.photoUrl && record.confidence)
            .map(record => ({
                id: record.worker.id,
                name: record.worker.name,
                confidence: record.confidence
            }));
        const unverifiedWorkers = todayAttendance
            .filter(record => !record.photoUrl || !record.confidence)
            .map(record => ({
                id: record.worker.id,
                name: record.worker.name
            }));

        // Calculate absent workers (workers who are assigned but not present today)
        const presentWorkerIds = new Set(presentWorkers.map(w => w.id));
        const absentWorkers = assignedWorkers
            .filter(assignment => !presentWorkerIds.has(assignment.worker.id))
            .map(assignment => ({
                id: assignment.worker.id,
                name: assignment.worker.name
            }));

        return NextResponse.json({
            totalWorkers,
            workersPresent: presentWorkers.length,
            verifiedWorkers: verifiedWorkers.length,
            unverifiedWorkers: unverifiedWorkers.length,
            absentWorkers: absentWorkers.length,
            workerDetails: {
                all: assignedWorkers.map(a => ({ id: a.worker.id, name: a.worker.name })),
                present: presentWorkers,
                verified: verifiedWorkers,
                unverified: unverifiedWorkers,
                absent: absentWorkers
            },
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching attendance stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch attendance stats" },
            { status: 500 }
        );
    }
} 