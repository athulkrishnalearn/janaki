import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const attendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  status: z.enum(["present", "absent", "half-day", "late", "on-leave"]).default("present"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ attendances });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST - Clock In/Out or Mark Attendance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = attendanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const date = new Date(data.date);

    // Check if attendance already exists for this date
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: data.employeeId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existing) {
      // Update existing attendance (clock out or edit)
      const clockInTime = existing.clockIn ? new Date(existing.clockIn) : null;
      const clockOutTime = data.clockOut ? new Date(data.clockOut) : null;
      
      let workHours = 0;
      if (clockInTime && clockOutTime) {
        workHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      }

      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          clockOut: data.clockOut ? new Date(data.clockOut) : undefined,
          workHours,
          location: data.location,
          notes: data.notes,
          status: data.status,
        },
        include: {
          employee: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      });

      return NextResponse.json(updated);
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        date: new Date(data.date),
        clockIn: data.clockIn ? new Date(data.clockIn) : null,
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
        status: data.status,
        location: data.location,
        notes: data.notes,
        workHours: 0,
        employeeId: data.employeeId,
        organizationId: session.user.organizationId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { error: "Failed to create attendance" },
      { status: 500 }
    );
  }
}
