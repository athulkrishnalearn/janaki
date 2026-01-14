import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const componentSchema = z.object({
  employeeId: z.string(),
  name: z.string().min(1),
  type: z.enum(["earning", "deduction"]),
  amount: z.coerce.number().min(0),
  percentage: z.coerce.number().min(0).max(100).optional(),
  effectiveFrom: z.string(),
});

// GET - Fetch salary components
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const components = await prisma.salaryComponent.findMany({
      where: {
        employeeId,
        organizationId: session.user.organizationId,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ components });
  } catch (error) {
    console.error("Error fetching salary components:", error);
    return NextResponse.json(
      { error: "Failed to fetch salary components" },
      { status: 500 }
    );
  }
}

// POST - Add salary component
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can add salary components" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = componentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const component = await prisma.salaryComponent.create({
      data: {
        name: data.name,
        type: data.type,
        amount: data.amount,
        percentage: data.percentage,
        effectiveFrom: new Date(data.effectiveFrom),
        employeeId: data.employeeId,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    console.error("Error creating salary component:", error);
    return NextResponse.json(
      { error: "Failed to create salary component" },
      { status: 500 }
    );
  }
}
