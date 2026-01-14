import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(["general", "urgent", "policy", "event"]).default("general"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  targetDepartments: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// GET - Fetch announcements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        organizationId: session.user.organizationId,
        isPublished: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST - Create announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can create announcements" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = announcementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        priority: data.priority,
        targetDepartments: data.targetDepartments
          ? JSON.stringify(data.targetDepartments)
          : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        isPublished: true,
        publishedAt: new Date(),
        createdBy: session.user.id,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
