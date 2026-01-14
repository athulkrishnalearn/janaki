import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  employeeId: z.string(),
  reviewPeriod: z.string(),
  reviewDate: z.string(),
  overallRating: z.coerce.number().min(1).max(5),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  feedback: z.string().optional(),
});

// GET - Fetch performance reviews
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { reviewDate: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST - Create performance review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can create reviews" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const review = await prisma.performanceReview.create({
      data: {
        employeeId: data.employeeId,
        reviewPeriod: data.reviewPeriod,
        reviewDate: new Date(data.reviewDate),
        overallRating: data.overallRating,
        strengths: data.strengths ? JSON.stringify(data.strengths) : null,
        improvements: data.improvements ? JSON.stringify(data.improvements) : null,
        goals: data.goals ? JSON.stringify(data.goals) : null,
        feedback: data.feedback,
        reviewedBy: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
