import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const contentTypeSchema = z.object({
  name: z.string().min(1),
  apiId: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  enableDrafts: z.boolean().optional(),
  enableVersioning: z.boolean().optional(),
  fields: z.string().optional(),
});

// GET - Fetch all content types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentTypes = await prisma.contentType.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: { contents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contentTypes });
  } catch (error) {
    console.error("Error fetching content types:", error);
    return NextResponse.json(
      { error: "Failed to fetch content types" },
      { status: 500 }
    );
  }
}

// POST - Create new content type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = contentTypeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if apiId already exists
    const existing = await prisma.contentType.findFirst({
      where: {
        organizationId: session.user.organizationId,
        apiId: data.apiId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "API ID already exists" },
        { status: 400 }
      );
    }

    const contentType = await prisma.contentType.create({
      data: {
        name: data.name,
        apiId: data.apiId,
        description: data.description || null,
        icon: data.icon || "file-text",
        enableDrafts: data.enableDrafts ?? true,
        enableVersioning: data.enableVersioning ?? true,
        fields: data.fields || JSON.stringify([]),
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(contentType, { status: 201 });
  } catch (error) {
    console.error("Error creating content type:", error);
    return NextResponse.json(
      { error: "Failed to create content type" },
      { status: 500 }
    );
  }
}
