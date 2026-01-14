import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: "Only admin can complete onboarding" }, { status: 403 });
    }

    const body = await request.json();

    // Update organization info
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        industry: body.orgInfo.industry,
        onboardingCompleted: true,
      },
    });

    // Create custom roles if any
    for (const roleData of body.roles) {
      if (roleData.name.trim() !== "") {
        await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            organizationId: session.user.organizationId,
            permissions: {
              create: roleData.permissions.map((permName: string) => ({
                permission: {
                  connect: {
                    name: permName,
                  },
                },
              })),
            },
          },
        });
      }
    }

    return NextResponse.json({ message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
