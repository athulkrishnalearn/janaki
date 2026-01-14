import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const budgetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  period: z.enum(["monthly", "quarterly", "yearly"]),
  startDate: z.string(),
  endDate: z.string(),
  totalAmount: z.number().positive(),
  categories: z.array(
    z.object({
      categoryName: z.string().min(1),
      allocated: z.number().positive(),
    })
  ),
});

// GET - Fetch all budgets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const budgets = await prisma.budget.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        categories: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

// POST - Create new budget
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = budgetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const budget = await prisma.budget.create({
      data: {
        name: data.name,
        description: data.description || null,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalAmount: data.totalAmount,
        organizationId: session.user.organizationId,
        categories: {
          create: data.categories.map((cat) => ({
            categoryName: cat.categoryName,
            allocated: cat.allocated,
          })),
        },
      },
      include: {
        categories: true,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}
