import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const automationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.enum(["time", "event", "condition"]),
  triggerConfig: z.object({}).passthrough(),
  actions: z.array(z.object({}).passthrough()),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const automations = await prisma.automation.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON strings
    const parsed = automations.map((a) => ({
      ...a,
      triggerConfig: JSON.parse(a.triggerConfig),
      actions: JSON.parse(a.actions),
    }));

    return NextResponse.json({ automations: parsed });
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = automationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const automation = await prisma.automation.create({
      data: {
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerConfig: JSON.stringify(data.triggerConfig),
        actions: JSON.stringify(data.actions),
        isActive: data.isActive,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(
      {
        ...automation,
        triggerConfig: JSON.parse(automation.triggerConfig),
        actions: JSON.parse(automation.actions),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating automation:", error);
    return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
  }
}
