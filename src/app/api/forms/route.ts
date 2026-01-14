import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.string(), // JSON string of fields array
  logoUrl: z.string().optional(),
  campaignName: z.string().optional(),
  campaignDetails: z.string().optional(),
});

// GET - Fetch all forms for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forms = await prisma.contactForm.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// POST - Create new form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = formSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate fields JSON
    try {
      const fields = JSON.parse(data.fields);
      if (!Array.isArray(fields)) {
        throw new Error("Fields must be an array");
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid fields JSON format" },
        { status: 400 }
      );
    }

    const form = await prisma.contactForm.create({
      data: {
        name: data.name,
        title: data.title,
        description: data.description,
        fields: data.fields,
        logoUrl: body.logoUrl || null,
        campaignName: body.campaignName || null,
        campaignDetails: body.campaignDetails || null,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
