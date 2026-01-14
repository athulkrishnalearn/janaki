import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const timeEntrySchema = z.object({
  date: z.string(),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  hoursWorked: z.number().optional(),
  breakMinutes: z.number().optional(),
  notes: z.string().optional(),
  taskId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // If not admin/manager, only show own time entries
    if (!session.user.isAdmin) {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        user: {
          select: { id: true, name: true },
        },
        employee: {
          select: { employeeId: true, department: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ timeEntries });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = timeEntrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get employee record
    const employee = await prisma.employee.findFirst({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee record not found" },
        { status: 400 }
      );
    }

    // Calculate hours worked from clock in/out
    let hoursWorked = data.hoursWorked || 0;
    if (data.clockIn && data.clockOut) {
      const clockIn = new Date(data.clockIn);
      const clockOut = new Date(data.clockOut);
      const diffMs = clockOut.getTime() - clockIn.getTime();
      const breakMs = (data.breakMinutes || 0) * 60 * 1000;
      hoursWorked = (diffMs - breakMs) / (1000 * 60 * 60);
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        date: new Date(data.date),
        clockIn: data.clockIn ? new Date(data.clockIn) : null,
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
        hoursWorked,
        breakMinutes: data.breakMinutes || 0,
        notes: data.notes,
        taskId: data.taskId || null,
        userId: session.user.id,
        employeeId: employee.id,
        organizationId: session.user.organizationId,
      },
      include: {
        user: true,
        task: true,
      },
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}
