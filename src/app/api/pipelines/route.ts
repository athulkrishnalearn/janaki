import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        stages: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { deals: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ pipelines });
  } catch (error) {
    console.error("Error fetching pipelines:", error);
    return NextResponse.json({ error: "Failed to fetch pipelines" }, { status: 500 });
  }
}
