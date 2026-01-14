"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function CRMReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Reports</h1>
        <p className="text-muted-foreground mt-1">Analytics and insights</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Reports Coming Soon</h3>
          <p className="text-muted-foreground">View detailed analytics and performance metrics</p>
        </CardContent>
      </Card>
    </div>
  );
}
