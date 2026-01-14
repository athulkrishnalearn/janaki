import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const approvalSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

// PUT - Approve/Reject Leave
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can approve/reject leaves" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = approvalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const leave = await prisma.leave.update({
      where: { id },
      data: {
        status: data.status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectionReason: data.rejectionReason,
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

    return NextResponse.json(leave);
  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json({ error: "Failed to update leave" }, { status: 500 });
  }
}
