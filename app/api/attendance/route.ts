import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const date = searchParams.get('date');

        if (!projectId || !date) {
            return NextResponse.json(
                { error: "Project ID and date are required" },
                { status: 400 }
            );
        }

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                projectId,
                date: new Date(date),
            },
            include: {
                worker: true,
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
            { error: "Failed to fetch attendance records" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { date, records, projectId } = body

        if (!date || !records || !projectId || !Array.isArray(records)) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        console.log('Received attendance data:', {
            date,
            records,
            projectId,
            parsedDate: new Date(date)
        })

        // Use transaction to ensure all operations succeed or none do
        const results = await prisma.$transaction(
            records.map(({ workerId, present, hoursWorked, overtime }) => {
                if (!workerId) {
                    throw new Error('Worker ID is required for attendance records');
                }

                return prisma.attendance.upsert({
                    where: {
                        workerId_projectId_date: {
                            workerId,
                            projectId,
                            date: new Date(date),
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
                        date: new Date(date),
                        present,
                        hoursWorked: parseFloat(hoursWorked) || 0,
                        overtime: parseFloat(overtime) || 0,
                    },
                })
            })
        )

        // Fetch the updated records with worker information to calculate daily income
        const updatedRecords = await prisma.attendance.findMany({
            where: {
                projectId,
                date: new Date(date),
            },
            include: {
                worker: true,
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