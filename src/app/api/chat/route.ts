import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// Simple intent parser for task-related commands
function parseIntent(message: string): {
  intent: string;
  entities: Record<string, string>;
} {
  const lowerMessage = message.toLowerCase();
  const entities: Record<string, string> = {};

  // Create task intent
  if (
    lowerMessage.includes("create task") ||
    lowerMessage.includes("add task") ||
    lowerMessage.includes("new task") ||
    lowerMessage.includes("make a task")
  ) {
    // Extract title after common phrases
    const titlePatterns = [
      /create (?:a )?task(?::|,)?\s*(.+?)(?:\s*(?:and|with|for|by).*)?$/i,
      /add (?:a )?task(?::|,)?\s*(.+?)(?:\s*(?:and|with|for|by).*)?$/i,
      /new task(?::|,)?\s*(.+?)(?:\s*(?:and|with|for|by).*)?$/i,
    ];

    for (const pattern of titlePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        entities.title = match[1].trim();
        break;
      }
    }

    // Extract priority
    if (lowerMessage.includes("urgent") || lowerMessage.includes("asap")) {
      entities.priority = "urgent";
    } else if (lowerMessage.includes("high priority")) {
      entities.priority = "high";
    } else if (lowerMessage.includes("low priority")) {
      entities.priority = "low";
    }

    // Extract assignee mention
    const assignMatch = message.match(/assign(?:ed)?\s*(?:to)?\s*(\w+)/i);
    if (assignMatch) {
      entities.assigneeName = assignMatch[1];
    }

    return { intent: "create_task", entities };
  }

  // List tasks intent
  if (
    lowerMessage.includes("list tasks") ||
    lowerMessage.includes("show tasks") ||
    lowerMessage.includes("my tasks") ||
    lowerMessage.includes("what tasks")
  ) {
    return { intent: "list_tasks", entities };
  }

  // Get status/summary intent
  if (
    lowerMessage.includes("summary") ||
    lowerMessage.includes("overview") ||
    lowerMessage.includes("status") ||
    lowerMessage.includes("how many")
  ) {
    return { intent: "get_summary", entities };
  }

  // Generate workflow intent
  if (
    lowerMessage.includes("generate workflow") ||
    lowerMessage.includes("create workflow") ||
    lowerMessage.includes("workflow for") ||
    lowerMessage.includes("automation for") ||
    lowerMessage.includes("process for")
  ) {
    // Extract role from message
    const roleMatch = message.match(/(?:for|role|as)\s+(\w+)/i);
    if (roleMatch) {
      entities.roleName = roleMatch[1];
    }
    
    // Extract workflow purpose
    const purposeMatch = message.match(/(?:workflow|process|automation)\s+(?:for|to)\s+(.+)$/i);
    if (purposeMatch) {
      entities.purpose = purposeMatch[1];
    }
    
    return { intent: "generate_workflow", entities };
  }

  // Help intent
  if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
    return { intent: "help", entities };
  }

  return { intent: "unknown", entities };
}

