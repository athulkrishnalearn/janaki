import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Handshake,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

async function getDashboardData(organizationId: string) {
  const [contacts, deals, tasks, employees, recentTasks, recentDeals] = await Promise.all([
    prisma.contact.count({ where: { organizationId } }),
    prisma.deal.findMany({
      where: { organizationId },
      select: { value: true, status: true },
    }),
    prisma.task.findMany({
      where: { organizationId },
      select: { status: true },
    }),
    prisma.employee.count({ where: { organizationId } }),
    prisma.task.findMany({
      where: { organizationId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { assignee: { select: { name: true } } },
    }),
    prisma.deal.findMany({
      where: { organizationId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { contact: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const totalDealValue = deals.reduce((acc, deal) => acc + deal.value, 0);
  const wonDeals = deals.filter((d) => d.status === "won");
  const wonDealValue = wonDeals.reduce((acc, deal) => acc + deal.value, 0);

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return {
    contacts,
    deals: deals.length,
    totalDealValue,
    wonDealValue,
    employees,
    taskStats,
    recentTasks,
    recentDeals,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData(session!.user.organizationId);

  const stats = [
    {
      title: "Total Contacts",
      value: data.contacts,
      icon: Users,
      description: "Active leads and customers",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Deals",
      value: data.deals,
      icon: Handshake,
      description: `$${data.totalDealValue.toLocaleString()} pipeline value`,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Revenue Won",
      value: `$${data.wonDealValue.toLocaleString()}`,
      icon: DollarSign,
      description: "Total closed deals",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Team Members",
      value: data.employees,
      icon: Users,
      description: "Active employees",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/crm/contacts">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Contacts
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.contacts}</div>
              <p className="text-xs text-muted-foreground mt-1">Active leads and customers</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/crm/deals">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Deals
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-100">
                <Handshake className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.deals}</div>
              <p className="text-xs text-muted-foreground mt-1">${data.totalDealValue.toLocaleString()} pipeline value</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/finance">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue Won
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.wonDealValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total closed deals</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/hr/employees">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team Members
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-100">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.employees}</div>
              <p className="text-xs text-muted-foreground mt-1">Active employees</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Task Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/tasks?status=todo">
          <Card className="border-l-4 border-l-slate-400 cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">To Do</p>
                  <p className="text-2xl font-bold">{data.taskStats.todo}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/tasks?status=in-progress">
          <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{data.taskStats.inProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/tasks?status=done">
          <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{data.taskStats.done}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/tasks">
          <Card className="border-l-4 border-l-orange-500 cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{data.taskStats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
            <CardDescription>Latest tasks in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks yet. Create your first task!
              </p>
            ) : (
              <div className="space-y-4">
                {data.recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.status === "done"
                            ? "bg-green-500"
                            : task.status === "in-progress"
                            ? "bg-blue-500"
                            : "bg-slate-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.assignee?.name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {task.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Recent Deals
            </CardTitle>
            <CardDescription>Latest deals in your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No deals yet. Create your first deal!
              </p>
            ) : (
              <div className="space-y-4">
                {data.recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          deal.status === "won"
                            ? "bg-green-500"
                            : deal.status === "lost"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.contact
                            ? `${deal.contact.firstName} ${deal.contact.lastName}`
                            : "No contact"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      ${deal.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can do right now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/dashboard/crm/contacts"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium">Add Contact</span>
            </a>
            <a
              href="/dashboard/crm/deals"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Handshake className="h-8 w-8 text-purple-600" />
              <span className="text-sm font-medium">Create Deal</span>
            </a>
            <a
              href="/dashboard/tasks"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <ClipboardList className="h-8 w-8 text-green-600" />
              <span className="text-sm font-medium">New Task</span>
            </a>
            <a
              href="/dashboard/finance/invoices"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <DollarSign className="h-8 w-8 text-orange-600" />
              <span className="text-sm font-medium">Create Invoice</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
