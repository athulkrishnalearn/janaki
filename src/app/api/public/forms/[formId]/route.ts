import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Public endpoint - no authentication required
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();

    // Get the form
    const form = await prisma.contactForm.findUnique({
      where: { id: formId },
      include: { organization: true },
    });

    if (!form || !form.isActive) {
      return NextResponse.json(
        { error: "Form not found or inactive" },
        { status: 404 }
      );
    }

    // Get IP and user agent
    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Parse form fields
    const formFields = JSON.parse(form.fields);
    
    // Validate required fields
    const requiredFields = formFields.filter((field: any) => field.required);
    const missingFields = requiredFields.filter(
      (field: any) => !body[field.name] || body[field.name].trim() === ""
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          fields: missingFields.map((f: any) => f.label),
        },
        { status: 400 }
      );
    }

    // Create contact from submission
    const firstName = body.firstName || body.name?.split(" ")[0] || "Unknown";
    const lastName = body.lastName || body.name?.split(" ").slice(1).join(" ") || "";
    
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        position: body.position || null,
        status: "lead",
        source: "contact_form",
        notes: body.message || body.notes || null,
        customData: JSON.stringify(body),
        organizationId: form.organizationId,
      },
    });

    // Save submission
    const submission = await prisma.contactFormSubmission.create({
      data: {
        formData: JSON.stringify(body),
        ipAddress,
        userAgent,
        formId: form.id,
        contactId: contact.id,
      },
    });

    // Update form submit count
    await prisma.contactForm.update({
      where: { id: form.id },
      data: { submitCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully! We'll be in touch soon.",
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}

// Get form details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;

    const form = await prisma.contactForm.findUnique({
      where: { id: formId },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        fields: true,
        settings: true,
        isActive: true,
      },
    });

    if (!form || !form.isActive) {
      return NextResponse.json(
        { error: "Form not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}