// Generate a role-based workflow based on the role's permissions
function generateRoleWorkflow(roleName: string, permissions: string[]): string {
  const steps: string[] = [];
  
  // Add common workflow steps based on permissions
  if (permissions.includes("crm")) {
    steps.push(
      "1. Capture lead information",
      "2. Assign to appropriate salesperson",
      "3. Follow up after 24 hours if no response",
      "4. Move to next stage when qualified"
    );
  }
  
  if (permissions.includes("tasks")) {
    steps.push(
      "1. Create task in system",
      "2. Assign to team member",
      "3. Set priority and deadline",
      "4. Track progress daily"
    );
  }
  
  if (permissions.includes("finance")) {
    steps.push(
      "1. Create invoice in system",
      "2. Send to client",
      "3. Track payment status",
      "4. Follow up on overdue payments"
    );
  }
  
  if (permissions.includes("hr")) {
    steps.push(
      "1. Log work hours",
      "2. Verify accuracy",
      "3. Approve time entries",
      "4. Generate reports"
    );
  }
  
  if (permissions.includes("automations")) {
    steps.push(
      "1. Monitor triggers",
      "2. Execute actions",
      "3. Log results",
      "4. Alert if errors occur"
    );
  }
  
  return steps.join("\n");
}


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { intent, entities } = parseIntent(message);
    let response = "";

    switch (intent) {
      case "create_task": {
        if (!entities.title) {
          response = "I'd be happy to create a task for you! Please specify the task title. For example: 'Create task: Review quarterly report'";
          break;
        }

        // Find assignee if mentioned
        let assigneeId: string | null = null;
        if (entities.assigneeName) {
          const user = await prisma.user.findFirst({
            where: {
              organizationId: session.user.organizationId,
              name: { contains: entities.assigneeName },
            },
          });
          if (user) assigneeId = user.id;
        }

        // Create the task
        const task = await prisma.task.create({
          data: {
            title: entities.title,
            priority: (entities.priority as any) || "medium",
            status: "todo",
            assigneeId,
            isAutoAssigned: !entities.assigneeName && !!assigneeId,
            creatorId: session.user.id,
            organizationId: session.user.organizationId,
          },
          include: { assignee: true },
        });

        response = `✅ Task created successfully!

**${task.title}**
- Priority: ${task.priority}
- Status: To Do${
          task.assignee ? `\n- Assigned to: ${task.assignee.name}` : "\n- Unassigned"
        }\n\nYou can view it in the Tasks section.`;
        break;
      }

      case "list_tasks": {
        const tasks = await prisma.task.findMany({
          where: {
            organizationId: session.user.organizationId,
            status: { not: "done" },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { assignee: true },
        });

        if (tasks.length === 0) {
          response = "You don't have any pending tasks. Great job! 🎉\n\nWould you like me to create a new task?";
        } else {
          response = `Here are your recent pending tasks:\n\n${tasks
            .map(
              (t, i) =>
                `${i + 1}. **${t.title}** [${t.priority}]\n   Status: ${t.status}${
                  t.assignee ? ` • ${t.assignee.name}` : ""
                }`
            )
            .join("\n\n")}\n\nWant me to create a new task or update any of these?`;
        }
        break;
      }

      case "get_summary": {
        const [taskStats, dealStats, contactCount] = await Promise.all([
          prisma.task.groupBy({
            by: ["status"],
            where: { organizationId: session.user.organizationId },
            _count: true,
          }),
          prisma.deal.aggregate({
            where: { organizationId: session.user.organizationId },
            _sum: { value: true },
            _count: true,
          }),
          prisma.contact.count({
            where: { organizationId: session.user.organizationId },
          }),
        ]);

        const taskCounts = taskStats.reduce(
          (acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
          },
          {} as Record<string, number>
        );

        response = `📊 **Business Summary**

**Tasks:**
- To Do: ${taskCounts["todo"] || 0}
- In Progress: ${taskCounts["in-progress"] || 0}
- Done: ${taskCounts["done"] || 0}

**CRM:**
- Contacts: ${contactCount}
- Deals: ${dealStats._count || 0}
- Pipeline Value: $${(dealStats._sum.value || 0).toLocaleString()}

Is there anything specific you'd like me to help with?`;
        break;
      }
      
      case "generate_workflow": {
        // Get all roles in the organization
        const roles = await prisma.role.findMany({
          where: { organizationId: session.user.organizationId },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });
        
        if (roles.length === 0) {
          response = "No roles have been defined yet. Please create roles first in the Settings section.\n\nI can help create workflows once you've defined your team roles and their permissions.";
          break;
        }
        
        let targetRole = null;
        
        // If user specified a role name, find it
        if (entities.roleName) {
          targetRole = roles.find(role => 
            role.name.toLowerCase().includes(entities.roleName.toLowerCase())
          );
        }
        
        // If no specific role was mentioned, get the user's current role from database
        if (!targetRole) {
          const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { role: true }
          });
          if (currentUser?.role) {
            targetRole = roles.find(role => role.id === currentUser.role!.id);
          }
        }
        
        // If still no role, use the first role
        if (!targetRole) {
          targetRole = roles[0];
        }
        
        if (targetRole) {
          // Get permissions for the role
          const permissions = targetRole.permissions.map(rp => rp.permission.name);
          
          // Generate workflow based on permissions
          const workflowSteps = generateRoleWorkflow(targetRole.name, permissions);
          
          response = `Here's an automated workflow for the **${targetRole.name}** role:

${workflowSteps}

Would you like me to create this workflow in the automation system? You can customize these steps in the Automations section.`;
        } else {
          response = "I couldn't identify a role to create a workflow for.\n\nPlease specify a role, like: 'Create workflow for Sales Manager' or 'Generate automation for Finance Team'.";
        }
        
        break;
      }

      case "help": {
        response = `👋 Hi! I'm your AI assistant. Here's what I can help you with:

**Task Management:**
- "Create task: [title]" - Create a new task
- "Create urgent task: [title]" - Create high priority task
- "List my tasks" - Show pending tasks
- "Assign task to [name]" - Assign a task

**Workflow Generation:**
- "Generate workflow for [role]" - Create role-based workflow
- "Create automation for Sales" - Generate automation

**General:**
- "Show summary" - Get business overview
- "What's the status?" - Quick status check

Just type naturally and I'll try to understand! For example:
- "Create a task to review the proposal"
- "Add urgent task: Call John about the contract"
- "Generate workflow for Finance Team"
- "What are my tasks for today?"`;
        break;
      }

      default: {
        response = `I'm not quite sure what you're asking for. Here are some things I can help with:

- **Create a task**: "Create task: [title]"
- **List tasks**: "Show my tasks"
- **Get summary**: "Give me a summary"
- **Generate workflow**: "Generate workflow for [role]"
- **Help**: "What can you do?"

Feel free to ask in natural language!`;
      }
    }

    // Save conversation to database
    let conversation = await prisma.chatConversation.findFirst({
      where: {
        messages: {
          some: { userId: session.user.id },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: { title: "Task Assistant" },
      });
    }

    // Save messages
    await prisma.chatMessage.createMany({
      data: [
        {
          content: message,
          role: "user",
          userId: session.user.id,
          conversationId: conversation.id,
        },
        {
          content: response,
          role: "assistant",
          userId: session.user.id,
          conversationId: conversation.id,
        },
      ],
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
