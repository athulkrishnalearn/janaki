import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const taxRateSchema = z.object({
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
  type: z.string(),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

// GET - Fetch all tax rates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taxRates = await prisma.taxRate.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ taxRates });
  } catch (error) {
    console.error("Error fetching tax rates:", error);
    return NextResponse.json({ error: "Failed to fetch tax rates" }, { status: 500 });
  }
}

// POST - Create new tax rate
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = taxRateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.taxRate.updateMany({
        where: {
          organizationId: session.user.organizationId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const taxRate = await prisma.taxRate.create({
      data: {
        name: data.name,
        rate: data.rate,
        type: data.type,
        description: data.description || null,
        isDefault: data.isDefault || false,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(taxRate, { status: 201 });
  } catch (error) {
    console.error("Error creating tax rate:", error);
    return NextResponse.json({ error: "Failed to create tax rate" }, { status: 500 });
  }
}
