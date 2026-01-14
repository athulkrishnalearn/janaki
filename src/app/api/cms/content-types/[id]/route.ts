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
});

// PUT - Update content type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = contentTypeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if it's a system type
    const contentType = await prisma.contentType.findUnique({
      where: { id: id },
    });

    if (!contentType) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    if (contentType.isSystem) {
      return NextResponse.json(
        { error: "Cannot modify system content types" },
        { status: 403 }
      );
    }

    const updated = await prisma.contentType.update({
      where: {
        id: id,
        organizationId: session.user.organizationId,
      },
      data: {
        name: data.name,
        apiId: data.apiId,
        description: data.description || null,
        icon: data.icon || "file-text",
        enableDrafts: data.enableDrafts ?? true,
        enableVersioning: data.enableVersioning ?? true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating content type:", error);
    return NextResponse.json(
      { error: "Failed to update content type" },
      { status: 500 }
    );
  }
}

// DELETE - Delete content type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Check if it's a system type
    const contentType = await prisma.contentType.findUnique({
      where: { id: id },
    });

    if (!contentType) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    if (contentType.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system content types" },
        { status: 403 }
      );
    }

    await prisma.contentType.delete({
      where: {
        id: id,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ message: "Content type deleted successfully" });
  } catch (error) {
    console.error("Error deleting content type:", error);
    return NextResponse.json(
      { error: "Failed to delete content type" },
      { status: 500 }
    );
  }
}
