import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const toggleSchema = z.object({
  isActive: z.boolean(),
});

// PATCH - Toggle active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = toggleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const taxRate = await prisma.taxRate.update({
      where: {
        id: id,
        organizationId: session.user.organizationId,
      },
      data: {
        isActive: validation.data.isActive,
      },
    });

    return NextResponse.json(taxRate);
  } catch (error) {
    console.error("Error toggling tax rate:", error);
    return NextResponse.json({ error: "Failed to toggle tax rate status" }, { status: 500 });
  }
}
