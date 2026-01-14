import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const holidaySchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  type: z.enum(["public", "optional", "restricted"]).default("public"),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

// GET - Fetch holidays
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ holidays });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json(
      { error: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}

// POST - Add holiday
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can add holidays" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = holidaySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const holiday = await prisma.holiday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        type: data.type,
        description: data.description,
        isRecurring: data.isRecurring,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}
