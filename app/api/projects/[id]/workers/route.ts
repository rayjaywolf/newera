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
                endDate: null,
                worker: {
                    isActive: true
                }
            },
            include: {
                worker: true,
            },
        });

        // Transform and filter out any null worker data
        const activeWorkers = workers
            .filter(assignment => assignment.worker)
            .map(assignment => ({
                id: assignment.worker.id,
                name: assignment.worker.name,
                type: assignment.worker.type,
                hourlyRate: assignment.worker.hourlyRate,
                photoUrl: assignment.worker.photoUrl
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
        const { workerId, name, type, hourlyRate, phoneNumber, isExisting, photoUrl } = body

        if (isExisting && workerId) {
            // Assign existing worker to project
            await prisma.workerAssignment.create({
                data: {
                    workerId,
                    projectId: params.id,
                    startDate: new Date(),
                },
            });
            return NextResponse.json({ success: true, id: workerId });
        } else {
            // Create new worker and assign to project
            const worker = await prisma.worker.create({
                data: {
                    name,
                    type,
                    hourlyRate,
                    phoneNumber,
                    photoUrl,
                    assignments: {
                        create: {
                            projectId: params.id,
                            startDate: new Date(),
                        },
                    },
                },
            });

            // If photo was uploaded, create WorkerPhoto entry
            if (photoUrl) {
                await prisma.workerPhoto.create({
                    data: {
                        url: photoUrl,
                        workerId: worker.id,
                        projectId: params.id,
                        tag: 'reference-photo'
                    }
                });
            }

            return NextResponse.json({ success: true, id: worker.id });
        }
    } catch (error) {
        console.error('Error adding worker:', error);
        return NextResponse.json(
            { error: "Failed to add worker" },
            { status: 500 }
        )
    }
} 