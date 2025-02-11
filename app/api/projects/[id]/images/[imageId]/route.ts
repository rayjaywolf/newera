import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const image = await prisma.projectImage.findUnique({
      where: { id: params.imageId },
    });

    if (!image) {
      return new NextResponse("Image not found", { status: 404 });
    }

    await del(image.url);

    await prisma.projectImage.delete({
      where: { id: params.imageId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
