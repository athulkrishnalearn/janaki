// Automation Processor - Runs automation rules when deals change stages
// This is the INTELLIGENCE ENGINE that makes JANAKI smart

import { prisma } from "@/lib/prisma";

interface AutomationAction {
  type: 'create_task' | 'send_notification' | 'assign_user' | 'update_field' | 'send_email';
  config: Record<string, any>;
}

/**
 * Process automations when a deal enters a new stage
 */
export async function processDealStageChange(
  dealId: string,
  newStageId: string,
  organizationId: string
) {
  try {
    // Get the deal details
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        contact: true,
        owner: true,
        stage: true,
      },
    });

    if (!deal) {
      console.error("Deal not found:", dealId);
      return;
    }

    // Get all active automations for this stage
    const automations = await prisma.pipelineStageAutomation.findMany({
      where: {
        stageId: newStageId,
        isActive: true,
        triggerType: 'on_enter',
      },
    });

    // Execute each automation
    for (const automation of automations) {
      const actions: AutomationAction[] = JSON.parse(automation.actions);
      
      for (const action of actions) {
        await executeAction(action, deal, organizationId);
      }
    }

    // Schedule duration-based automations
    await scheduleDurationAutomations(dealId, newStageId, organizationId);

  } catch (error) {
    console.error("Error processing automation:", error);
  }
}

/**
 * Schedule automations that trigger after a duration
 */
async function scheduleDurationAutomations(
  dealId: string,
  stageId: string,
  organizationId: string
) {
  const durationAutomations = await prisma.pipelineStageAutomation.findMany({
    where: {
      stageId,
      isActive: true,
      triggerType: 'on_duration',
    },
  });

  // In a production system, you'd use a job queue (BullMQ, Inngest, etc.)
  // For now, we'll log this for manual implementation
  console.log(`📅 ${durationAutomations.length} duration automations scheduled for deal ${dealId}`);
}

/**
 * Execute a single automation action
 */
async function executeAction(
  action: AutomationAction,
  deal: any,
  organizationId: string
) {
  try {
    switch (action.type) {
      case 'create_task':
        await createTaskAction(action.config, deal, organizationId);
        break;
        
      case 'send_notification':
        await sendNotificationAction(action.config, deal);
        break;
        
      case 'assign_user':
        await assignUserAction(action.config, deal);
        break;
        
      case 'update_field':
        await updateFieldAction(action.config, deal);
        break;
        
      case 'send_email':
        // Email functionality would go here
        console.log("📧 Email action triggered:", action.config);
        break;
        
      default:
        console.log("Unknown action type:", action.type);
    }
  } catch (error) {
    console.error(`Error executing action ${action.type}:`, error);
  }
}

/**
 * Create a task action
 */
async function createTaskAction(
  config: Record<string, any>,
  deal: any,
  organizationId: string
) {
  const dueDate = config.dueInHours 
    ? new Date(Date.now() + config.dueInHours * 60 * 60 * 1000)
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

  const assigneeId = config.assignToOwner ? deal.ownerId : deal.creatorId;

  await prisma.task.create({
    data: {
      title: config.title || 'Follow up required',
      description: config.description || `Auto-generated task for ${deal.title}`,
      status: 'todo',
      priority: config.priority || 'medium',
      dueDate,
      organizationId,
      creatorId: deal.creatorId,
      assigneeId,
      contactId: deal.contactId,
    },
  });

  console.log(`✅ Task created: ${config.title}`);
}

/**
 * Send notification action
 */
async function sendNotificationAction(
  config: Record<string, any>,
  deal: any
) {
  if (!deal.ownerId) return;

  await prisma.notification.create({
    data: {
      title: config.title || 'Deal Update',
      message: config.message || `Deal ${deal.title} requires attention`,
      type: config.type || 'info',
      userId: deal.ownerId,
    },
  });

  console.log(`🔔 Notification sent to user ${deal.ownerId}`);
}

/**
 * Assign user action
 */
async function assignUserAction(
  config: Record<string, any>,
  deal: any
) {
  // In production, implement role-based assignment strategy
  // For now, just log the intent
  console.log(`👤 User assignment triggered with strategy: ${config.strategy}`);
  
  // Example: Round-robin assignment by role
  if (config.role) {
    const users = await prisma.user.findMany({
      where: {
        organizationId: deal.organizationId,
        role: {
          name: config.role,
        },
      },
    });

    if (users.length > 0) {
      // Simple round-robin: assign to first user
      // In production, track last assigned user
      await prisma.deal.update({
        where: { id: deal.id },
        data: { ownerId: users[0].id },
      });
      
      console.log(`✅ Deal assigned to ${users[0].name}`);
    }
  }
}

/**
 * Update field action
 */
async function updateFieldAction(
  config: Record<string, any>,
  deal: any
) {
  // Update custom data or tags
  if (config.field === 'tags') {
    const currentData = deal.customData ? JSON.parse(deal.customData) : {};
    currentData.tags = currentData.tags || [];
    
    if (!currentData.tags.includes(config.value)) {
      currentData.tags.push(config.value);
    }

    await prisma.deal.update({
      where: { id: deal.id },
      data: { customData: JSON.stringify(currentData) },
    });

    console.log(`🏷️  Tag added: ${config.value}`);
  }
}

/**
 * Check for deals that need duration-based automations
 * This should be run periodically (cron job or serverless function)
 */
export async function processDurationAutomations() {
  try {
    console.log("⏰ Checking duration-based automations...");

    // Get all active deals
    const deals = await prisma.deal.findMany({
      where: {
        status: 'open',
      },
      include: {
        stage: {
          include: {
            automations: {
              where: {
                triggerType: 'on_duration',
                isActive: true,
              },
            },
          },
        },
        contact: true,
        owner: true,
      },
    });

    for (const deal of deals) {
      if (!deal.stage || !deal.stage.automations) continue;
      
      for (const automation of deal.stage.automations) {
        if (!automation.duration) continue;

        // Check if deal has been in this stage long enough
        const stageEntryTime = deal.updatedAt; // In production, track stage entry time separately
        const minutesInStage = (Date.now() - stageEntryTime.getTime()) / (1000 * 60);

        if (minutesInStage >= automation.duration) {
          // Execute automation
          const actions: AutomationAction[] = JSON.parse(automation.actions);
          
          for (const action of actions) {
            await executeAction(action, deal, deal.organizationId);
          }

          // Mark automation as executed (in production, track this)
          console.log(`✅ Duration automation executed for deal ${deal.id}`);
        }
      }
    }

  } catch (error) {
    console.error("Error processing duration automations:", error);
  }
}

/**
 * Process organization-wide automation rules
 */
export async function processOrganizationAutomations(organizationId: string) {
  try {
    const rules = await prisma.automationRule.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    for (const rule of rules) {
      // Process time-based rules
      if (rule.trigger === 'time_based') {
        console.log(`⏰ Processing time-based rule: ${rule.name}`);
        // Implementation would depend on the specific trigger config
      }
    }

  } catch (error) {
    console.error("Error processing organization automations:", error);
  }
}
