"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Handshake, Loader2, DollarSign, User, GripVertical } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: string;
  stageId: string | null;
  contact: { firstName: string; lastName: string; company: string | null } | null;
  owner: { name: string } | null;
  stage: { name: string; color: string } | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

const defaultFormData = {
  title: "",
  value: 0,
  contactId: "",
  notes: "",
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  const fetchData = async () => {
    try {
      const [dealsRes, pipelinesRes, contactsRes] = await Promise.all([
        fetch("/api/deals"),
        fetch("/api/pipelines"),
        fetch("/api/contacts?limit=100"),
      ]);

      const dealsData = await dealsRes.json();
      const pipelinesData = await pipelinesRes.json();
      const contactsData = await contactsRes.json();

      setDeals(dealsData.deals || []);
      setPipelines(pipelinesData.pipelines || []);
      setContacts(contactsData.contacts || []);

      if (pipelinesData.pipelines?.length > 0 && !selectedPipeline) {
        setSelectedPipeline(pipelinesData.pipelines[0]);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pipelineId: selectedPipeline?.id,
          stageId: selectedPipeline?.stages[0]?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create deal");
      }

      toast.success("Deal created successfully");
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create deal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });

      if (!response.ok) throw new Error("Failed to update deal");

      setDeals((prev) =>
        prev.map((deal) => (deal.id === dealId ? { ...deal, stageId } : deal))
      );
      toast.success("Deal moved successfully");
    } catch (error) {
      toast.error("Failed to move deal");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getDealsForStage = (stageId: string) => {
    return deals.filter((deal) => deal.stageId === stageId);
  };

  const getStageValue = (stageId: string) => {
    return getDealsForStage(stageId).reduce((acc, deal) => acc + deal.value, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <div className="flex items-center gap-4">
          {pipelines.length > 1 && (
            <Select
              value={selectedPipeline?.id}
              onValueChange={(value) => {
                const pipeline = pipelines.find((p) => p.id === value);
                setSelectedPipeline(pipeline || null);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Deal</DialogTitle>
                <DialogDescription>Add a new deal to your pipeline</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Deal Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Enterprise Software License"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Value ($)</Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact</Label>
                    <Select
                      value={formData.contactId}
                      onValueChange={(value) => setFormData({ ...formData, contactId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Deal
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedPipeline ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Handshake className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No pipeline found</h3>
          <p className="text-muted-foreground">Create a pipeline to start managing deals</p>
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {selectedPipeline.stages.map((stage) => {
              const stageDeals = getDealsForStage(stage.id);
              const stageValue = getStageValue(stage.id);

              return (
                <div
                  key={stage.id}
                  className="w-80 flex-shrink-0"
                  onDrop={(e) => handleDrop(e, stage.id)}
                  onDragOver={handleDragOver}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {stageDeals.length}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${stageValue.toLocaleString()}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 min-h-[300px]">
                      {stageDeals.map((deal) => (
                        <Card
                          key={deal.id}
                          className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight">
                                {deal.title}
                              </h4>
                              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              <span>${deal.value.toLocaleString()}</span>
                            </div>
                            {deal.contact && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>
                                  {deal.contact.firstName} {deal.contact.lastName}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                          Drop deals here
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
