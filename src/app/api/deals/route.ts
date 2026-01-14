import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const dealSchema = z.object({
  title: z.string().min(1, "Title is required"),
  value: z.coerce.number().min(0).default(0),
  currency: z.string().default("USD"),
  status: z.enum(["open", "won", "lost"]).default("open"),
  probability: z.coerce.number().min(0).max(100).default(50),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
  contactId: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  ownerId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const pipelineId = searchParams.get("pipelineId") || "";

    const where = {
      organizationId: session.user.organizationId,
      ...(status && { status }),
      ...(pipelineId && { pipelineId }),
    };

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        contact: {
          select: { firstName: true, lastName: true, company: true },
        },
        stage: {
          select: { name: true, color: true },
        },
        owner: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ deals });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Creating deal with data:", body);
    
    const validation = dealSchema.safeParse(body);

    if (!validation.success) {
      console.error("Validation failed:", validation.error.issues);
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get default pipeline if not specified
    let pipelineId = data.pipelineId;
    let stageId = data.stageId;

    console.log("Looking for pipeline for org:", session.user.organizationId);

    if (!pipelineId) {
      const defaultPipeline = await prisma.pipeline.findFirst({
        where: { organizationId: session.user.organizationId, isDefault: true },
        include: { stages: { orderBy: { order: "asc" }, take: 1 } },
      });

      if (defaultPipeline) {
        pipelineId = defaultPipeline.id;
        stageId = defaultPipeline.stages[0]?.id;
        console.log("Found pipeline:", pipelineId, "with stage:", stageId);
      } else {
        // No pipeline exists - return helpful error
        return NextResponse.json(
          {
            error: "No pipeline found",
            message: "Please create a pipeline first or apply an industry template from Settings → Industry Templates",
          },
          { status: 400 }
        );
      }
    }

    const deal = await prisma.deal.create({
      data: {
        title: data.title,
        value: data.value,
        currency: data.currency,
        status: data.status,
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        notes: data.notes,
        contactId: data.contactId || null,
        pipelineId: pipelineId || null,
        stageId: stageId || null,
        ownerId: data.ownerId || session.user.id,
        creatorId: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        contact: true,
        stage: true,
        owner: true,
      },
    });

    console.log("Deal created successfully:", deal.id);
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create deal";
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}
