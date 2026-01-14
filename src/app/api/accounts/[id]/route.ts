import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// PUT - Update account
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

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.bankAccount.updateMany({
        where: {
          organizationId: session.user.organizationId,
          isDefault: true,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    const account = await prisma.bankAccount.update({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      data: {
        accountName: body.accountName,
        accountNumber: body.accountNumber,
        bankName: body.bankName,
        accountType: body.accountType,
        currency: body.currency,
        balance: body.balance !== undefined ? parseFloat(body.balance) : undefined,
        isDefault: body.isDefault !== undefined ? body.isDefault : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

// DELETE - Delete account
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

    await prisma.bankAccount.delete({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
