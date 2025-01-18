import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { type, unit, currentRate, dateAdded } = body

        const material = await prisma.material.create({
            data: {
                type,
                unit,
                currentRate,
                dateAdded,
            },
        })

        return NextResponse.json(material)
    } catch (error) {
        console.error("Error creating material:", error)
        return NextResponse.json(
            { error: "Failed to create material" },
            { status: 500 }
        )
    }
}
