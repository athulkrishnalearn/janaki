import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  isActive: z.boolean(),
});

export async function PUT(
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
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verify token belongs to user's organization
    const token = await prisma.apiToken.findUnique({
      where: { id: id },
    });

    if (!token || token.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const updated = await prisma.apiToken.update({
      where: { id: id },
      data: {
        isActive: validation.data.isActive,
      },
    });

    return NextResponse.json({ token: updated });
  } catch (error) {
    console.error("Error updating API token:", error);
    return NextResponse.json(
      { error: "Failed to update API token" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Verify token belongs to user's organization
    const token = await prisma.apiToken.findUnique({
      where: { id: id },
    });

    if (!token || token.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    await prisma.apiToken.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API token:", error);
    return NextResponse.json(
      { error: "Failed to delete API token" },
      { status: 500 }
    );
  }
}
