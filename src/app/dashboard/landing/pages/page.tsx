"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Plus } from "lucide-react";

export default function LandingPagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground mt-1">Create and manage campaign landing pages</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Landing Page
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Landing Pages Coming Soon</h3>
          <p className="text-muted-foreground">Build beautiful landing pages for your campaigns</p>
        </CardContent>
      </Card>
    </div>
  );
}
