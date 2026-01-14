import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const contentSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  data: z.string(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
});

// GET - Fetch single content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const content = await prisma.content.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        contentType: true,
        versions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

// PUT - Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = contentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get current content
    const currentContent = await prisma.content.findUnique({
      where: { id: params.id },
    });

    if (!currentContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Create version if versioning is enabled
    const contentType = await prisma.contentType.findUnique({
      where: { id: currentContent.contentTypeId },
    });

    if (contentType?.enableVersioning) {
      await prisma.contentVersion.create({
        data: {
          data: currentContent.data,
          version: currentContent.version,
          createdBy: session.user.id,
          contentId: params.id,
        },
      });
    }

    // Update content
    const updated = await prisma.content.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        title: data.title,
        slug: data.slug,
        data: data.data,
        status: data.status || currentContent.status,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
        version: currentContent.version + 1,
        publishedAt:
          data.status === "published" && !currentContent.publishedAt
            ? new Date()
            : currentContent.publishedAt,
      },
      include: {
        contentType: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}

// DELETE - Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.content.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
