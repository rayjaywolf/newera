import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { date, attendance, projectId } = body

        console.log('Received attendance data:', {
            date,
            attendance,
            projectId,
            parsedDate: new Date(date)
        })

        // Use transaction to ensure all operations succeed or none do
        const results = await prisma.$transaction(
            attendance.map(({ workerId, present, hoursWorked, overtime }: any) => {
                console.log('Processing worker attendance:', {
                    workerId,
                    projectId,
                    present,
                    hoursWorked,
                    overtime,
                    date: new Date(date)
                })
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
                        hoursWorked,
                        overtime,
                    },
                    create: {
                        workerId,
                        projectId,
                        date: new Date(date),
                        present,
                        hoursWorked,
                        overtime,
                    },
                })
            })
        )

        console.log('Saved attendance results:', results)
        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error('Attendance save error:', error)
        return NextResponse.json(
            { error: "Failed to save attendance", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}