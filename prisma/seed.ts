import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  { name: "dashboard", label: "Dashboard", description: "Access to main dashboard", icon: "LayoutDashboard" },
  { name: "crm", label: "CRM", description: "Access to contacts, deals, and pipelines", icon: "Handshake" },
  { name: "hr", label: "HR Management", description: "Access to employees, time tracking, and targets", icon: "UserCog" },
  { name: "tasks", label: "Task Management", description: "Access to task management", icon: "ClipboardList" },
  { name: "finance", label: "Finance", description: "Access to invoices and expenses", icon: "DollarSign" },
  { name: "automations", label: "Automations", description: "Access to workflow automations", icon: "Zap" },
  { name: "assistant", label: "AI Assistant", description: "Access to AI chatbot", icon: "Bot" },
  { name: "settings", label: "Settings", description: "Access to settings", icon: "Settings" },
  { name: "monitoring", label: "Employee Monitoring", description: "Access to employee monitoring", icon: "Monitor" },
  { name: "tickets", label: "Support Tickets", description: "Access to raise and view tickets", icon: "Ticket" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🗑️  Clearing existing data...");
  await prisma.webhookLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.ticketResponse.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.workTarget.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.category.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.permission.deleteMany();

  // Create permissions
  console.log("✅ Creating permissions...");
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  // Create organization
  console.log("🏢 Creating organization...");
  const organization = await prisma.organization.create({
    data: {
      name: "Acme Corporation",
      slug: "acme-corp-" + Date.now(),
      industry: "Technology",
      address: "123 Tech Street, San Francisco, CA 94105",
      phone: "+1 (555) 123-4567",
      website: "https://acme-corp.example.com",
      onboardingCompleted: true,
    },
  });

  // Create roles
  console.log("👥 Creating roles...");
  
  // Admin role - all permissions
  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Full access to all features",
      isSystem: true,
      canManageUsers: true,
      canManageRoles: true,
      organizationId: organization.id,
      permissions: {
        create: allPermissions.map(p => ({ permissionId: p.id })),
      },
    },
  });

  // Sales Manager role - CRM, tasks, assistant
  const salesManagerRole = await prisma.role.create({
    data: {
      name: "Sales Manager",
      description: "Access to CRM and team management",
      isSystem: false,
      canManageUsers: false,
      canManageRoles: false,
      organizationId: organization.id,
      permissions: {
        create: allPermissions
          .filter(p => ["dashboard", "crm", "tasks", "assistant", "tickets"].includes(p.name))
          .map(p => ({ permissionId: p.id })),
      },
    },
  });

  // Finance Manager role - Finance, dashboard
  const financeManagerRole = await prisma.role.create({
    data: {
      name: "Finance Manager",
      description: "Access to financial modules",
      isSystem: false,
      canManageUsers: false,
      canManageRoles: false,
      organizationId: organization.id,
      permissions: {
        create: allPermissions
          .filter(p => ["dashboard", "finance", "tickets"].includes(p.name))
          .map(p => ({ permissionId: p.id })),
      },
    },
  });

  // HR Manager role - HR, employees
  const hrManagerRole = await prisma.role.create({
    data: {
      name: "HR Manager",
      description: "Access to HR and employee management",
      isSystem: false,
      canManageUsers: false,
      canManageRoles: false,
      organizationId: organization.id,
      permissions: {
        create: allPermissions
          .filter(p => ["dashboard", "hr", "tasks", "tickets"].includes(p.name))
          .map(p => ({ permissionId: p.id })),
      },
    },
  });

  // Sales Rep role - CRM only
  const salesRepRole = await prisma.role.create({
    data: {
      name: "Sales Representative",
      description: "Access to CRM for sales activities",
      isSystem: false,
      canManageUsers: false,
      canManageRoles: false,
      organizationId: organization.id,
      permissions: {
        create: allPermissions
          .filter(p => ["dashboard", "crm", "tasks", "tickets"].includes(p.name))
          .map(p => ({ permissionId: p.id })),
      },
    },
  });

  // Create users
  console.log("👤 Creating users...");
  const password = await hash("password123", 12);

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@acme.com",
      password,
      isAdmin: true,
      roleId: adminRole.id,
      organizationId: organization.id,
    },
  });

  const salesManager = await prisma.user.create({
    data: {
      name: "Sarah Johnson",
      email: "sarah.johnson@acme.com",
      password,
      roleId: salesManagerRole.id,
      organizationId: organization.id,
    },
  });

  const financeManager = await prisma.user.create({
    data: {
      name: "Michael Chen",
      email: "michael.chen@acme.com",
      password,
      roleId: financeManagerRole.id,
      organizationId: organization.id,
    },
  });

  const hrManager = await prisma.user.create({
    data: {
      name: "Emily Rodriguez",
      email: "emily.rodriguez@acme.com",
      password,
      roleId: hrManagerRole.id,
      organizationId: organization.id,
    },
  });

  const salesRep1 = await prisma.user.create({
    data: {
      name: "David Miller",
      email: "david.miller@acme.com",
      password,
      roleId: salesRepRole.id,
      organizationId: organization.id,
    },
  });

  const salesRep2 = await prisma.user.create({
    data: {
      name: "Jennifer Wilson",
      email: "jennifer.wilson@acme.com",
      password,
      roleId: salesRepRole.id,
      organizationId: organization.id,
    },
  });

  // Create pipeline and stages
  console.log("📊 Creating sales pipeline...");
  const pipeline = await prisma.pipeline.create({
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
    include: { stages: true },
  });

  // Create categories
  console.log("🏷️  Creating categories...");
  await prisma.category.createMany({
    data: [
      { name: "General", color: "#6b7280", type: "task", organizationId: organization.id },
      { name: "Development", color: "#3b82f6", type: "task", organizationId: organization.id },
      { name: "Marketing", color: "#8b5cf6", type: "task", organizationId: organization.id },
      { name: "Sales", color: "#10b981", type: "task", organizationId: organization.id },
      { name: "Office Supplies", color: "#6b7280", type: "expense", organizationId: organization.id },
      { name: "Travel", color: "#3b82f6", type: "expense", organizationId: organization.id },
      { name: "Software", color: "#8b5cf6", type: "expense", organizationId: organization.id },
      { name: "Marketing Expense", color: "#f59e0b", type: "expense", organizationId: organization.id },
    ],
  });

  const categories = await prisma.category.findMany({ where: { organizationId: organization.id } });
  const taskCategory = categories.find(c => c.name === "Sales")!;
  const expenseCategory = categories.find(c => c.name === "Office Supplies")!;

  // Create contacts
  console.log("📇 Creating contacts...");
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@techcorp.com",
        phone: "+1 (555) 234-5678",
        companyName: "TechCorp Industries",
        position: "CEO",
        status: "customer",
        source: "referral",
        organizationId: organization.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Alice",
        lastName: "Brown",
        email: "alice.brown@startupxyz.com",
        phone: "+1 (555) 345-6789",
        companyName: "StartupXYZ",
        position: "CTO",
        status: "prospect",
        source: "website",
        organizationId: organization.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Robert",
        lastName: "Taylor",
        email: "robert.taylor@megacorp.com",
        phone: "+1 (555) 456-7890",
        companyName: "MegaCorp Ltd",
        position: "Procurement Manager",
        status: "lead",
        source: "website",
        organizationId: organization.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Lisa",
        lastName: "Anderson",
        email: "lisa.anderson@globalinc.com",
        phone: "+1 (555) 567-8901",
        companyName: "Global Inc",
        position: "VP of Sales",
        status: "lead",
        source: "linkedin",
        organizationId: organization.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Mark",
        lastName: "Davis",
        email: "mark.davis@innovate.com",
        phone: "+1 (555) 678-9012",
        companyName: "Innovate Solutions",
        position: "Director of IT",
        status: "prospect",
        source: "referral",
        organizationId: organization.id,
      },
    }),
  ]);

  // Create deals
  console.log("💰 Creating deals...");
  await Promise.all([
    prisma.deal.create({
      data: {
        title: "Enterprise Software License",
        value: 50000,
        status: "open",
        probability: 70,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: "Large enterprise deal, needs approval from board",
        organizationId: organization.id,
        contactId: contacts[0].id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[3].id, // Negotiation
        creatorId: salesManager.id,
        ownerId: salesRep1.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Annual Subscription",
        value: 12000,
        status: "open",
        probability: 50,
        expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        organizationId: organization.id,
        contactId: contacts[1].id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[2].id, // Proposal
        creatorId: salesRep1.id,
        ownerId: salesRep1.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Consulting Services",
        value: 8000,
        status: "open",
        probability: 30,
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        organizationId: organization.id,
        contactId: contacts[2].id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[1].id, // Qualified
        creatorId: salesRep2.id,
        ownerId: salesRep2.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Training Package",
        value: 5000,
        status: "won",
        probability: 100,
        expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        organizationId: organization.id,
        contactId: contacts[4].id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[4].id, // Closed Won
        creatorId: salesRep1.id,
        ownerId: salesRep1.id,
      },
    }),
  ]);

  // Create employees
  console.log("👨‍💼 Creating employees...");
  await Promise.all([
    prisma.employee.create({
      data: {
        employeeId: "EMP001",
        department: "Sales",
        position: "Sales Manager",
        salary: 85000,
        hireDate: new Date("2022-03-15"),
        status: "active",
        userId: salesManager.id,
        organizationId: organization.id,
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: "EMP002",
        department: "Finance",
        position: "Finance Manager",
        salary: 90000,
        hireDate: new Date("2021-08-01"),
        status: "active",
        userId: financeManager.id,
        organizationId: organization.id,
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: "EMP003",
        department: "Human Resources",
        position: "HR Manager",
        salary: 80000,
        hireDate: new Date("2022-01-10"),
        status: "active",
        userId: hrManager.id,
        organizationId: organization.id,
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: "EMP004",
        department: "Sales",
        position: "Sales Representative",
        salary: 55000,
        hireDate: new Date("2023-05-20"),
        status: "active",
        userId: salesRep1.id,
        organizationId: organization.id,
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: "EMP005",
        department: "Sales",
        position: "Sales Representative",
        salary: 52000,
        hireDate: new Date("2023-07-15"),
        status: "active",
        userId: salesRep2.id,
        organizationId: organization.id,
      },
    }),
  ]);

  // Create tasks
  console.log("✅ Creating tasks...");
  await Promise.all([
    prisma.task.create({
      data: {
        title: "Follow up with TechCorp Industries",
        description: "Send proposal and schedule demo meeting",
        status: "in-progress",
        priority: "high",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        estimatedHours: 3,
        organizationId: organization.id,
        creatorId: salesManager.id,
        assigneeId: salesRep1.id,
        contactId: contacts[0].id,
        categoryId: taskCategory.id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Prepare Q4 sales report",
        description: "Compile sales data and create presentation",
        status: "todo",
        priority: "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 5,
        organizationId: organization.id,
        creatorId: salesManager.id,
        assigneeId: salesManager.id,
        categoryId: taskCategory.id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Update CRM database",
        description: "Clean up duplicate contacts and update information",
        status: "done",
        priority: "low",
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        estimatedHours: 2,
        actualHours: 2.5,
        organizationId: organization.id,
        creatorId: salesManager.id,
        assigneeId: salesRep2.id,
        categoryId: taskCategory.id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Schedule team meeting",
        description: "Organize monthly sales team sync meeting",
        status: "todo",
        priority: "medium",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        estimatedHours: 1,
        organizationId: organization.id,
        creatorId: salesManager.id,
        assigneeId: salesManager.id,
        categoryId: taskCategory.id,
      },
    }),
  ]);

  // Create invoices
  console.log("💵 Creating invoices...");
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2024-001",
      status: "paid",
      issueDate: new Date("2024-01-01"),
      dueDate: new Date("2024-01-31"),
      subtotal: 5000,
      tax: 500,
      total: 5500,
      currency: "USD",
      clientName: "Innovate Solutions",
      clientEmail: "mark.davis@innovate.com",
      clientAddress: "456 Innovation Ave, Boston, MA 02110",
      notes: "Thank you for your business!",
      organizationId: organization.id,
      creatorId: financeManager.id,
      items: {
        create: [
          {
            description: "Training Package - 5 days",
            quantity: 1,
            unitPrice: 5000,
            total: 5000,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2024-002",
      status: "sent",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      subtotal: 12000,
      tax: 1200,
      total: 13200,
      currency: "USD",
      clientName: "TechCorp Industries",
      clientEmail: "john.smith@techcorp.com",
      clientAddress: "789 Tech Blvd, Austin, TX 78701",
      organizationId: organization.id,
      creatorId: financeManager.id,
      items: {
        create: [
          {
            description: "Annual Software License",
            quantity: 1,
            unitPrice: 12000,
            total: 12000,
          },
        ],
      },
    },
  });

  // Create expenses
  console.log("💳 Creating expenses...");
  await Promise.all([
    prisma.expense.create({
      data: {
        description: "Office supplies - printer paper, pens",
        amount: 150,
        date: new Date("2024-01-10"),
        vendor: "Office Depot",
        status: "approved",
        organizationId: organization.id,
        categoryId: expenseCategory.id,
      },
    }),
    prisma.expense.create({
      data: {
        description: "Client lunch meeting",
        amount: 85,
        date: new Date("2024-01-12"),
        vendor: "Restaurant ABC",
        status: "pending",
        organizationId: organization.id,
        categoryId: expenseCategory.id,
      },
    }),
    prisma.expense.create({
      data: {
        description: "Software subscription - Zoom Pro",
        amount: 199,
        date: new Date("2024-01-05"),
        vendor: "Zoom",
        status: "approved",
        organizationId: organization.id,
        categoryId: categories.find(c => c.name === "Software")!.id,
      },
    }),
  ]);

  // Create tickets
  console.log("🎫 Creating support tickets...");
  await Promise.all([
    prisma.ticket.create({
      data: {
        ticketNumber: "TICKET-001",
        subject: "Need access to finance reports",
        description: "I need access to view the quarterly finance reports. Can you please grant me permission?",
        status: "open",
        priority: "medium",
        category: "technical",
        organizationId: organization.id,
        creatorId: salesRep1.id,
        assigneeId: adminUser.id,
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNumber: "TICKET-002",
        subject: "Password reset request",
        description: "I forgot my password and need help resetting it.",
        status: "resolved",
        priority: "high",
        category: "general",
        organizationId: organization.id,
        creatorId: salesRep2.id,
        assigneeId: adminUser.id,
        responses: {
          create: [
            {
              message: "I've reset your password. You should receive an email shortly.",
              userId: adminUser.id,
            },
          ],
        },
      },
    }),
  ]);

  // Create notifications
  console.log("🔔 Creating notifications...");
  await Promise.all([
    prisma.notification.create({
      data: {
        title: "New deal assigned",
        message: "You've been assigned to the Enterprise Software License deal",
        type: "info",
        userId: salesRep1.id,
      },
    }),
    prisma.notification.create({
      data: {
        title: "Task due soon",
        message: "Follow up with TechCorp Industries is due in 2 days",
        type: "warning",
        userId: salesRep1.id,
      },
    }),
    prisma.notification.create({
      data: {
        title: "Invoice paid",
        message: "Invoice INV-2024-001 has been marked as paid",
        type: "success",
        userId: financeManager.id,
      },
    }),
  ]);

  // Create API Key
  console.log("🔑 Creating API key...");
  await prisma.apiKey.create({
    data: {
      name: "Website Contact Form",
      key: "jnk_demo_key_1234567890abcdef",
      permissions: JSON.stringify(["leads:create", "contacts:read"]),
      organizationId: organization.id,
    },
  });

  console.log("\n✨ Seed completed successfully!\n");
  console.log("📊 Created:");
  console.log("   - 1 Organization (Acme Corporation)");
  console.log("   - 5 Roles (Admin, Sales Manager, Finance Manager, HR Manager, Sales Rep)");
  console.log("   - 6 Users (all password: password123)");
  console.log("     • admin@acme.com (Admin)");
  console.log("     • sarah.johnson@acme.com (Sales Manager)");
  console.log("     • michael.chen@acme.com (Finance Manager)");
  console.log("     • emily.rodriguez@acme.com (HR Manager)");
  console.log("     • david.miller@acme.com (Sales Rep)");
  console.log("     • jennifer.wilson@acme.com (Sales Rep)");
  console.log("   - 5 Contacts");
  console.log("   - 4 Deals");
  console.log("   - 5 Employees");
  console.log("   - 4 Tasks");
  console.log("   - 2 Invoices");
  console.log("   - 3 Expenses");
  console.log("   - 2 Tickets");
  console.log("   - 3 Notifications");
  console.log("   - 1 API Key\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
