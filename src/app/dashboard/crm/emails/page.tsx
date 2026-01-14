"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Plus } from "lucide-react";

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Emails</h1>
          <p className="text-muted-foreground mt-1">Email integration and tracking</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Compose Email
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Email Integration Coming Soon</h3>
          <p className="text-muted-foreground">Connect your email and track all correspondence</p>
        </CardContent>
      </Card>
    </div>
  );
}
