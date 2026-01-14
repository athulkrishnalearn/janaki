import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const tokenSchema = z.object({
  name: z.string().min(1),
  permissions: z.enum(["read", "write", "admin"]),
  expiresIn: z.enum(["never", "7d", "30d", "90d", "1y"]),
});

// Map permissions to type and allowedOperations
const mapPermissions = (permission: string) => {
  switch (permission) {
    case "read":
      return { type: "read-only", allowedOperations: JSON.stringify(["read"]) };
    case "write":
      return { type: "full-access", allowedOperations: JSON.stringify(["read", "create", "update"]) };
    case "admin":
      return { type: "full-access", allowedOperations: JSON.stringify(["read", "create", "update", "delete"]) };
    default:
      return { type: "read-only", allowedOperations: JSON.stringify(["read"]) };
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await prisma.apiToken.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Error fetching API tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch API tokens" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = tokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const permissionMapping = mapPermissions(data.permissions);

    // Generate secure random token
    const token = `janaki_${crypto.randomBytes(32).toString("hex")}`;

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (data.expiresIn !== "never") {
      const now = new Date();
      switch (data.expiresIn) {
        case "7d":
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const apiToken = await prisma.apiToken.create({
      data: {
        name: data.name,
        token,
        type: permissionMapping.type,
        allowedOperations: permissionMapping.allowedOperations,
        expiresAt,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ token: apiToken }, { status: 201 });
  } catch (error) {
    console.error("Error creating API token:", error);
    return NextResponse.json(
      { error: "Failed to create API token" },
      { status: 500 }
    );
  }
}
