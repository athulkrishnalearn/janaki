"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Handshake,
  ClipboardList,
  DollarSign,
  UserCog,
  Clock,
  Bot,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Bell,
  Search,
  Menu,
  FileText,
  Zap,
  Ticket,
  Monitor,
  Calendar,
  Award,
  Briefcase,
  Receipt,
  CreditCard,
  Wallet,
  TrendingUp,
  PieChart,
  Building,
  Repeat,
  BarChart3,
  Database,
  Phone,
  Mail,
  MessageSquare,
  Layers,
  Image,
  Key,
  Globe,
  Target,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
  },
  {
    name: "CRM",
    icon: Handshake,
    permission: "crm",
    children: [
      { name: "Overview", href: "/dashboard/crm", icon: TrendingUp, permission: "crm" },
      { name: "Contacts", href: "/dashboard/crm/contacts", icon: Users, permission: "crm" },
      { name: "Companies", href: "/dashboard/crm/companies", icon: Building, permission: "crm" },
      { name: "Deals", href: "/dashboard/crm/deals", icon: Handshake, permission: "crm" },
      { name: "Pipelines", href: "/dashboard/crm/pipelines", icon: ClipboardList, permission: "crm" },
      { name: "Contact Forms", href: "/dashboard/crm/contact-forms", icon: MessageSquare, permission: "crm" },
      { name: "Activities", href: "/dashboard/crm/activities", icon: Phone, permission: "crm" },
      { name: "Emails", href: "/dashboard/crm/emails", icon: Mail, permission: "crm" },
      { name: "Reports", href: "/dashboard/crm/reports", icon: BarChart3, permission: "crm" },
    ],
  },
  {
    name: "CMS",
    icon: Database,
    permission: "cms",
    children: [
      { name: "Overview", href: "/dashboard/cms", icon: Layers, permission: "cms" },
      { name: "Content Types", href: "/dashboard/cms/content-types", icon: Database, permission: "cms" },
      { name: "Content", href: "/dashboard/cms/contents", icon: FileText, permission: "cms" },
      { name: "Media Library", href: "/dashboard/cms/media", icon: Image, permission: "cms" },
      { name: "API Tokens", href: "/dashboard/cms/api-tokens", icon: Key, permission: "cms" },
    ],
  },
  {
    name: "Landing Pages",
    icon: Globe,
    permission: "landing",
    children: [
      { name: "All Pages", href: "/dashboard/landing/pages", icon: Globe, permission: "landing" },
      { name: "Campaigns", href: "/dashboard/landing/campaigns", icon: Target, permission: "landing" },
      { name: "Analytics", href: "/dashboard/landing/analytics", icon: BarChart3, permission: "landing" },
    ],
  },
  {
    name: "Tasks & Projects",
    icon: ClipboardList,
    permission: "tasks",
    children: [
      { name: "Tasks", href: "/dashboard/tasks", icon: ClipboardList, permission: "tasks" },
      { name: "Projects", href: "/dashboard/tasks/projects", icon: FolderKanban, permission: "tasks" },
      { name: "Templates", href: "/dashboard/tasks/templates", icon: Layers, permission: "tasks" },
    ],
  },
  {
    name: "HR Management",
    icon: UserCog,
    permission: "hr",
    children: [
      { name: "Employees", href: "/dashboard/hr/employees", icon: Users, permission: "hr" },
      { name: "Attendance", href: "/dashboard/hr/attendance", icon: Clock, permission: "hr" },
      { name: "Leave Management", href: "/dashboard/hr/leaves", icon: Calendar, permission: "hr" },
      { name: "Payroll", href: "/dashboard/hr/payroll", icon: DollarSign, permission: "hr" },
      { name: "Performance Reviews", href: "/dashboard/hr/reviews", icon: Award, permission: "hr" },
      { name: "Documents", href: "/dashboard/hr/documents", icon: FileText, permission: "hr" },
      { name: "Announcements", href: "/dashboard/hr/announcements", icon: Bell, permission: "hr" },
      { name: "Holidays", href: "/dashboard/hr/holidays", icon: Calendar, permission: "hr" },
      { name: "Time Tracking", href: "/dashboard/hr/time-tracking", icon: Clock, permission: "hr" },
      { name: "Work Targets", href: "/dashboard/hr/targets", icon: ClipboardList, permission: "hr" },
    ],
  },
  {
    name: "Tasks",
    href: "/dashboard/tasks",
    icon: ClipboardList,
    permission: "tasks",
  },
  {
    name: "Finance",
    icon: DollarSign,
    permission: "finance",
    children: [
      { name: "Overview", href: "/dashboard/finance", icon: TrendingUp, permission: "finance" },
      { name: "Invoices", href: "/dashboard/finance/invoices", icon: FileText, permission: "finance" },
      { name: "Expenses", href: "/dashboard/finance/expenses", icon: Receipt, permission: "finance" },
      { name: "Payments", href: "/dashboard/finance/payments", icon: CreditCard, permission: "finance" },
      { name: "Vendors", href: "/dashboard/finance/vendors", icon: Building, permission: "finance" },
      { name: "Bank Accounts", href: "/dashboard/finance/accounts", icon: Wallet, permission: "finance" },
      { name: "Budgets", href: "/dashboard/finance/budgets", icon: PieChart, permission: "finance" },
      { name: "Recurring Bills", href: "/dashboard/finance/recurring", icon: Repeat, permission: "finance" },
      { name: "Tax Settings", href: "/dashboard/finance/tax", icon: FileText, permission: "finance" },
      { name: "Reports", href: "/dashboard/finance/reports", icon: BarChart3, permission: "finance" },
    ],
  },
  {
    name: "Employee Monitor",
    href: "/dashboard/monitor",
    icon: Monitor,
    permission: "monitoring",
  },
  {
    name: "Automations",
    href: "/dashboard/automations",
    icon: Zap,
    permission: "automations",
  },
  {
    name: "AI Assistant",
    href: "/dashboard/assistant",
    icon: Bot,
    permission: "assistant",
  },
  {
    name: "Support Tickets",
    href: "/dashboard/tickets",
    icon: Ticket,
    permission: "tickets",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permission: "settings",
  },
];

function NavItem({ item, pathname, userPermissions }: { item: typeof navigation[0]; pathname: string; userPermissions: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = "children" in item && item.children;
  const isActive = item.href === pathname || item.children?.some((child) => child.href === pathname);
  
  // Check if user has permission to view this item
  const hasPermission = userPermissions.includes(item.permission);
  
  // Filter children based on permissions
  const visibleChildren = hasChildren ? 
    (item.children as any[]).filter(child => userPermissions.includes(child.permission)) : [];
  
  // Don't render if no permission
  if (!hasPermission) return null;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="flex-1 text-left">{item.name}</span>
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
          />
        </button>
        {isOpen && visibleChildren.length > 0 && (
          <div className="ml-4 space-y-1 border-l pl-4">
            {visibleChildren.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                  pathname === child.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <child.icon className="h-4 w-4" />
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        pathname === item.href
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.name}
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Get user permissions from session
  const userPermissions = session?.user?.permissions || [];

  return (
    <div className="flex h-full flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4 border-b">
        <div className="p-2 bg-primary rounded-lg">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg">JANAKI</span>
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {session?.user?.organizationName}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} pathname={pathname} userPermissions={userPermissions} />
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/profile">
                <UserCog className="mr-2 h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search anything..."
            className="pl-9 bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/dashboard/notifications">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              3
            </Badge>
          </Link>
        </Button>
        <div className="hidden lg:flex items-center gap-2 ml-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{session?.user?.name}</span>
        </div>
      </div>
    </header>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
