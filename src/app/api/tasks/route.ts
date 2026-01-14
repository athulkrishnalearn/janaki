import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "review", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  assigneeId: z.string().optional(),
  categoryId: z.string().optional(),
  parentId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const assigneeId = searchParams.get("assigneeId") || "";

    const where = {
      organizationId: session.user.organizationId,
      parentId: null, // Only get top-level tasks
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        category: true,
        subTasks: {
          select: { id: true, title: true, status: true },
        },
        _count: {
          select: { subTasks: true },
        },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = taskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Auto-assignment logic
    let assigneeId = data.assigneeId;
    let isAutoAssigned = false;

    if (!assigneeId && data.priority === "urgent") {
      // Auto-assign urgent tasks to team members with least tasks
      const teamMembers = await prisma.user.findMany({
        where: {
          organizationId: session.user.organizationId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              assignedTasks: {
                where: { status: { not: "done" } },
              },
            },
          },
        },
        orderBy: {
          assignedTasks: { _count: "asc" },
        },
        take: 1,
      });

      if (teamMembers.length > 0) {
        assigneeId = teamMembers[0].id;
        isAutoAssigned = true;
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours,
        assigneeId: assigneeId || null,
        categoryId: data.categoryId || null,
        parentId: data.parentId || null,
        contactId: data.contactId || null,
        dealId: data.dealId || null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        isAutoAssigned,
        creatorId: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        assignee: true,
        creator: true,
        category: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
