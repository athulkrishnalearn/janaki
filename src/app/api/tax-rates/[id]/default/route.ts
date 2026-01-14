import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// PATCH - Set as default tax rate
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
    // Unset all defaults first
    await prisma.taxRate.updateMany({
      where: {
        organizationId: session.user.organizationId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this one as default
    const taxRate = await prisma.taxRate.update({
      where: {
        id: id,
        organizationId: session.user.organizationId,
      },
      data: {
        isDefault: true,
      },
    });

    return NextResponse.json(taxRate);
  } catch (error) {
    console.error("Error setting default tax rate:", error);
    return NextResponse.json({ error: "Failed to set default tax rate" }, { status: 500 });
  }
}
