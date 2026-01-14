import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const payslipSchema = z.object({
  employeeId: z.string(),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number(),
  paymentDate: z.string(),
  paymentMode: z.enum(["bank_transfer", "cash", "cheque"]).optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Fetch payslips
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

    if (month) {
      where.month = parseInt(month);
    }

    if (year) {
      where.year = parseInt(year);
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true, avatar: true },
            },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ payslips });
  } catch (error) {
    console.error("Error fetching payslips:", error);
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    );
  }
}

// POST - Generate Payslip
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can generate payslips" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = payslipSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if payslip already exists
    const existing = await prisma.payslip.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: data.employeeId,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Payslip already exists for this month" },
        { status: 400 }
      );
    }

    // Get employee with salary components
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: {
        salaryComponents: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Calculate salary
    const basicSalary = employee.salary || 0;
    const earnings: Record<string, number> = {
      Basic: basicSalary,
    };
    const deductions: Record<string, number> = {};

    // Process salary components
    employee.salaryComponents.forEach((component) => {
      const amount = component.percentage
        ? (basicSalary * component.percentage) / 100
        : component.amount;

      if (component.type === "earning") {
        earnings[component.name] = amount;
      } else {
        deductions[component.name] = amount;
      }
    });

    // Calculate totals
    const totalEarnings = Object.values(earnings).reduce((sum, val) => sum + val, 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    const grossSalary = totalEarnings;
    const netSalary = grossSalary - totalDeductions;

    // Create payslip
    const payslip = await prisma.payslip.create({
      data: {
        month: data.month,
        year: data.year,
        paymentDate: new Date(data.paymentDate),
        basicSalary,
        earnings: JSON.stringify(earnings),
        deductions: JSON.stringify(deductions),
        grossSalary,
        netSalary,
        status: "published",
        paymentMode: data.paymentMode,
        transactionId: data.transactionId,
        notes: data.notes,
        employeeId: data.employeeId,
        organizationId: session.user.organizationId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(payslip, { status: 201 });
  } catch (error) {
    console.error("Error generating payslip:", error);
    return NextResponse.json(
      { error: "Failed to generate payslip" },
      { status: 500 }
    );
  }
}
