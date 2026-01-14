import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getIndustryTemplate } from "@/lib/industry-templates";

// POST - Apply an industry template to the organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can apply industry templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { industryId } = body;

    if (!industryId) {
      return NextResponse.json(
        { error: "Industry ID is required" },
        { status: 400 }
      );
    }

    const template = getIndustryTemplate(industryId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const organizationId = session.user.organizationId;

    // Update organization with industry settings
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        crmIndustry: industryId,
        crmSettings: JSON.stringify({
          appliedAt: new Date().toISOString(),
          templateVersion: '1.0',
        }),
      },
    });

    // Create or update the default pipeline with industry-specific stages
    let pipeline = await prisma.pipeline.findFirst({
      where: {
        organizationId,
        isDefault: true,
      },
    });

    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          name: `${template.name} Pipeline`,
          isDefault: true,
          organizationId,
        },
      });
    }

    // Delete existing stages
    await prisma.pipelineStage.deleteMany({
      where: { pipelineId: pipeline.id },
    });

    // Create new stages from template
    const stagePromises = template.pipelineStages.map(async (stage) => {
      const createdStage = await prisma.pipelineStage.create({
        data: {
          name: stage.name,
          order: stage.order,
          color: stage.color,
          probability: stage.probability,
          description: stage.description,
          intent: stage.intent,
          requiredFields: JSON.stringify(stage.requiredFields),
          subStatuses: JSON.stringify(stage.subStatuses),
          failureSignals: JSON.stringify(stage.failureSignals),
          pipelineId: pipeline.id,
        },
      });

      // Create automations for this stage
      const automationPromises = stage.automations.map((automation) =>
        prisma.pipelineStageAutomation.create({
          data: {
            stageId: createdStage.id,
            triggerType: automation.trigger,
            duration: automation.duration,
            actions: JSON.stringify(automation.actions),
            isActive: true,
            organizationId,
          },
        })
      );

      await Promise.all(automationPromises);
      return createdStage;
    });

    await Promise.all(stagePromises);

    // Create custom fields from template
    const customFieldPromises = template.customFields.map((field) =>
      prisma.customField.create({
        data: {
          name: field.name,
          label: field.label,
          type: field.type,
          options: field.options ? JSON.stringify(field.options) : null,
          isRequired: field.required,
          entity: 'contact',
          organizationId,
        },
      })
    );

    await Promise.all(customFieldPromises);

    // Create organization-wide automation rules
    const rulePromises = template.automationRules.map((rule) =>
      prisma.automationRule.create({
        data: {
          name: rule.name,
          description: rule.description,
          trigger: rule.trigger,
          triggerConfig: JSON.stringify({}),
          actions: JSON.stringify(rule.actions),
          industryType: industryId,
          isActive: true,
          organizationId,
        },
      })
    );

    await Promise.all(rulePromises);

    return NextResponse.json({
      success: true,
      message: `${template.name} template applied successfully`,
      pipelineId: pipeline.id,
    });
  } catch (error) {
    console.error("Error applying industry template:", error);
    return NextResponse.json(
      { error: "Failed to apply template" },
      { status: 500 }
    );
  }
}
