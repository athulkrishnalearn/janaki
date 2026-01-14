"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Plus } from "lucide-react";

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-muted-foreground mt-1">Track calls, meetings, and interactions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Log Activity
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Phone className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Activities Coming Soon</h3>
          <p className="text-muted-foreground">Log and track all customer interactions</p>
        </CardContent>
      </Card>
    </div>
  );
}
