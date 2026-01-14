"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Zap, Loader2, Clock, Bell, Mail, ClipboardList, Play, Pause, ArrowRight } from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  actions: Record<string, unknown>[];
  lastRunAt: string | null;
  runCount: number;
}

const triggerTypes = [
  { value: "time", label: "Scheduled Time", icon: Clock, description: "Run at specific times" },
  { value: "event", label: "Event Trigger", icon: Bell, description: "When something happens" },
  { value: "condition", label: "Condition Met", icon: ClipboardList, description: "When conditions are true" },
];

const actionTypes = [
  { value: "create_task", label: "Create Task", icon: ClipboardList },
  { value: "send_notification", label: "Send Notification", icon: Bell },
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "update_status", label: "Update Status", icon: Zap },
];

const defaultFormData = {
  name: "",
  description: "",
  triggerType: "event",
  triggerConfig: {},
  actions: [{ type: "create_task", config: {} }],
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  const fetchAutomations = async () => {
    try {
      const response = await fetch("/api/automations");
      const data = await response.json();
      setAutomations(data.automations || []);
    } catch (error) {
      toast.error("Failed to fetch automations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create automation");
      }

      toast.success("Automation created successfully");
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      fetchAutomations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create automation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">Create workflows to automate repetitive tasks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Button>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation</DialogTitle>
              <DialogDescription>
                Set up a workflow to automate tasks in your organization
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Automation Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Auto-assign urgent tasks"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Trigger Selection */}
                <div className="space-y-3">
                  <Label>Trigger (When should this run?)</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {triggerTypes.map((trigger) => (
                      <Card
                        key={trigger.value}
                        className={`cursor-pointer transition-all ${
                          formData.triggerType === trigger.value
                            ? "border-primary ring-2 ring-primary/20"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setFormData({ ...formData, triggerType: trigger.value })}
                      >
                        <CardContent className="pt-4 text-center">
                          <trigger.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="font-medium text-sm">{trigger.label}</p>
                          <p className="text-xs text-muted-foreground">{trigger.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Trigger Config */}
                {formData.triggerType === "event" && (
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select
                      value={(formData.triggerConfig as any).event || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          triggerConfig: { ...formData.triggerConfig, event: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task_created">Task Created</SelectItem>
                        <SelectItem value="deal_created">Deal Created</SelectItem>
                        <SelectItem value="contact_created">Contact Created</SelectItem>
                        <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
                        <SelectItem value="task_overdue">Task Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.triggerType === "time" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Run At</Label>
                      <Input
                        type="time"
                        value={(formData.triggerConfig as any).time || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            triggerConfig: { ...formData.triggerConfig, time: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={(formData.triggerConfig as any).frequency || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            triggerConfig: { ...formData.triggerConfig, frequency: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <Label>Actions (What should happen?)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {actionTypes.map((action) => (
                      <Card
                        key={action.value}
                        className={`cursor-pointer transition-all ${
                          formData.actions[0]?.type === action.value
                            ? "border-primary ring-2 ring-primary/20"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            actions: [{ type: action.value, config: {} }],
                          })
                        }
                      >
                        <CardContent className="pt-4 flex items-center gap-3">
                          <action.icon className="h-5 w-5 text-primary" />
                          <span className="font-medium text-sm">{action.label}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Automation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No automations yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first automation to streamline workflows
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {automations.map((automation) => (
            <Card key={automation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{automation.name}</CardTitle>
                    {automation.description && (
                      <CardDescription>{automation.description}</CardDescription>
                    )}
                  </div>
                  <Switch checked={automation.isActive} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="capitalize">
                    {automation.triggerType}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">
                    {automation.actions.length} action(s)
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {automation.isActive ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Play className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Pause className="h-3 w-3" />
                        Paused
                      </span>
                    )}
                  </span>
                  <span>Run {automation.runCount} times</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
