import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const dateStr = searchParams.get('date');

        if (!projectId || !dateStr) {
            return NextResponse.json(
                { error: "Project ID and date are required" },
                { status: 400 }
            );
        }

        // Parse the date string in UTC to avoid timezone issues
        const date = new Date(dateStr);
        // Set to start of day in local timezone
        const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        // Set to start of next day in local timezone
        const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        // First, ensure we only get attendance records for existing workers
        const validWorkers = await prisma.worker.findMany({
            select: { id: true }
        });
        const validWorkerIds = validWorkers.map(w => w.id);

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                projectId,
                workerId: {
                    in: validWorkerIds
                },
                date: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        name: true,
                        hourlyRate: true,
                        photoUrl: true,
                    }
                },
                project: {
                    select: {
                        id: true,
                        projectId: true,
                    }
                }
            },
        });

        // Calculate daily income for each record
        const recordsWithIncome = attendanceRecords.map(record => {
            const totalHours = (record.hoursWorked || 0) + (record.overtime || 0);
            const dailyIncome = totalHours * record.worker.hourlyRate;
            return {
                ...record,
                dailyIncome
            };
        });

        return NextResponse.json(recordsWithIncome);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json(
            { error: "Failed to fetch attendance records", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { date: dateStr, records, projectId } = body

        if (!dateStr || !records || !projectId || !Array.isArray(records)) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        // Parse the date string in UTC to avoid timezone issues
        const date = new Date(dateStr);
        // Set to start of day in local timezone
        const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // First, ensure we only process records for existing workers
        const validWorkers = await prisma.worker.findMany({
            select: { id: true }
        });
        const validWorkerIds = new Set(validWorkers.map(w => w.id));
        const validRecords = records.filter(r => validWorkerIds.has(r.workerId));

        // Use transaction to ensure all operations succeed or none do
        const results = await prisma.$transaction(
            validRecords.map(({ workerId, present, hoursWorked, overtime }) => {
                if (!present) {
                    // For non-present workers, delete the record if it exists
                    return prisma.attendance.deleteMany({
                        where: {
                            workerId,
                            projectId,
                            date: new Date(), // Use current timestamp to match createdAt
                        },
                    });
                }
                
                // For present workers, create or update the record
                return prisma.attendance.upsert({
                    where: {
                        workerId_projectId_date: {
                            workerId,
                            projectId,
                            date: new Date(), // Use current timestamp to match createdAt
                        },
                    },
                    update: {
                        present,
                        hoursWorked: parseFloat(hoursWorked) || 0,
                        overtime: parseFloat(overtime) || 0,
                    },
                    create: {
                        workerId,
                        projectId,
                        date: new Date(), // Use current timestamp to match createdAt
                        present,
                        hoursWorked: parseFloat(hoursWorked) || 0,
                        overtime: parseFloat(overtime) || 0,
                    },
                });
            })
        );

        // Fetch the updated records with worker information to calculate daily income
        const updatedRecords = await prisma.attendance.findMany({
            where: {
                projectId,
                workerId: {
                    in: Array.from(validWorkerIds)
                },
                date: startDate,
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        name: true,
                        hourlyRate: true,
                        photoUrl: true,
                    }
                },
                project: {
                    select: {
                        id: true,
                        projectId: true,
                    }
                }
            },
        });

        // Calculate daily income for each record
        const recordsWithIncome = updatedRecords.map(record => {
            const totalHours = (record.hoursWorked || 0) + (record.overtime || 0);
            const dailyIncome = totalHours * record.worker.hourlyRate;
            return {
                ...record,
                dailyIncome
            };
        });

        return NextResponse.json({ success: true, results: recordsWithIncome })
    } catch (error) {
        console.error('Attendance save error:', error)
        return NextResponse.json(
            { error: "Failed to save attendance", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}