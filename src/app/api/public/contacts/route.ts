import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper function to validate and get API key
async function validateApiKey(apiKey: string | null, requiredPermission: string) {
  if (!apiKey) {
    return { valid: false, error: "API key is required" };
  }

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { organization: true },
  });

  if (!key) {
    return { valid: false, error: "Invalid API key" };
  }

  if (!key.isActive) {
    return { valid: false, error: "API key is inactive" };
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  // Check permissions
  const permissions = JSON.parse(key.permissions);
  if (!permissions.includes(requiredPermission) && !permissions.includes("*")) {
    return { valid: false, error: `API key does not have permission: ${requiredPermission}` };
  }

  return { valid: true, key, organization: key.organization };
}

// GET /api/public/contacts - List contacts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get API key from header or query param
    const apiKey = 
      request.headers.get("x-api-key") || 
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      searchParams.get("api_key");

    // Validate API key
    const validation = await validateApiKey(apiKey, "contacts:read");
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 401 });
    }

    // Parse query parameters
    const status = searchParams.get("status") || undefined;
    const email = searchParams.get("email") || undefined;
    const phone = searchParams.get("phone") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    const where: any = {
      organizationId: validation.organization!.id,
    };

    if (status) where.status = status;
    if (email) where.email = email;
    if (phone) where.phone = phone;

    // Fetch contacts
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          position: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.contact.count({ where }),
    ]);

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: validation.key!.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + contacts.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch contacts",
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

// Support CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
    },
  });
}
