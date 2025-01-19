import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const workers = await prisma.workerAssignment.findMany({
            where: {
                projectId: params.id,
                endDate: null, // Only get currently assigned workers
            },
            include: {
                worker: true,
            },
        });

        // Transform the data to return just the worker information
        const activeWorkers = workers.map(assignment => ({
            ...assignment.worker,
        }));

        return NextResponse.json(activeWorkers);
    } catch (error) {
        console.error('Error fetching workers:', error);
        return NextResponse.json(
            { error: "Failed to fetch workers" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json()
        const { workerId, name, type, hourlyRate, phoneNumber, isExisting } = body

        if (isExisting && workerId) {
            // Assign existing worker to project
            await prisma.workerAssignment.create({
                data: {
                    workerId,
                    projectId: params.id,
                    startDate: new Date(),
                },
            })
        } else {
            // Create new worker and assign to project
            const worker = await prisma.worker.create({
                data: {
                    name,
                    type,
                    hourlyRate,
                    phoneNumber,
                    assignments: {
                        create: {
                            projectId: params.id,
                            startDate: new Date(),
                        },
                    },
                },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to add worker" },
            { status: 500 }
        )
    }
} 