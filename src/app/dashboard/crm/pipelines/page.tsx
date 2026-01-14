import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PipelinesPage() {
  const session = await getServerSession(authOptions);
  
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: session!.user.organizationId },
    include: {
      stages: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: { deals: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipelines</h1>
        <p className="text-muted-foreground">Manage your sales pipelines and stages</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                {pipeline.isDefault && <Badge>Default</Badge>}
              </div>
              <CardDescription>
                {pipeline._count.deals} deals • {pipeline.stages.length} stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pipeline.stages.map((stage) => (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm">{stage.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {stage.probability}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
