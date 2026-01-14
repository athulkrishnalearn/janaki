"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GraduationCap, Briefcase, Users, Rocket, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  pipelineStages: Array<{
    name: string;
    description: string;
    automations: any[];
  }>;
}

const iconMap: Record<string, any> = {
  GraduationCap,
  Briefcase,
  Users,
  Rocket,
};

export default function IndustrySettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/industry/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      toast.error("Failed to load industry templates");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;
    
    setApplying(true);
    try {
      const response = await fetch("/api/industry/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industryId: selectedTemplate.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to apply template");
      }

      toast.success(`${selectedTemplate.name} template applied successfully!`);
      setConfirmDialogOpen(false);
      
      // Redirect to CRM pipeline page
      setTimeout(() => {
        router.push("/dashboard/crm/pipelines");
      }, 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply template");
    } finally {
      setApplying(false);
    }
  };

  const openConfirmDialog = (template: IndustryTemplate) => {
    setSelectedTemplate(template);
    setConfirmDialogOpen(true);
  };

  if (!session?.user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only admins can configure industry settings</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Industry-Specific CRM</h1>
        <p className="text-muted-foreground mt-2">
          Choose an industry template to set up your CRM with intelligent pipelines and automation
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((template) => {
            const Icon = iconMap[template.icon] || Briefcase;
            
            return (
              <Card key={template.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Pipeline Stages</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.pipelineStages.slice(0, 5).map((stage, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {stage.name}
                          </Badge>
                        ))}
                        {template.pipelineStages.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.pipelineStages.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Automation Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          Automatic task creation
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          Follow-up reminders
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          Failure signal detection
                        </li>
                      </ul>
                    </div>

                    <Button 
                      onClick={() => openConfirmDialog(template)}
                      className="w-full"
                    >
                      Apply This Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Industry Template?</DialogTitle>
            <DialogDescription>
              This will replace your current CRM pipeline with the{" "}
              <span className="font-semibold">{selectedTemplate?.name}</span> template.
              <br /><br />
              <strong>What will happen:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>✅ {selectedTemplate?.pipelineStages.length} detailed pipeline stages</li>
                <li>✅ Intelligent automation rules for each stage</li>
                <li>✅ Automatic task creation and reminders</li>
                <li>✅ Custom fields specific to this industry</li>
              </ul>
              <br />
              <strong className="text-orange-600">Note:</strong> Your existing pipeline stages will be replaced.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={applying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyTemplate}
              disabled={applying}
            >
              {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
