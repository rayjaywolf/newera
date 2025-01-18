import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { projectId, clientName, location, startDate, endDate } = body

        const project = await prisma.project.create({
            data: {
                projectId,
                clientName,
                location,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
            },
        })

        return NextResponse.json(project)
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        )
    }
} 