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

// PUT - Update tax rate
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
          NOT: { id: params.id },
        },
        data: { isDefault: false },
      });
    }

    const taxRate = await prisma.taxRate.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        name: data.name,
        rate: data.rate,
        type: data.type,
        description: data.description || null,
        isDefault: data.isDefault || false,
      },
    });

    return NextResponse.json(taxRate);
  } catch (error) {
    console.error("Error updating tax rate:", error);
    return NextResponse.json({ error: "Failed to update tax rate" }, { status: 500 });
  }
}

// DELETE - Delete tax rate
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.taxRate.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ message: "Tax rate deleted successfully" });
  } catch (error) {
    console.error("Error deleting tax rate:", error);
    return NextResponse.json({ error: "Failed to delete tax rate" }, { status: 500 });
  }
}
