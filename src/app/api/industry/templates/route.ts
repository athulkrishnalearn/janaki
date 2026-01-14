import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAllIndustryTemplates, getIndustryTemplate } from "@/lib/industry-templates";

// GET - List all available industry templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const industryId = searchParams.get("id");

    if (industryId) {
      const template = getIndustryTemplate(industryId);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json(template);
    }

    const templates = getAllIndustryTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching industry templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
