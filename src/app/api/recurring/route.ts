import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const recurringExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  autoApprove: z.boolean().optional(),
});

// Helper function to calculate next date
function calculateNextDate(startDate: Date, frequency: string): Date {
  const next = new Date(startDate);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

// GET - Fetch all recurring expenses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expenses = await prisma.recurringExpense.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { nextDate: "asc" },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Error fetching recurring expenses:", error);
    return NextResponse.json({ error: "Failed to fetch recurring expenses" }, { status: 500 });
  }
}

// POST - Create new recurring expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = recurringExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const startDate = new Date(data.startDate);
    const nextDate = calculateNextDate(startDate, data.frequency);

    const expense = await prisma.recurringExpense.create({
      data: {
        description: data.description,
        amount: data.amount,
        frequency: data.frequency,
        startDate: startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextDate: nextDate,
        paymentMethod: data.paymentMethod || null,
        vendorId: data.vendorId || null,
        notes: data.notes || null,
        autoApprove: data.autoApprove || false,
        organizationId: session.user.organizationId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring expense:", error);
    return NextResponse.json({ error: "Failed to create recurring expense" }, { status: 500 });
  }
}
