import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  invoiceId: z.string().optional(),
});

// GET - Fetch all payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        invoice: true,
        receivedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST - Record new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = paymentSchema.safeParse({
      ...body,
      amount: parseFloat(body.amount),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const payment = await prisma.payment.create({
      data: {
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
        invoiceId: data.invoiceId || null,
        receivedById: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        invoice: true,
      },
    });

    // If linked to invoice, update invoice paid amount
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (invoice) {
        await prisma.invoice.update({
          where: { id: data.invoiceId },
          data: {
            paidAmount: invoice.paidAmount + data.amount,
            status: invoice.paidAmount + data.amount >= invoice.total ? "paid" : invoice.status,
            paidDate: invoice.paidAmount + data.amount >= invoice.total ? new Date() : null,
          },
        });
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
