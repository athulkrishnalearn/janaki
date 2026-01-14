import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const contentSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  contentTypeId: z.string(),
  data: z.string(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
});

// GET - Fetch all contents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contents = await prisma.content.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        contentType: {
          select: {
            id: true,
            name: true,
            apiId: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ contents });
  } catch (error) {
    console.error("Error fetching contents:", error);
    return NextResponse.json({ error: "Failed to fetch contents" }, { status: 500 });
  }
}

// POST - Create new content
export async function POST(request: NextRequest) {
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

    // Check if slug already exists for this content type
    const existing = await prisma.content.findFirst({
      where: {
        organizationId: session.user.organizationId,
        contentTypeId: data.contentTypeId,
        slug: data.slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists for this content type" },
        { status: 400 }
      );
    }

    const content = await prisma.content.create({
      data: {
        title: data.title,
        slug: data.slug,
        data: data.data,
        status: data.status || "draft",
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
        contentTypeId: data.contentTypeId,
        organizationId: session.user.organizationId,
        publishedAt: data.status === "published" ? new Date() : null,
      },
      include: {
        contentType: {
          select: {
            id: true,
            name: true,
            apiId: true,
          },
        },
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error("Error creating content:", error);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}
