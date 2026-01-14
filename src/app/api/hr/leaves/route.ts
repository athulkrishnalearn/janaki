import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const leaveSchema = z.object({
  leaveType: z.enum(["casual", "sick", "paid", "unpaid", "maternity", "paternity"]),
  startDate: z.string(),
  endDate: z.string(),
  days: z.coerce.number().min(0.5),
  reason: z.string().min(1),
  documents: z.array(z.string()).optional(),
});

// GET - Fetch leave requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    const leaves = await prisma.leave.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

// POST - Apply for leave
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = leaveSchema.safeParse(body);

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
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Check for overlapping leaves
    const overlapping = await prisma.leave.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: ["pending", "approved"] },
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(data.startDate) } },
              { endDate: { gte: new Date(data.startDate) } },
            ],
          },
          {
            AND: [
              { startDate: { lte: new Date(data.endDate) } },
              { endDate: { gte: new Date(data.endDate) } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "You already have a leave request for this period" },
        { status: 400 }
      );
    }

    const leave = await prisma.leave.create({
      data: {
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        days: data.days,
        reason: data.reason,
        documents: data.documents ? JSON.stringify(data.documents) : null,
        employeeId: employee.id,
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

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error("Error creating leave:", error);
    return NextResponse.json({ error: "Failed to create leave" }, { status: 500 });
  }
}
