import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: {
                startDate: 'desc'
            }
        })
        return NextResponse.json(projects)
    } catch (error) {
        console.error("Error fetching projects:", error)
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { id, projectId, clientName, location, startDate, endDate } = body

        const project = await prisma.project.create({
            data: {
                id,
                projectId,
                clientName,
                location,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
            },
        })

        return NextResponse.json(project)
    } catch (error) {
        console.error("Error creating project:", error)
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        )
    }
} 