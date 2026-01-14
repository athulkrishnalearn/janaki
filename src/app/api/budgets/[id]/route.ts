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

// PUT - Update budget
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
    const validation = budgetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Delete existing categories
    await prisma.budgetCategory.deleteMany({
      where: { budgetId: params.id },
    });

    // Update budget with new categories
    const budget = await prisma.budget.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        name: data.name,
        description: data.description || null,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalAmount: data.totalAmount,
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

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

// DELETE - Delete budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.budget.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
