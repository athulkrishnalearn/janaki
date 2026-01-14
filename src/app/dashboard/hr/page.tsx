"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  Award,
  Bell,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function HRDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    upcomingReviews: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch employees count
      const empRes = await fetch("/api/employees");
      const empData = await empRes.json();
      const employees = empData.employees || [];
      
      setStats({
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e: any) => e.status === "active").length,
        pendingLeaves: 0, // Will be populated from leaves API
        todayAttendance: 0, // Will be populated from attendance API
        upcomingReviews: 0, // Will be populated from reviews API
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const modules = [
    {
      title: "Employees",
      icon: Users,
      description: "Manage employee records and profiles",
      href: "/dashboard/hr/employees",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Attendance",
      icon: Clock,
      description: "Track clock-in/out and work hours",
      href: "/dashboard/hr/attendance",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Leave Management",
      icon: Calendar,
      description: "Approve and manage leave requests",
      href: "/dashboard/hr/leaves",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Payroll",
      icon: DollarSign,
      description: "Generate payslips and manage salaries",
      href: "/dashboard/hr/payroll",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Performance Reviews",
      icon: Award,
      description: "Conduct employee performance appraisals",
      href: "/dashboard/hr/reviews",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Documents",
      icon: FileText,
      description: "Employee documents and certificates",
      href: "/dashboard/hr/documents",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Announcements",
      icon: Bell,
      description: "Company-wide announcements and policies",
      href: "/dashboard/hr/announcements",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "Holidays",
      icon: Calendar,
      description: "Manage holiday calendar",
      href: "/dashboard/hr/holidays",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Human Resources</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive HR management system
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeEmployees} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAttendance}</div>
            <p className="text-xs text-muted-foreground">Employees present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews Due</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingReviews}</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="outline" className="text-xs">Current Month</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
      </div>

      {/* HR Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((module) => (
          <Link key={module.title} href={module.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className={`${module.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <module.icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/hr/employees">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </Link>
            <Link href="/dashboard/hr/payroll">
              <Button variant="outline" size="sm">
                <DollarSign className="mr-2 h-4 w-4" />
                Generate Payslips
              </Button>
            </Link>
            <Link href="/dashboard/hr/leaves">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Review Leaves
              </Button>
            </Link>
            <Link href="/dashboard/hr/announcements">
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                New Announcement
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
