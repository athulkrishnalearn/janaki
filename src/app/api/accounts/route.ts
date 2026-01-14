import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const accountSchema = z.object({
  accountName: z.string().min(1),
  accountNumber: z.string().min(1),
  bankName: z.string().min(1),
  accountType: z.enum(["checking", "savings", "credit_card"]),
  currency: z.string().default("USD"),
  balance: z.number().default(0),
  isDefault: z.boolean().optional(),
});

// GET - Fetch all accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.bankAccount.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

// POST - Create new account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = accountSchema.safeParse({
      ...body,
      balance: parseFloat(body.balance || 0),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.bankAccount.updateMany({
        where: {
          organizationId: session.user.organizationId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const account = await prisma.bankAccount.create({
      data: {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        accountType: data.accountType,
        currency: data.currency,
        balance: data.balance,
        isDefault: data.isDefault || false,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
