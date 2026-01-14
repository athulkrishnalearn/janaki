import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, organizationName } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate organization slug
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();

    // Create organization, admin role, and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          onboardingCompleted: false,
        },
      });

      // Create Admin role with all permissions
      const adminRole = await tx.role.create({
        data: {
          name: "Admin",
          description: "Full access to all features",
          isSystem: true,
          canManageUsers: true,
          canManageRoles: true,
          organizationId: organization.id,
          permissions: {
            create: allPermissions.map(p => ({
              permissionId: p.id,
            })),
          },
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          isAdmin: true,
          roleId: adminRole.id,
          organizationId: organization.id,
        },
      });

      // Create default pipeline
      await tx.pipeline.create({
        data: {
          name: "Sales Pipeline",
          isDefault: true,
          organizationId: organization.id,
          stages: {
            create: [
              { name: "Lead", order: 1, color: "#6b7280", probability: 10 },
              { name: "Qualified", order: 2, color: "#3b82f6", probability: 30 },
              { name: "Proposal", order: 3, color: "#8b5cf6", probability: 50 },
              { name: "Negotiation", order: 4, color: "#f59e0b", probability: 70 },
              { name: "Closed Won", order: 5, color: "#10b981", probability: 100 },
              { name: "Closed Lost", order: 6, color: "#ef4444", probability: 0 },
            ],
          },
        },
      });

      // Create default categories
      await tx.category.createMany({
        data: [
          { name: "General", color: "#6b7280", type: "task", organizationId: organization.id },
          { name: "Development", color: "#3b82f6", type: "task", organizationId: organization.id },
          { name: "Marketing", color: "#8b5cf6", type: "task", organizationId: organization.id },
          { name: "Sales", color: "#10b981", type: "task", organizationId: organization.id },
          { name: "Office Supplies", color: "#6b7280", type: "expense", organizationId: organization.id },
          { name: "Travel", color: "#3b82f6", type: "expense", organizationId: organization.id },
          { name: "Software", color: "#8b5cf6", type: "expense", organizationId: organization.id },
        ],
      });

      return { user, organization };
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
