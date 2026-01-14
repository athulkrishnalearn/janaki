import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default async function WorkTargetsPage() {
  const session = await getServerSession(authOptions);

  const workTargets = await prisma.workTarget.findMany({
    where: { organizationId: session!.user.organizationId },
    include: {
      employee: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { endDate: "asc" },
  });

  const statusColors: Record<string, string> = {
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    missed: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Targets</h1>
          <p className="text-muted-foreground">Track employee goals and KPIs</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Targets</p>
                <p className="text-2xl font-bold">{workTargets.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {workTargets.filter((t) => t.status === "in-progress").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {workTargets.filter((t) => t.status === "completed").length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {workTargets.length > 0
                    ? Math.round(
                        workTargets.reduce(
                          (acc, t) => acc + (t.currentValue / t.targetValue) * 100,
                          0
                        ) / workTargets.length
                      )
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {workTargets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No work targets yet</h3>
            <p className="text-muted-foreground">Create targets to track employee performance</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workTargets.map((target) => {
            const progress = Math.min((target.currentValue / target.targetValue) * 100, 100);

            return (
              <Card key={target.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{target.title}</CardTitle>
                      <CardDescription>{target.employee.user.name}</CardDescription>
                    </div>
                    <Badge className={statusColors[target.status]}>{target.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {target.description && (
                    <p className="text-sm text-muted-foreground">{target.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">
                        {target.currentValue} / {target.targetValue} {target.unit}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Period: {target.period}</span>
                    <span>Due: {format(new Date(target.endDate), "MMM d")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
