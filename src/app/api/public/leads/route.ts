import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for lead data
const leadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  source: z.string().default("website"),
  customData: z.record(z.string(), z.any()).optional(),
});

// Helper function to validate and get API key
async function validateApiKey(apiKey: string | null) {
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
  if (!permissions.includes("leads:create") && !permissions.includes("*")) {
    return { valid: false, error: "API key does not have permission to create leads" };
  }

  return { valid: true, key, organization: key.organization };
}

// Helper function to log webhook request
async function logWebhookRequest(
  apiKeyId: string,
  endpoint: string,
  method: string,
  requestBody: any,
  responseStatus: number,
  responseBody: any,
  request: NextRequest
) {
  try {
    await prisma.webhookLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        requestBody: JSON.stringify(requestBody),
        responseStatus,
        responseBody: JSON.stringify(responseBody),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
  } catch (error) {
    console.error("Failed to log webhook request:", error);
  }
}

export async function POST(request: NextRequest) {
  let apiKeyId: string | undefined;
  let requestBody: any;

  try {
    // Get API key from header or query param
    const apiKey = 
      request.headers.get("x-api-key") || 
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      new URL(request.url).searchParams.get("api_key");

    // Validate API key
    const validation = await validateApiKey(apiKey);
    if (!validation.valid) {
      const errorResponse = { error: validation.error };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    apiKeyId = validation.key!.id;
    requestBody = await request.json();

    // Validate request body
    const leadData = leadSchema.safeParse(requestBody);
    if (!leadData.success) {
      const errorResponse = { 
        error: "Invalid data", 
        details: leadData.error.issues 
      };
      
      if (apiKeyId) {
        await logWebhookRequest(
          apiKeyId,
          "/api/public/leads",
          "POST",
          requestBody,
          400,
          errorResponse,
          request
        );
      }

      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Create contact (lead) in the database
    const contact = await prisma.contact.create({
      data: {
        firstName: leadData.data.firstName,
        lastName: leadData.data.lastName,
        email: leadData.data.email || null,
        phone: leadData.data.phone || null,
        company: leadData.data.company || null,
        notes: leadData.data.message || null,
        status: "lead",
        source: leadData.data.source,
        customData: leadData.data.customData ? JSON.stringify(leadData.data.customData) : null,
        organizationId: validation.organization!.id,
      },
    });

    const successResponse = {
      success: true,
      leadId: contact.id,
      message: "Lead captured successfully",
    };

    // Log successful request
    await logWebhookRequest(
      apiKeyId,
      "/api/public/leads",
      "POST",
      requestBody,
      201,
      successResponse,
      request
    );

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error("Error capturing lead:", error);
    
    const errorResponse = { 
      error: "Failed to capture lead",
      message: error instanceof Error ? error.message : "Unknown error"
    };

    // Log failed request if we have apiKeyId
    if (apiKeyId) {
      await logWebhookRequest(
        apiKeyId,
        "/api/public/leads",
        "POST",
        requestBody || {},
        500,
        errorResponse,
        request
      );
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Support CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
    },
  });
}
